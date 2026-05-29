export function getSupabaseUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não foi configurada no .env.local.");
  }

  // O Supabase Client precisa receber somente a URL base do projeto:
  // https://seu-projeto.supabase.co
  // Se copiar do Data API, às vezes vem com /rest/v1; aqui removemos automaticamente.
  return rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "");
}

export function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não foi configurada no .env.local.");
  }

  return key.trim();
}
