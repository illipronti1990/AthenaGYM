-- ATHENAS PLATFORM Sprint 8 — BI, Analytics e Inteligência Artificial
-- Analytical warehouse tables live in the same Supabase project (schema analytics)
-- to keep ops simple; ETL worker fills facts from OLTP events.

create schema if not exists analytics;

-- ---------------------------------------------------------------------------
-- fact tables (data warehouse)
-- ---------------------------------------------------------------------------
create table if not exists analytics.fact_checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  company_id uuid not null references public.companies(id),
  unit_id uuid,
  student_id uuid,
  checkins integer not null default 0,
  duration_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_fact_checkins_grain
  on analytics.fact_checkins (
    date, company_id,
    coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(student_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists idx_fact_checkins_company_date
  on analytics.fact_checkins(company_id, date desc);

create table if not exists analytics.fact_revenue (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  company_id uuid not null references public.companies(id),
  unit_id uuid,
  gross_revenue numeric(14,2) not null default 0,
  net_revenue numeric(14,2) not null default 0,
  expenses numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_fact_revenue_grain
  on analytics.fact_revenue (
    date, company_id,
    coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists idx_fact_revenue_company_date
  on analytics.fact_revenue(company_id, date desc);

create table if not exists analytics.fact_workouts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  company_id uuid not null references public.companies(id),
  student_id uuid,
  completed integer not null default 0,
  duration_minutes integer not null default 0,
  load_kg numeric(12,2) not null default 0,
  calories integer not null default 0,
  created_at timestamptz not null default now(),
  unique (date, company_id, student_id)
);

create index if not exists idx_fact_workouts_company_date
  on analytics.fact_workouts(company_id, date desc);

create table if not exists analytics.fact_sales (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  lead_id uuid,
  consultant_id uuid,
  pipeline varchar(60),
  converted boolean not null default false,
  amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_fact_sales_company_date
  on analytics.fact_sales(company_id, date desc);

-- ---------------------------------------------------------------------------
-- KPI definitions + snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  code varchar(80) not null,
  name varchar(160) not null,
  category varchar(40) not null,
  formula text,
  unit varchar(30) not null default 'number',
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_kpi_definitions_system_code
  on public.kpi_definitions (code) where company_id is null;
create unique index if not exists uq_kpi_definitions_company_code
  on public.kpi_definitions (company_id, code) where company_id is not null;

create table if not exists public.kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  kpi_code varchar(80) not null,
  period_start date not null,
  period_end date not null,
  value numeric(18,4) not null default 0,
  delta_pct numeric(10,4),
  payload jsonb not null default '{}',
  computed_at timestamptz not null default now()
);

create index if not exists idx_kpi_snapshots_company
  on public.kpi_snapshots(company_id, kpi_code, period_end desc);

-- ---------------------------------------------------------------------------
-- predictions
-- ---------------------------------------------------------------------------
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  entity_type varchar(40) not null,
  entity_id uuid not null,
  prediction_type varchar(60) not null,
  score numeric(6,4) not null,
  label varchar(120),
  recommendation text,
  features jsonb not null default '{}',
  model_version varchar(40) not null default 'heuristic-v1',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists idx_predictions_company_type
  on public.predictions(company_id, prediction_type, score desc);

-- ---------------------------------------------------------------------------
-- report builder
-- ---------------------------------------------------------------------------
create table if not exists public.report_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(200) not null,
  description text,
  source varchar(80) not null default 'analytics',
  fields jsonb not null default '[]',
  filters jsonb not null default '{}',
  group_by jsonb not null default '[]',
  created_by uuid references public.profiles(id),
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists trg_report_definitions_updated on public.report_definitions;
create trigger trg_report_definitions_updated before update on public.report_definitions
for each row execute function public.set_updated_at();

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  report_id uuid not null references public.report_definitions(id) on delete cascade,
  cron varchar(80) not null,
  timezone varchar(60) not null default 'America/Sao_Paulo',
  channel varchar(30) not null default 'email',
  recipients jsonb not null default '[]',
  format varchar(20) not null default 'pdf',
  active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  report_id uuid references public.report_definitions(id),
  requested_by uuid references public.profiles(id),
  format varchar(20) not null,
  status varchar(30) not null default 'pending',
  file_url text,
  row_count integer,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_export_jobs_company
  on public.export_jobs(company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.kpi_definitions enable row level security;
alter table public.kpi_snapshots enable row level security;
alter table public.predictions enable row level security;
alter table public.report_definitions enable row level security;
alter table public.report_schedules enable row level security;
alter table public.export_jobs enable row level security;

drop policy if exists kpi_definitions_tenant on public.kpi_definitions;
create policy kpi_definitions_tenant on public.kpi_definitions for all using (
  public.is_super_admin() or company_id is null or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id is null or company_id in (select public.user_company_ids())
);

drop policy if exists kpi_snapshots_tenant on public.kpi_snapshots;
create policy kpi_snapshots_tenant on public.kpi_snapshots for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists predictions_tenant on public.predictions;
create policy predictions_tenant on public.predictions for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists report_definitions_tenant on public.report_definitions;
create policy report_definitions_tenant on public.report_definitions for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists report_schedules_tenant on public.report_schedules;
create policy report_schedules_tenant on public.report_schedules for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists export_jobs_tenant on public.export_jobs;
create policy export_jobs_tenant on public.export_jobs for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- Grant analytics schema usage to authenticated/service roles when present
grant usage on schema analytics to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema analytics to postgres, service_role;
grant select on all tables in schema analytics to authenticated;

-- ---------------------------------------------------------------------------
-- system KPI seed
-- ---------------------------------------------------------------------------
insert into public.kpi_definitions (code, name, category, unit, is_system)
select v.code, v.name, v.category, v.unit, true
from (values
  ('revenue_daily', 'Receita diária', 'finance', 'currency'),
  ('revenue_monthly', 'Receita mensal', 'finance', 'currency'),
  ('revenue_yearly', 'Receita anual', 'finance', 'currency'),
  ('avg_ticket', 'Ticket médio', 'finance', 'currency'),
  ('profit', 'Lucro', 'finance', 'currency'),
  ('conversion', 'Conversão', 'sales', 'percent'),
  ('cac', 'CAC', 'sales', 'currency'),
  ('ltv', 'LTV', 'sales', 'currency'),
  ('churn', 'Churn', 'sales', 'percent'),
  ('leads', 'Leads', 'sales', 'number'),
  ('enrollments', 'Matrículas', 'sales', 'number'),
  ('cancellations', 'Cancelamentos', 'sales', 'number'),
  ('checkins', 'Check-ins', 'operations', 'number'),
  ('frequency', 'Frequência', 'operations', 'number'),
  ('occupancy', 'Ocupação', 'operations', 'percent'),
  ('no_show', 'No-show', 'operations', 'percent'),
  ('workouts_completed', 'Treinos concluídos', 'workouts', 'number'),
  ('avg_evolution', 'Evolução média', 'workouts', 'percent'),
  ('active_users', 'Usuários ativos', 'app', 'number'),
  ('engagement_rate', 'Engajamento', 'app', 'percent')
) as v(code, name, category, unit)
where not exists (
  select 1 from public.kpi_definitions k where k.company_id is null and k.code = v.code
);

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('analytics', 'read', 'analytics.read', 'Ler analytics e KPIs'),
  ('analytics', 'manage', 'analytics.manage', 'Gerenciar KPIs e warehouse'),
  ('reports', 'read', 'reports.read', 'Ler relatórios'),
  ('reports', 'create', 'reports.create', 'Criar report builder'),
  ('reports', 'export', 'reports.export', 'Exportar Excel/PDF/CSV'),
  ('reports', 'schedule', 'reports.schedule', 'Agendar relatórios'),
  ('predictions', 'read', 'predictions.read', 'Ler predições IA'),
  ('predictions', 'run', 'predictions.run', 'Executar prediction engine'),
  ('executive', 'read', 'executive.read', 'Dashboard executivo'),
  ('ai', 'insights', 'ai.insights', 'Insights de IA BI')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- super_admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'analytics.%' or p.code like 'reports.%' or p.code like 'predictions.%'
   or p.code = 'executive.read' or p.code = 'ai.insights'
on conflict do nothing;

-- admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'analytics.%' or p.code like 'reports.%' or p.code like 'predictions.%'
   or p.code = 'executive.read' or p.code = 'ai.insights'
on conflict do nothing;

-- manager
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'analytics.read','reports.read','reports.create','reports.export','reports.schedule',
  'predictions.read','predictions.run','executive.read','ai.insights'
) on conflict do nothing;

-- finance
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id from public.permissions p
where p.code in (
  'analytics.read','reports.read','reports.export','executive.read','ai.insights'
) on conflict do nothing;

-- reception
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id from public.permissions p
where p.code in ('analytics.read','reports.read','predictions.read')
on conflict do nothing;

-- trainer
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', p.id from public.permissions p
where p.code in ('analytics.read','predictions.read','ai.insights')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- sample warehouse snapshot (demo company)
-- ---------------------------------------------------------------------------
insert into analytics.fact_revenue (date, company_id, unit_id, gross_revenue, net_revenue, expenses, profit)
select current_date, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221',
  12827.33, 11450.00, 4200.00, 7250.00
where not exists (
  select 1 from analytics.fact_revenue f
  where f.date = current_date
    and f.company_id = '11111111-1111-1111-1111-111111111111'
    and f.unit_id = '22222222-2222-2222-2222-222222222221'
);

insert into analytics.fact_checkins (date, company_id, unit_id, student_id, checkins, duration_minutes)
select current_date, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221',
  null, 142, 8500
where not exists (
  select 1 from analytics.fact_checkins f
  where f.date = current_date
    and f.company_id = '11111111-1111-1111-1111-111111111111'
    and f.unit_id = '22222222-2222-2222-2222-222222222221'
    and f.student_id is null
);
