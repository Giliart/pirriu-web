import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { syncAccountEntitlement } from "@/lib/subscription-entitlement";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id, mp_preapproval_id, mp_subscription_id, billing_cycle, next_payment_date")
      .eq("account_id", profile.account_id)
      .in("status", ["active", "authorized", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const mpPreapprovalId = subscription?.mp_preapproval_id || subscription?.mp_subscription_id;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    let nextPaymentDate: string | null = null;

    if (mpPreapprovalId && accessToken) {
      const currentResponse = await fetch(`https://api.mercadopago.com/preapproval/${mpPreapprovalId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }).catch(() => null);

      if (currentResponse?.ok) {
        const currentSubscription = await currentResponse.json().catch(() => null);
        nextPaymentDate = currentSubscription?.next_payment_date || null;
      }

      await fetch(`https://api.mercadopago.com/preapproval/${mpPreapprovalId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      }).catch(() => null);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    if (!nextPaymentDate) {
      if (subscription?.next_payment_date) {
        nextPaymentDate = subscription.next_payment_date;
      } else {
        const fallbackDate = new Date(now);
        fallbackDate.setMonth(fallbackDate.getMonth() + (subscription?.billing_cycle === "yearly" ? 12 : 1));
        nextPaymentDate = fallbackDate.toISOString();
      }
    }

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: nowIso,
        next_payment_date: nextPaymentDate,
        updated_at: nowIso,
      })
      .eq("account_id", profile.account_id)
      .in("status", ["active", "authorized", "pending"]);

    // Regra PIRRIU: cancelamento bloqueia cobranças futuras, mas mantém o plano
    // até a próxima data de cobrança já paga. A sincronização abaixo escolhe a
    // melhor assinatura vigente e grava o estado correto em accounts.
    await syncAccountEntitlement(profile.account_id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pirriu.app";
    return NextResponse.redirect(`${siteUrl}/assinatura?cancelled=true`);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
