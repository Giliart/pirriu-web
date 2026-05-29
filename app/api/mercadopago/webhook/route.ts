import { NextResponse } from "next/server";
import { applyMercadoPagoPayment, fetchMercadoPagoPayment } from "@/lib/mercadopago-payments";

function getPaymentId(body: any, url: URL) {
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

export async function POST(request: Request) {
  let body: any = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const url = new URL(request.url);
  const eventType = getEventType(body, url);
  const paymentId = getPaymentId(body, url);

  if (eventType && !eventType.includes("payment")) {
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "Sem payment_id." });
  }

  try {
    const payment = await fetchMercadoPagoPayment(String(paymentId));
    const result = await applyMercadoPagoPayment(payment);

    return NextResponse.json(result);
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
