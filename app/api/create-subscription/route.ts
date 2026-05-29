import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function normalizeCycle(value: FormDataEntryValue | null) {
  return String(value || "monthly") === "yearly" ? "yearly" : "monthly";
}

function getPlanAmount(plan: any, billingCycle: "monthly" | "yearly") {
  if (billingCycle === "yearly") {
    const yearly = Number(plan.price_yearly || 0);
    if (yearly > 0) return yearly;
  }
  return Number(plan.price_monthly || 0);
}

function getFrequency(billingCycle: "monthly" | "yearly") {
  if (billingCycle === "yearly") return { frequency: 12, frequency_type: "months" };
  return { frequency: 1, frequency_type: "months" };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const planId = String(formData.get("plan_id") || "");
  const billingCycle = normalizeCycle(formData.get("billing_cycle"));

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken || accessToken.includes("xxxxxxxx")) {
    return NextResponse.json(
      { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no .env.local." },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id, email, full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  const { data: plan } = await supabase
    .from("plans")
    .select("id, slug, name, price_monthly, price_yearly, price_label, checkout_url, checkout_url_yearly")
    .eq("id", planId)
    .maybeSingle();

  if (!profile?.account_id || !plan) {
    return NextResponse.json({ error: "Conta ou plano não encontrado." }, { status: 400 });
  }

  const amount = getPlanAmount(plan, billingCycle);
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Este plano não possui preço válido em plans.price_monthly/price_yearly." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("subscription_orders")
    .insert({
      account_id: profile.account_id,
      plan_id: plan.id,
      status: "pending",
      amount,
      currency: "BRL",
      provider: "mercadopago_subscriptions",
      platform: "web",
      billing_cycle: billingCycle,
      store_product_id: plan.slug || plan.name,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message || "Não foi possível criar o pedido." },
      { status: 500 }
    );
  }

  const baseUrl = getBaseUrl(request);
  const { frequency, frequency_type } = getFrequency(billingCycle);

  const mpPayload = {
    reason: `PIRRIU - ${plan.name}`,
    external_reference: order.id,
    payer_email:
      process.env.MERCADO_PAGO_TEST_PAYER_EMAIL ||
      profile.email ||
      auth.user.email,
    back_url: `${baseUrl}/assinatura?checkout=retorno`,
    status: "pending",
    auto_recurring: {
      frequency,
      frequency_type,
      transaction_amount: amount,
      currency_id: "BRL",
    },
  };

  const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(mpPayload),
  });

  const mpData = await mpResponse.json();

  if (!mpResponse.ok) {
    await supabaseAdmin
      .from("subscription_orders")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return NextResponse.json(
      {
        error: "Mercado Pago recusou a criação da assinatura.",
        details: mpData,
      },
      { status: 400 }
    );
  }

  const checkoutUrl = mpData.init_point || mpData.sandbox_init_point || null;
  const mpSubscriptionId = mpData.id || null;

  await supabaseAdmin
    .from("subscription_orders")
    .update({
      checkout_url: checkoutUrl,
      external_payment_id: mpSubscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Mercado Pago não retornou init_point/sandbox_init_point.", details: mpData },
      { status: 400 }
    );
  }

  return NextResponse.redirect(checkoutUrl, 303);
}
