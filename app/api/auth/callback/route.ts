import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/nova-senha";
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorCode = requestUrl.searchParams.get("error_code");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  // O Supabase pode redirecionar para cá já trazendo um erro do link.
  if (errorCode || errorDescription) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("reset_error", errorDescription || errorCode || "link_invalido");
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("reset_error", "codigo_ausente");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("reset_error", error.message || "link_invalido");
    return NextResponse.redirect(loginUrl);
  }

  // No fluxo de recuperação, next será /nova-senha. A sessão criada acima
  // fica persistida nos cookies pelo cliente SSR e estará disponível na página.
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
