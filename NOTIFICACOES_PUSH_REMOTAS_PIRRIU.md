# PIRRIU Web - Endpoint de Push Remoto

Novo endpoint:

`POST /api/notifications/test`

Uso:

- O App envia o `Authorization: Bearer <access_token>` do Supabase.
- O endpoint valida o usuário pelo Supabase Admin.
- Busca `profiles.expo_push_token`.
- Envia notificação pela Expo Push API.

Variáveis necessárias na Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

O botão `Testar notificação` no Perfil chama este endpoint automaticamente quando existe token salvo.
