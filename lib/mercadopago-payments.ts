import { supabaseAdmin } from "@/lib/supabase-admin";

function mapPaymentToOrderStatus(status?: string) {
  const s = String(status || "").toLowerCase();

  if (["approved", "accredited"].includes(s)) return "paid";
  if (["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(s)) return "failed";
  if (["pending", "in_process", "in_mediation"].includes(s)) return "pending";

  return "pending";
}

function mapPaymentToSubscriptionStatus(status?: string) {
  const s = String(status || "").toLowerCase();

  if (["approved", "accredited"].includes(s)) return "active";
  if (["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(s)) return "failed";
  if (["pending", "in_process", "in_mediation"].includes(s)) return "pending";

  return "pending";
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export async function applyMercadoPagoPayment(payment: any) {
  const orderId = payment?.external_reference;

  if (!orderId) {
    return {
      ok: true,
      ignored: "Pagamento sem external_reference.",
      payment_status: payment?.status,
    };
  }

  const orderStatus = mapPaymentToOrderStatus(payment?.status);
  const subscriptionStatus = mapPaymentToSubscriptionStatus(payment?.status);
  const paymentId = payment?.id ? String(payment.id) : null;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("subscription_orders")
    .select("id, account_id, plan_id, amount, billing_cycle")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    return {
      ok: true,
      ignored: "Pedido não encontrado no Supabase.",
      order_id: orderId,
      payment_status: payment?.status,
    };
  }

  await supabaseAdmin
    .from("subscription_orders")
    .update({
      status: orderStatus,
      external_payment_id: paymentId,
      paid_at: orderStatus === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (orderStatus === "paid") {
    await supabaseAdmin
      .from("accounts")
      .update({
        plan_id: order.plan_id,
        subscription_status: "active",
      })
      .eq("id", order.account_id);
  }

  const { data: account } = await supabaseAdmin
    .from("accounts")
    .select("account_code")
    .eq("id", order.account_id)
    .maybeSingle();

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("slug, name")
    .eq("id", order.plan_id)
    .maybeSingle();

  await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        account_id: order.account_id,
        account_code: account?.account_code || null,
        plan_id: order.plan_id,
        plan_slug: plan?.slug || null,
        plan_name: plan?.name || null,
        provider: "mercado_pago_checkout",
        mp_subscription_id: null,
        mp_preapproval_id: null,
        external_reference: order.id,
        status: subscriptionStatus,
        billing_cycle: order.billing_cycle || "monthly",
        amount: order.amount || 0,
        currency: "BRL",
        started_at: orderStatus === "paid" ? new Date().toISOString() : null,
        raw_payload: payment,
      },
      {
        onConflict: "external_reference",
        ignoreDuplicates: false,
      }
    );

  return {
    ok: true,
    order_id: order.id,
    order_status: orderStatus,
    payment_status: payment?.status,
    account_updated: orderStatus === "paid",
  };
}
