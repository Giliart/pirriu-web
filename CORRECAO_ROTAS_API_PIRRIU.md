# Correção rotas API PIRRIU

A API /api/routes/calculate agora:
- aceita coordinates e points;
- divide rotas grandes em blocos de 10 pontos;
- salva cache no Supabase;
- salva fallback no cache se a ORS falhar;
- mantém OPENROUTE_SERVICE_API_KEY apenas na Vercel.

Variáveis Vercel obrigatórias:
- OPENROUTE_SERVICE_API_KEY
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
