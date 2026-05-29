import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.account_id) {
      return NextResponse.json(
        { error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    await supabase
      .from("accounts")
      .update({
        subscription_status: "cancelled",
      })
      .eq("id", profile.account_id);

    await supabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("account_id", profile.account_id)
      .in("status", ["active", "authorized", "pending"]);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/assinatura?cancelled=true`
    );
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
