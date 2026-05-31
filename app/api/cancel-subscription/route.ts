import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
      .select("id, mp_preapproval_id, mp_subscription_id")
      .eq("account_id", profile.account_id)
      .in("status", ["active", "authorized", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const mpPreapprovalId = subscription?.mp_preapproval_id || subscription?.mp_subscription_id;
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (mpPreapprovalId && accessToken) {
      await fetch(`https://api.mercadopago.com/preapproval/${mpPreapprovalId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      }).catch(() => null);
    }

    await supabaseAdmin
      .from("accounts")
      .update({ subscription_status: "cancelled" })
      .eq("id", profile.account_id);

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", profile.account_id)
      .in("status", ["active", "authorized", "pending"]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pirriu.app";
    return NextResponse.redirect(`${siteUrl}/assinatura?cancelled=true`);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
