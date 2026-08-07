-- M-3 commercial CRM extensions for marketing_demo_requests

alter table public.marketing_demo_requests
  add column if not exists state text,
  add column if not exists whatsapp text,
  add column if not exists primary_interest text,
  add column if not exists plan_interest text,
  add column if not exists notes text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists owner_user_id uuid references auth.users(id);

-- Expand status values: migrate legacy then replace check
update public.marketing_demo_requests set status = 'negotiation' where status = 'qualified';
update public.marketing_demo_requests set status = 'lost' where status = 'discarded';

alter table public.marketing_demo_requests drop constraint if exists marketing_demo_requests_status_check;

alter table public.marketing_demo_requests
  add constraint marketing_demo_requests_status_check
  check (status in (
    'new',
    'contacted',
    'demo_scheduled',
    'proposal_sent',
    'negotiation',
    'won',
    'lost'
  ));

create table if not exists public.commercial_onboarding (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.marketing_demo_requests(id) on delete set null,
  company_id uuid,
  academy_name text,
  stage text not null default 'cadastro'
    check (stage in ('cadastro', 'contrato', 'config', 'import', 'treinamento', 'go_live')),
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commercial_onboarding_stage_idx
  on public.commercial_onboarding (stage);

create table if not exists public.marketing_email_log (
  id uuid primary key default gen_random_uuid(),
  template text not null,
  to_email text not null,
  lead_id uuid references public.marketing_demo_requests(id) on delete set null,
  provider_id text,
  status text not null default 'queued',
  error text,
  created_at timestamptz not null default now()
);

alter table public.commercial_onboarding enable row level security;
alter table public.marketing_email_log enable row level security;
