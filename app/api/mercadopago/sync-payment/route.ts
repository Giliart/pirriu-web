import { NextResponse } from "next/server";
import { applyMercadoPagoPayment, fetchMercadoPagoPayment } from "@/lib/mercadopago-payments";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pirriu.app";

  const paymentId =
    url.searchParams.get("payment_id") ||
    url.searchParams.get("collection_id") ||
    url.searchParams.get("id");

  if (!paymentId) {
    return NextResponse.redirect(`${siteUrl}/assinatura?checkout=sem_payment_id`);
  }

  try {
    const payment = await fetchMercadoPagoPayment(paymentId);
    const result = await applyMercadoPagoPayment(payment);

    const status = result?.order_status || payment?.status || "unknown";
    return NextResponse.redirect(`${siteUrl}/assinatura?checkout=${status}`);
  } catch (error) {
    return NextResponse.redirect(`${siteUrl}/assinatura?checkout=sync_error`);
  }
}
