-- PIRRIU - Liberação manual de plano sem voltar para Basic
-- Use no Supabase SQL Editor quando receber Pix/manualmente.

-- 1) Ver IDs dos planos
select id, slug, name, max_active_clients, max_rounds, max_members
from plans
order by sort_order nulls last, name;

-- 2) Liberar plano manual para uma conta
-- Troque PIR-XTAYHJ e premium pelo plano desejado: basic, plus, premium, premium_black.
update accounts a
set
  plan_id = p.id,
  subscription_status = 'active'
from plans p
where a.account_code = 'PIR-XTAYHJ'
  and p.slug = 'premium';

-- 3) Registrar histórico manual recomendado
insert into subscriptions (
  account_id,
  account_code,
  plan_id,
  plan_slug,
  plan_name,
  provider,
  status,
  billing_cycle,
  amount,
  started_at,
  next_payment_date,
  raw_payload
)
select
  a.id,
  a.account_code,
  p.id,
  p.slug,
  p.name,
  'manual',
  'active',
  'monthly',
  coalesce(p.price_monthly, 0),
  now(),
  now() + interval '30 days',
  jsonb_build_object('source', 'manual_admin', 'reason', 'Pagamento manual/Pix')
from accounts a
join plans p on p.slug = 'premium'
where a.account_code = 'PIR-XTAYHJ';

-- 4) Conferir resultado
select
  a.account_code,
  a.name,
  a.subscription_status,
  p.slug as plan_slug,
  p.name as plan_name
from accounts a
left join plans p on p.id = a.plan_id
where a.account_code = 'PIR-XTAYHJ';
