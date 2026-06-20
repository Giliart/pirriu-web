-- PIRRIU - API própria de rotas e cache
-- Rodar uma vez no Supabase SQL Editor

create table if not exists public.route_cache (
  id uuid primary key default gen_random_uuid(),
  route_hash text not null unique,
  input_coordinates jsonb not null default '[]'::jsonb,
  geometry_json jsonb not null default '[]'::jsonb,
  summary_json jsonb not null default '{}'::jsonb,
  steps_json jsonb not null default '[]'::jsonb,
  provider text not null default 'openrouteservice',
  context text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_route_cache_hash
on public.route_cache (route_hash);

create index if not exists idx_route_cache_last_used
on public.route_cache (last_used_at desc);

create index if not exists idx_route_cache_expires
on public.route_cache (expires_at);

-- Índices úteis para o app em crescimento
create index if not exists idx_clients_account_active_created
on public.clients (account_id, is_active, created_at desc);

create index if not exists idx_clients_account_plan_blocked
on public.clients (account_id, plan_blocked, created_at);

create index if not exists idx_rounds_account_active_created
on public.rounds (account_id, is_active, created_at desc);

create index if not exists idx_round_points_round_sequence
on public.round_points (round_id, sequence);

create index if not exists idx_account_links_owner_status
on public.account_links (owner_account_id, status);
