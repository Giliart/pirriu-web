import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { applyMercadoPagoPayment, fetchMercadoPagoPayment } from "@/lib/mercadopago-payments";

function getResourceId(body: any, url: URL) {
  return (
    body?.data?.id ||
    body?.id ||
    url.searchParams.get("data.id") ||
    url.searchParams.get("id") ||
    url.searchParams.get("payment_id")
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

async function fetchPreapproval(preapprovalId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");

  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Erro ao consultar assinatura Mercado Pago.");
  return data;
}

function mapPreapprovalStatus(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (["authorized", "active"].includes(normalized)) return "active";
  if (["paused"].includes(normalized)) return "paused";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["expired"].includes(normalized)) return "expired";
  if (["pending"].includes(normalized)) return "pending";
  return "failed";
}

async function applyPreapproval(preapprovalId: string) {
  const preapproval = await fetchPreapproval(preapprovalId);
  const orderId = preapproval.external_reference || null;
  const status = mapPreapprovalStatus(preapproval.status);
  const nowIso = new Date().toISOString();

  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status,
      mp_subscription_id: preapproval.id,
      mp_preapproval_id: preapproval.id,
      next_payment_date: preapproval.next_payment_date || null,
      started_at: status === "active" ? nowIso : undefined,
      cancelled_at: status === "cancelled" ? nowIso : null,
      raw_payload: preapproval,
      updated_at: nowIso,
    })
    .eq("mp_preapproval_id", preapproval.id)
    .select("account_id, plan_id")
    .maybeSingle();

  if (orderId) {
    await supabaseAdmin
      .from("subscription_orders")
      .update({
        status: status === "active" ? "paid" : status === "cancelled" ? "cancelled" : "pending",
        external_payment_id: preapproval.id,
        paid_at: status === "active" ? nowIso : null,
        updated_at: nowIso,
      })
      .eq("id", orderId);
  }

  if (subscription?.account_id && subscription?.plan_id && status === "active") {
    await supabaseAdmin
      .from("accounts")
      .update({
        plan_id: subscription.plan_id,
        subscription_status: "active",
      })
      .eq("id", subscription.account_id);
  }

  if (subscription?.account_id && status === "cancelled") {
    await supabaseAdmin
      .from("accounts")
      .update({ subscription_status: "cancelled" })
      .eq("id", subscription.account_id);
  }

  return { ok: true, type: "preapproval", status };
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
      const payment = await fetchMercadoPagoPayment(String(resourceId));
      const result = await applyMercadoPagoPayment(payment);
      return NextResponse.json(result);
    }

    return NextResponse.json({ ok: true, ignored: eventType });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
