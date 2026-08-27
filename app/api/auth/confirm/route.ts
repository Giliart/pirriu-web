import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { EmailOtpType } from "@supabase/supabase-js";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/nova-senha";
  return value;
}

function loginWithResetError(requestUrl: URL, error: string) {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("reset_error", error);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type) {
    return loginWithResetError(requestUrl, "codigo_ausente");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data.session) {
    return loginWithResetError(requestUrl, error?.message || "link_invalido");
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
