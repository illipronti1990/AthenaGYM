-- ATHENA PLATFORM Sprint G-12 — BI / Analytics enrichment
-- Goals, alerts, export connectors + extra KPI definitions
-- NOTE: expose schema "analytics" in Supabase Dashboard → Settings → API → Exposed schemas
-- so warehouse ETL (fact_*) can be written via PostgREST. KPIs fall back to OLTP if not exposed.

-- ---------------------------------------------------------------------------
-- bi_goals
-- ---------------------------------------------------------------------------
create table if not exists public.bi_goals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  metric varchar(60) not null,
  target_value numeric(18,4) not null,
  period_start date not null,
  period_end date not null,
  label varchar(160),
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_bi_goals_company
  on public.bi_goals(company_id, metric, period_end desc)
  where deleted_at is null;

drop trigger if exists trg_bi_goals_updated on public.bi_goals;
create trigger trg_bi_goals_updated before update on public.bi_goals
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bi_alerts
-- ---------------------------------------------------------------------------
create table if not exists public.bi_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  code varchar(80) not null,
  severity varchar(20) not null default 'info',
  title varchar(200) not null,
  message text not null,
  recommendation text,
  evidence jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_bi_alerts_company
  on public.bi_alerts(company_id, created_at desc);
create index if not exists idx_bi_alerts_unread
  on public.bi_alerts(company_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- bi_export_connectors (Power BI / Looker stubs)
-- ---------------------------------------------------------------------------
create table if not exists public.bi_export_connectors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  provider varchar(40) not null,
  status varchar(40) not null default 'not_configured',
  config jsonb not null default '{}',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_bi_connectors_company_provider
  on public.bi_export_connectors(company_id, provider);

drop trigger if exists trg_bi_export_connectors_updated on public.bi_export_connectors;
create trigger trg_bi_export_connectors_updated before update on public.bi_export_connectors
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.bi_goals enable row level security;
alter table public.bi_alerts enable row level security;
alter table public.bi_export_connectors enable row level security;

drop policy if exists bi_goals_tenant on public.bi_goals;
create policy bi_goals_tenant on public.bi_goals for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists bi_alerts_tenant on public.bi_alerts;
create policy bi_alerts_tenant on public.bi_alerts for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists bi_export_connectors_tenant on public.bi_export_connectors;
create policy bi_export_connectors_tenant on public.bi_export_connectors for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- Extra KPI definitions (G-12 catalog)
-- ---------------------------------------------------------------------------
insert into public.kpi_definitions (code, name, category, unit, is_system)
select v.code, v.name, v.category, v.unit, true
from (values
  ('mrr', 'Receita recorrente (MRR)', 'finance', 'currency'),
  ('arr', 'Receita anual recorrente (ARR)', 'finance', 'currency'),
  ('cash_available', 'Caixa disponível', 'finance', 'currency'),
  ('delinquency', 'Inadimplência', 'finance', 'currency'),
  ('delinquency_rate', 'Taxa de inadimplência', 'finance', 'percent'),
  ('cashflow', 'Fluxo de caixa', 'finance', 'currency'),
  ('roi', 'ROI', 'finance', 'percent'),
  ('renewal_rate', 'Taxa de renovação', 'sales', 'percent'),
  ('teachers_active', 'Professores ativos', 'operations', 'number'),
  ('classes_count', 'Turmas', 'operations', 'number'),
  ('peak_hour', 'Horário de pico', 'operations', 'number'),
  ('avg_stay_minutes', 'Tempo médio de permanência', 'operations', 'number'),
  ('avg_age', 'Idade média', 'operations', 'number'),
  ('top_plan', 'Planos mais vendidos (qtd)', 'sales', 'number'),
  ('revenue_teacher', 'Receita por professor', 'finance', 'currency'),
  ('revenue_modality', 'Receita por modalidade', 'finance', 'currency')
) as v(code, name, category, unit)
where not exists (
  select 1 from public.kpi_definitions k where k.company_id is null and k.code = v.code
);

-- ---------------------------------------------------------------------------
-- permissions (align reports.export already exists)
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('analytics', 'goals', 'analytics.goals', 'Gerenciar metas BI'),
  ('analytics', 'alerts', 'analytics.alerts', 'Ler/marcar alertas BI'),
  ('ai', 'chat', 'ai.chat', 'Chat Athena AI com dados')
on conflict (code) do update set description = excluded.description, deleted_at = null;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code in ('analytics.goals', 'analytics.alerts', 'ai.chat', 'analytics.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code in ('analytics.goals', 'analytics.alerts', 'ai.chat', 'analytics.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in ('analytics.goals', 'analytics.alerts', 'ai.chat', 'analytics.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id from public.permissions p
where p.code in ('analytics.goals', 'analytics.alerts', 'ai.chat')
on conflict do nothing;
