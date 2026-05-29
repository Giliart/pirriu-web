import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken || accessToken.includes("xxxxxxxx")) {
      return NextResponse.json(
        { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado no .env.local." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const planId = String(formData.get("plan_id") || "");
    const billingCycle = String(formData.get("billing_cycle") || "monthly");

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_id, email, full_name")
      .eq("id", auth.user.id)
      .single();

    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!profile?.account_id || !plan) {
      return NextResponse.json(
        { error: "Conta ou plano não encontrado." },
        { status: 400 }
      );
    }

    const amount =
      billingCycle === "yearly"
        ? Number(plan.price_yearly || plan.price_monthly || 1)
        : Number(plan.price_monthly || 1);

    const { data: order, error } = await supabaseAdmin
      .from("subscription_orders")
      .insert({
        account_id: profile.account_id,
        plan_id: plan.id,
        status: "pending",
        amount,
        provider: "mercadopago_checkout_test",
        platform: "web",
        store_product_id: plan.slug || plan.name,
        billing_cycle: billingCycle,
      })
      .select()
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: error?.message || "Erro ao criar pedido." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const payerEmail =
      process.env.MERCADO_PAGO_TEST_PAYER_EMAIL ||
      profile.email ||
      auth.user.email ||
      undefined;

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `PIRRIU - ${plan.name}`,
            description: `Teste de checkout do plano ${plan.name}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount > 0 ? amount : 1,
          },
        ],
        payer: payerEmail ? { email: payerEmail } : undefined,
        external_reference: order.id,
        notification_url: `${siteUrl}/api/mercadopago/webhook`,
        back_urls: {
          success: `${siteUrl}/api/mercadopago/sync-payment?result=success`,
          failure: `${siteUrl}/api/mercadopago/sync-payment?result=failure`,
          pending: `${siteUrl}/api/mercadopago/sync-payment?result=pending`,
        },
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok || !mpData.init_point) {
      await supabaseAdmin
        .from("subscription_orders")
        .update({
          status: "failed",
          checkout_url: null,
          external_payment_id: mpData?.id?.toString?.() || null,
        })
        .eq("id", order.id);

      return NextResponse.json(
        {
          error: "Mercado Pago não retornou checkout.",
          details: mpData,
        },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("subscription_orders")
      .update({
        checkout_url: mpData.init_point,
        external_payment_id: mpData.id?.toString?.() || null,
      })
      .eq("id", order.id);

    return NextResponse.redirect(mpData.init_point, 303);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro interno ao criar checkout." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Use o botão Fazer upgrade na página /assinatura. Esta rota cria checkout apenas via POST.",
    },
    { status: 405 }
  );
}
