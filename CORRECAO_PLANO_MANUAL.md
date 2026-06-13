# Correção - Plano manual voltando para Basic

## Problema encontrado
O arquivo `lib/portal-data.ts` tinha uma reconciliação automática que fazia:

- procurava uma assinatura válida em `subscriptions`;
- se não encontrasse, voltava `accounts.plan_id` para Basic;
- também alterava `accounts.subscription_status` para `cancelled`.

Por isso, quando você alterava manualmente o UUID do plano em `accounts`, o Portal Web desfazia a alteração ao abrir.

## Correção aplicada
- O Portal Web não derruba mais plano manual.
- A fonte de verdade para liberar recurso passou a ser:
  - `accounts.plan_id`
  - `accounts.subscription_status`
- `subscriptions` fica como histórico/controle de recorrência.
- Status em inglês foram preparados para exibição em português:
  - active/authorized → Ativa
  - pending → Aguardando pagamento
  - cancelled → Cancelada
  - expired → Expirada
  - paused → Pausada
  - overdue → Em atraso

## Arquivos alterados
- `lib/portal-data.ts`
- páginas do portal quando havia exibição direta de status
- adicionado `SQL_LIBERAR_PLANO_MANUAL.sql`

## Como liberar manualmente
Use o arquivo `SQL_LIBERAR_PLANO_MANUAL.sql`.
O essencial é:

```sql
update accounts a
set
  plan_id = p.id,
  subscription_status = 'active'
from plans p
where a.account_code = 'PIR-XTAYHJ'
  and p.slug = 'premium';
```

Depois faça deploy do Web na Vercel.
