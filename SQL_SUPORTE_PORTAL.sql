-- PIRRIU WEB - Suporte
-- Rode uma vez no Supabase SQL Editor antes de usar /suporte.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  status text not null default 'open',
  source text not null default 'portal'
);

create index if not exists idx_support_requests_created_at
on public.support_requests (created_at desc);

create index if not exists idx_support_requests_status
on public.support_requests (status);
