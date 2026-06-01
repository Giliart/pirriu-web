import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getResourceId(body: any, url: URL) {
  return (
    body?.data?.id ||
    body?.resource_id ||
    body?.id ||
    url.searchParams.get("data.id") ||
    url.searchParams.get("resource_id") ||
    url.searchParams.get("id") ||
    url.searchParams.get("payment_id") ||
    url.searchParams.get("collection_id")
  );
}

function getEventType(body: any, url: URL) {
  return String(
    body?.type ||
      body?.topic ||
      body?.action ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      ""
  ).toLowerCase();
}

function getAccessToken() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  return accessToken;
}

async function fetchMercadoPagoPayment(paymentId: string) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Erro ao consultar pagamento Mercado Pago.");
  }

  return data;
}

async function fetchPreapproval(preapprovalId: string) {
  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Erro ao consultar assinatura Mercado Pago.");
  }

  return data;
}

function mapPreapprovalStatus(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (["authorized", "active"].includes(normalized)) return "active";
  if (normalized === "paused") return "paused";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (normalized === "expired") return "expired";
  if (normalized === "pending") return "pending";
  return "failed";
}

function mapPaymentToSubscriptionStatus(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved" || normalized === "accredited") return "active";
  if (["pending", "in_process", "in_mediation"].includes(normalized)) return "pending";
  if (["rejected", "cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["refunded", "charged_back"].includes(normalized)) return "cancelled";

  return "pending";
}

function mapPaymentToOrderStatus(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "approved" || normalized === "accredited") return "paid";
  if (["pending", "in_process", "in_mediation"].includes(normalized)) return "pending";
  if (["rejected", "cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["refunded", "charged_back"].includes(normalized)) return "refunded";

  return "pending";
}

function calculateNextPaymentDate(billingCycle?: string | null) {
  const date = new Date();
  date.setMonth(date.getMonth() + (billingCycle === "yearly" ? 12 : 1));
  return date.toISOString();
}

async function activateAccountPlan(accountId: string, planId: string, status: string) {
  // Só promovemos/liberamos o plano quando houver pagamento/assinatura ativa.
  // Tentativas recusadas, canceladas ou expiradas NÃO devem rebaixar a conta aqui,
  // porque o usuário pode ter outra assinatura paga válida ou estar no período já pago.
  if (status !== "active") return;

  await supabaseAdmin
    .from("accounts")
    .update({
      plan_id: planId,
      subscription_status: "active",
    })
    .eq("id", accountId);
}

async function applyPayment(paymentId: string) {
  const payment = await fetchMercadoPagoPayment(paymentId);
  const externalReference = payment?.external_reference || payment?.metadata?.external_reference || null;
  const status = mapPaymentToSubscriptionStatus(payment?.status);
  const orderStatus = mapPaymentToOrderStatus(payment?.status);
  const nowIso = new Date().toISOString();

  if (!externalReference) {
    return {
      ok: true,
      ignored: "Pagamento sem external_reference.",
      payment_id: payment?.id,
      payment_status: payment?.status,
    };
  }

  const { data: order } = await supabaseAdmin
    .from("subscription_orders")
    .select("id, account_id, plan_id, billing_cycle")
    .eq("id", externalReference)
    .maybeSingle();

  await supabaseAdmin
    .from("subscription_orders")
    .update({
      status: orderStatus,
      external_payment_id: String(payment?.id || paymentId),
      paid_at: status === "active" ? nowIso : null,
      updated_at: nowIso,
    })
    .eq("id", externalReference);

  const subscriptionUpdate: any = {
    status,
    raw_payload: payment,
    updated_at: nowIso,
  };

  if (status === "active") {
    subscriptionUpdate.started_at = nowIso;
    subscriptionUpdate.cancelled_at = null;
    subscriptionUpdate.next_payment_date = calculateNextPaymentDate(order?.billing_cycle);
  }

  if (status === "cancelled") {
    subscriptionUpdate.cancelled_at = nowIso;
  }


  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .update(subscriptionUpdate)
    .eq("external_reference", externalReference)
    .select("account_id, plan_id, status")
    .maybeSingle();

  const accountId = subscription?.account_id || order?.account_id;
  const planId = subscription?.plan_id || order?.plan_id;

  if (accountId && planId) {
    await activateAccountPlan(accountId, planId, status);
  }

  return {
    ok: true,
    type: "payment",
    payment_id: payment?.id,
    payment_status: payment?.status,
    external_reference: externalReference,
    order_status: orderStatus,
    subscription_status: status,
    account_updated: Boolean(accountId && planId),
  };
}

async function applyPreapproval(preapprovalId: string) {
  const preapproval = await fetchPreapproval(preapprovalId);
  const externalReference = preapproval?.external_reference || null;
  const status = mapPreapprovalStatus(preapproval?.status);
  const nowIso = new Date().toISOString();

  const subscriptionUpdate: any = {
    status,
    mp_subscription_id: preapproval.id,
    mp_preapproval_id: preapproval.id,
    next_payment_date: preapproval.next_payment_date || null,
    raw_payload: preapproval,
    updated_at: nowIso,
  };

  if (status === "active") {
    subscriptionUpdate.started_at = nowIso;
    subscriptionUpdate.cancelled_at = null;
  }

  if (status === "cancelled") {
    subscriptionUpdate.cancelled_at = nowIso;
  }

  let subscription: any = null;

  const byPreapproval = await supabaseAdmin
    .from("subscriptions")
    .update(subscriptionUpdate)
    .eq("mp_preapproval_id", preapproval.id)
    .select("account_id, plan_id, status")
    .maybeSingle();

  subscription = byPreapproval.data;

  if (!subscription && externalReference) {
    const byReference = await supabaseAdmin
      .from("subscriptions")
      .update(subscriptionUpdate)
      .eq("external_reference", externalReference)
      .select("account_id, plan_id, status")
      .maybeSingle();

    subscription = byReference.data;
  }

  if (externalReference) {
    await supabaseAdmin
      .from("subscription_orders")
      .update({
        status: status === "active" ? "paid" : status === "cancelled" ? "cancelled" : "pending",
        external_payment_id: preapproval.id,
        paid_at: status === "active" ? nowIso : null,
        updated_at: nowIso,
      })
      .eq("id", externalReference);
  }

  if (subscription?.account_id && subscription?.plan_id) {
    await activateAccountPlan(subscription.account_id, subscription.plan_id, status);
  }

  return {
    ok: true,
    type: "preapproval",
    preapproval_id: preapproval.id,
    external_reference: externalReference,
    subscription_status: status,
    account_updated: Boolean(subscription?.account_id && subscription?.plan_id),
  };
}

export async function POST(request: Request) {
  let body: any = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const url = new URL(request.url);
  const eventType = getEventType(body, url);
  const resourceId = getResourceId(body, url);

  if (!resourceId) {
    return NextResponse.json({ ok: true, ignored: "Sem resource_id." });
  }

  try {
    if (eventType.includes("preapproval") || eventType.includes("subscription")) {
      return NextResponse.json(await applyPreapproval(String(resourceId)));
    }

    if (!eventType || eventType.includes("payment")) {
      return NextResponse.json(await applyPayment(String(resourceId)));
    }

    return NextResponse.json({ ok: true, ignored: eventType, resource_id: resourceId });
  } catch (error: any) {
    console.error("Erro webhook Mercado Pago:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resourceId = getResourceId({}, url);

  if (!resourceId) {
    return NextResponse.json({ ok: true, route: "mercadopago-webhook", ignored: "Sem resource_id." });
  }

  return POST(request);
}
