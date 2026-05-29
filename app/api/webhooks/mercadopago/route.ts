import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  // IMPORTANTE:
  // Esta é uma base segura inicial. A confirmação real deve consultar a API do Mercado Pago
  // usando MERCADO_PAGO_ACCESS_TOKEN antes de liberar o plano.
  // Não confie apenas no payload recebido.

  const externalPaymentId = String(body?.data?.id || body?.id || "");
  const status = String(body?.status || body?.action || "");

  if (!externalPaymentId) {
    return NextResponse.json({ ok: true, ignored: "no_payment_id" });
  }

  // Quando configurarmos Mercado Pago de verdade, vamos localizar o pedido pelo external_payment_id
  // ou por metadata/order_id enviado na preferência.
  if (status.includes("approved") || status.includes("payment")) {
    await supabaseAdmin
      .from("subscription_orders")
      .update({
        status: "paid",
        external_payment_id: externalPaymentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("external_payment_id", externalPaymentId);
  }

  return NextResponse.json({ ok: true });
}
