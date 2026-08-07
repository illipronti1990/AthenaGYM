-- ATHENA PLATFORM Sprint G-6 — Controle de Acesso e Integrações Corporativas (1A)

-- ---------------------------------------------------------------------------
-- access_rules (G6.8)
-- ---------------------------------------------------------------------------
create table if not exists public.access_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  max_checkins_per_day int not null default 2,
  min_interval_minutes int not null default 2,
  block_overdue boolean not null default true,
  block_expired_plan boolean not null default true,
  block_frozen boolean not null default true,
  grace_days int not null default 0,
  allowed_weekdays int[] not null default '{0,1,2,3,4,5,6}',
  allowed_hours_json jsonb not null default '{"start":"05:00","end":"23:00"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, unit_id)
);

drop trigger if exists trg_access_rules_updated on public.access_rules;
create trigger trg_access_rules_updated before update on public.access_rules
for each row execute function public.set_updated_at();

alter table public.access_rules enable row level security;
drop policy if exists access_rules_tenant on public.access_rules;
create policy access_rules_tenant on public.access_rules for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

insert into public.access_rules (company_id, unit_id)
values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
on conflict (company_id, unit_id) do nothing;

-- ---------------------------------------------------------------------------
-- partners hub (G6.4)
-- ---------------------------------------------------------------------------
create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  slug varchar(40) not null,
  type varchar(40) not null default 'benefit'
    check (type in ('benefit', 'turnstile', 'other')),
  status varchar(30) not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, slug)
);

drop trigger if exists trg_partners_updated on public.partners;
create trigger trg_partners_updated before update on public.partners
for each row execute function public.set_updated_at();

alter table public.partners enable row level security;
drop policy if exists partners_tenant on public.partners;
create policy partners_tenant on public.partners for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

insert into public.partners (company_id, name, slug, type, status, settings) values
  ('11111111-1111-1111-1111-111111111111', 'Wellhub', 'wellhub', 'benefit', 'active', '{"stub":true}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'TotalPass', 'totalpass', 'benefit', 'active', '{"stub":true}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'Control iD', 'controlid', 'turnstile', 'inactive', '{"stub":true}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'Henry', 'henry', 'turnstile', 'inactive', '{"stub":true}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'TopData', 'topdata', 'turnstile', 'inactive', '{"stub":true}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'Digicon', 'digicon', 'turnstile', 'inactive', '{"stub":true}'::jsonb)
on conflict (company_id, slug) do update set name = excluded.name, updated_at = now();

-- ---------------------------------------------------------------------------
-- partner_integrations enrich
-- ---------------------------------------------------------------------------
alter table public.partner_integrations
  add column if not exists api_key_encrypted text,
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists type varchar(40) not null default 'benefit',
  add column if not exists last_sync_at timestamptz,
  add column if not exists partner_id uuid references public.partners(id);

-- ---------------------------------------------------------------------------
-- students partner fields
-- ---------------------------------------------------------------------------
alter table public.students
  add column if not exists wellhub_id varchar(120),
  add column if not exists totalpass_id varchar(120),
  add column if not exists partner_status varchar(40),
  add column if not exists partner_company_name varchar(160),
  add column if not exists partner_plan_name varchar(120),
  add column if not exists partner_synced_at timestamptz,
  add column if not exists access_code varchar(40);

create index if not exists idx_students_wellhub
  on public.students(company_id, wellhub_id) where deleted_at is null and wellhub_id is not null;
create index if not exists idx_students_totalpass
  on public.students(company_id, totalpass_id) where deleted_at is null and totalpass_id is not null;
create index if not exists idx_students_access_code
  on public.students(company_id, access_code) where deleted_at is null and access_code is not null;

-- ---------------------------------------------------------------------------
-- partner_api_logs
-- ---------------------------------------------------------------------------
create table if not exists public.partner_api_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  provider varchar(40) not null,
  endpoint varchar(200) not null,
  status varchar(30) not null default 'ok',
  http_status int,
  error text,
  payload jsonb not null default '{}'::jsonb,
  payload_hash varchar(128),
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_partner_api_logs_company
  on public.partner_api_logs(company_id, created_at desc);
create index if not exists idx_partner_api_logs_provider
  on public.partner_api_logs(company_id, provider, created_at desc);
create unique index if not exists idx_partner_api_logs_dedupe
  on public.partner_api_logs(company_id, provider, payload_hash)
  where payload_hash is not null;

alter table public.partner_api_logs enable row level security;
drop policy if exists partner_api_logs_tenant on public.partner_api_logs;
create policy partner_api_logs_tenant on public.partner_api_logs for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- access_logs enrich
-- ---------------------------------------------------------------------------
alter table public.access_logs
  add column if not exists partner varchar(40),
  add column if not exists ip varchar(64),
  add column if not exists duration_sec int,
  add column if not exists reason_label varchar(255);

-- ---------------------------------------------------------------------------
-- checkins enrich
-- ---------------------------------------------------------------------------
alter table public.checkins
  add column if not exists partner varchar(40),
  add column if not exists external_checkin_id varchar(120);

create unique index if not exists idx_checkins_external_partner
  on public.checkins(company_id, partner, external_checkin_id)
  where partner is not null and external_checkin_id is not null;
