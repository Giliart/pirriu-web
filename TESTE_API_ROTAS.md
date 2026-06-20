# PIRRIU - Teste da API de Rotas

Depois do deploy do Portal Web, abra no navegador:

https://pirriu.app/api/routes/calculate

O retorno esperado é parecido com:

{
  "ok": true,
  "service": "pirriu-routes",
  "orsConfigured": true
}

Se `orsConfigured` vier `false`, a variável `OPENROUTE_SERVICE_API_KEY` não foi aplicada no deploy da Vercel.

Passos obrigatórios:
1. Vercel > Settings > Environment Variables
2. `OPENROUTE_SERVICE_API_KEY` com a Basic Key completa da OpenRouteService
3. Salvar
4. Fazer Redeploy do projeto Web
5. Rodar `SQL_ROUTE_CACHE_PIRRIU.sql` no Supabase, se ainda não rodou
6. No App, rodar `npx expo start -c`

Correção desta versão:
- API de rotas ganhou endpoint GET de diagnóstico.
- API aguarda mais tempo pela OpenRouteService.
- App aguarda mais tempo pela API.
- Se a API retornar fallback/linha reta durante teste, o App tenta OpenRouteService direto como contingência temporária.
- Depois que a API estiver confirmada em produção, remova `EXPO_PUBLIC_ORS_API_KEY` do App para a chave ficar protegida só na Vercel.
