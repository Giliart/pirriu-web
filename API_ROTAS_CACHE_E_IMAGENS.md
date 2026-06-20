# PIRRIU - API própria de rotas

## O que foi alterado

O aplicativo não chama mais o OpenRouteService diretamente nas telas principais de mapa.

Fluxo novo:

App PIRRIU
→ https://pirriu.app/api/routes/calculate
→ cache no Supabase `route_cache`
→ OpenRouteService apenas quando não existir cache
→ resposta para o App

## Arquivos principais

Portal Web:
- app/api/routes/calculate/route.ts
- app/api/avatar/[profileId]/route.ts
- components/SecureImage.tsx
- SQL_ROUTE_CACHE_PIRRIU.sql

App:
- src/services/pirriuRoutes.ts
- src/screens/CobrancaMapaScreen.tsx
- src/screens/RondaMapaScreen.tsx
- src/screens/RondaNavegacaoScreen.tsx

## Variável obrigatória na Vercel

Configure no projeto Web da Vercel:

OPENROUTE_SERVICE_API_KEY=sua_chave_openrouteservice

Também aceita:
ORS_API_KEY=sua_chave_openrouteservice

## Variável opcional no App

EXPO_PUBLIC_PIRRIU_API_URL=https://pirriu.app

Se não configurar, o app usa https://pirriu.app por padrão.

## SQL obrigatório

Rode no Supabase:

SQL_ROUTE_CACHE_PIRRIU.sql

## Segurança das imagens do perfil no portal

O portal agora usa:
- /api/avatar/[profileId]
- SecureImage

Isso evita expor diretamente a URL do Supabase no HTML da foto de perfil e bloqueia arrastar/botão direito nas imagens renderizadas no portal.
