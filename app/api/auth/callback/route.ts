import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?recovery_error=missing_code", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[PIRRIU AUTH] Falha ao trocar código de recuperação por sessão:", error.message);
    return NextResponse.redirect(new URL("/login?recovery_error=invalid_or_expired", requestUrl.origin));
  }

  if (type === "recovery" || next === "/nova-senha") {
    return NextResponse.redirect(new URL("/nova-senha", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/painel", requestUrl.origin));
}
