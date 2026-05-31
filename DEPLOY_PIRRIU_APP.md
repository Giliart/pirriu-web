# PIRRIU Web - produção em pirriu.app

## Variáveis principais na Vercel

NEXT_PUBLIC_SITE_URL=https://pirriu.app

## Mercado Pago - Assinaturas

A rota principal de upgrade agora é:

- `app/api/create-subscription/route.ts`

Ela cria uma assinatura recorrente no Mercado Pago usando `/preapproval`, salva a tentativa em `subscription_orders` e salva a assinatura em `subscriptions`.

## Webhook Mercado Pago

Configure no Mercado Pago:

https://pirriu.app/api/webhooks/mercadopago

Eventos recomendados:

- Pagamentos
- Planos e assinaturas / Preapproval

## Supabase Auth

Site URL:

https://pirriu.app

Redirect URLs:

https://pirriu.app/**
https://www.pirriu.app/**
