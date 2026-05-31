import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  if (type === "recovery" || next === "/nova-senha") {
    return NextResponse.redirect(new URL("/nova-senha", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/painel", requestUrl.origin));
}