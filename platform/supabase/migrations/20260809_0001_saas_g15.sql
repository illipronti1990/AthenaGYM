-- Movvo G-15 — SaaS Platform, White Label & Billing

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('saas', 'read', 'saas.read', 'Ler control plane SaaS'),
  ('saas', 'manage', 'saas.manage', 'Gerenciar tenants SaaS'),
  ('saas', 'billing', 'saas.billing', 'Billing SaaS (assinaturas/faturas)'),
  ('saas', 'reports', 'saas.reports', 'Relatórios SaaS')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin')
  and p.code like 'saas.%'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- companies SaaS columns + white-label extras
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists trade_name varchar(200),
  add column if not exists plan_code varchar(40),
  add column if not exists saas_status varchar(30) not null default 'trial',
  add column if not exists activated_at timestamptz,
  add column if not exists next_due_at date,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists font_family varchar(80),
  add column if not exists email_from varchar(200),
  add column if not exists email_reply_to varchar(200),
  add column if not exists branding_json jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.companies
    drop constraint if exists companies_saas_status_check;
  alter table public.companies
    add constraint companies_saas_status_check
    check (saas_status in ('trial', 'active', 'suspended', 'cancelled'));
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- tenant_domains
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  hostname varchar(255) not null,
  is_primary boolean not null default false,
  verification_token varchar(64) not null,
  dns_status varchar(30) not null default 'pending'
    check (dns_status in ('pending', 'verified', 'failed')),
  ssl_status varchar(30) not null default 'pending'
    check (ssl_status in ('pending', 'provisioning', 'provisioned', 'failed')),
  verified_at timestamptz,
  ssl_provisioned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (hostname)
);

create index if not exists idx_tenant_domains_company on public.tenant_domains(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- saas_plans / features / limits
-- ---------------------------------------------------------------------------
create table if not exists public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) not null unique,
  name varchar(120) not null,
  description text,
  price_monthly numeric(12,2) not null default 0,
  price_yearly numeric(12,2) not null default 0,
  trial_days int not null default 14,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.saas_plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.saas_plans(id) on delete cascade,
  feature_key varchar(60) not null,
  enabled boolean not null default true,
  unique (plan_id, feature_key)
);

create table if not exists public.saas_plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.saas_plans(id) on delete cascade,
  limit_key varchar(60) not null,
  limit_value int, -- null = unlimited
  unique (plan_id, limit_key)
);

-- ---------------------------------------------------------------------------
-- feature_flags / tenant_features / tenant_limits / usage_metrics
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key varchar(60) not null unique,
  description text,
  default_enabled boolean not null default true,
  environment varchar(30) not null default 'production'
    check (environment in ('development', 'homologation', 'production', 'all')),
  beta boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_features (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  flag_key varchar(60) not null,
  enabled boolean not null,
  environment varchar(30) not null default 'all'
    check (environment in ('development', 'homologation', 'production', 'all')),
  beta boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, flag_key, environment)
);

create table if not exists public.tenant_limits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  limit_key varchar(60) not null,
  limit_value int,
  unique (company_id, limit_key)
);

create table if not exists public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_key varchar(60) not null,
  metric_value numeric(14,2) not null default 0,
  recorded_at timestamptz not null default now(),
  unique (company_id, metric_key)
);

-- ---------------------------------------------------------------------------
-- saas billing
-- ---------------------------------------------------------------------------
create table if not exists public.saas_billing_customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) unique,
  gateway varchar(40) not null default 'stub',
  external_customer_id varchar(120),
  email varchar(200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  plan_id uuid not null references public.saas_plans(id),
  status varchar(30) not null default 'trial'
    check (status in ('trial', 'active', 'past_due', 'cancelled', 'paused')),
  billing_cycle varchar(20) not null default 'monthly'
    check (billing_cycle in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  gateway varchar(40) not null default 'stub',
  external_subscription_id varchar(120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_saas_subs_company on public.saas_subscriptions(company_id) where deleted_at is null;

create table if not exists public.saas_subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.saas_subscriptions(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  event_type varchar(60) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saas_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  subscription_id uuid references public.saas_subscriptions(id),
  number varchar(40) not null,
  status varchar(30) not null default 'open'
    check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount numeric(12,2) not null default 0,
  currency varchar(3) not null default 'BRL',
  due_at date,
  paid_at timestamptz,
  period_start date,
  period_end date,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, number)
);

create table if not exists public.saas_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  invoice_id uuid references public.saas_invoices(id),
  amount numeric(12,2) not null,
  status varchar(30) not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  gateway varchar(40) not null default 'stub',
  external_payment_id varchar(120),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.saas_support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  created_by uuid references public.profiles(id),
  subject varchar(200) not null,
  body text not null,
  status varchar(30) not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saas_environment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  environment varchar(30) not null
    check (environment in ('development', 'homologation', 'production')),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, environment)
);

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'tenant_domains','saas_plans','tenant_features','saas_billing_customers',
    'saas_subscriptions','saas_invoices','saas_support_tickets','saas_environment_settings',
    'feature_flags'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%I', t, t);
    execute format(
      'create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS (PaaS + SaaS)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'tenant_domains','saas_plans','saas_plan_features','saas_plan_limits',
    'feature_flags','tenant_features','tenant_limits','usage_metrics',
    'saas_billing_customers','saas_subscriptions','saas_subscription_events',
    'saas_invoices','saas_payments','saas_support_tickets','saas_environment_settings',
    'api_clients','oauth_tokens','webhook_subscriptions','webhook_deliveries',
    'marketplace_plugins','marketplace_installations','sandbox_environments','api_usage_logs'
  ]
  loop
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I_all on public.%I', t, t);
      if t in ('saas_plans','saas_plan_features','saas_plan_limits','feature_flags','marketplace_plugins') then
        execute format(
          'create policy %I_all on public.%I for select using (true)',
          t, t
        );
      elsif t = 'api_usage_logs' then
        execute format(
          'create policy %I_all on public.%I for all using (
             public.is_super_admin() or company_id in (select public.user_company_ids())
           )',
          t, t
        );
      else
        begin
          execute format(
            'create policy %I_all on public.%I for all using (
               public.is_super_admin()
               or (company_id is null and public.is_super_admin())
               or company_id in (select public.user_company_ids())
             ) with check (
               public.is_super_admin()
               or company_id in (select public.user_company_ids())
             )',
            t, t
          );
        exception when undefined_column then
          execute format(
            'create policy %I_all on public.%I for all using (public.is_super_admin())',
            t, t
          );
        end;
      end if;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seeds plans Start / Pro / Enterprise
-- ---------------------------------------------------------------------------
insert into public.saas_plans (id, code, name, description, price_monthly, price_yearly, trial_days, sort_order) values
  ('b1000001-0001-4000-8000-000000000001', 'start', 'Start', 'Até 500 alunos / 5 usuários', 297, 2970, 14, 1),
  ('b1000001-0001-4000-8000-000000000002', 'pro', 'Pro', 'Até 2.000 alunos / 20 usuários', 597, 5970, 14, 2),
  ('b1000001-0001-4000-8000-000000000003', 'enterprise', 'Enterprise', 'Sem limites', 0, 0, 30, 3)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  trial_days = excluded.trial_days,
  sort_order = excluded.sort_order;

-- features per plan
insert into public.saas_plan_features (plan_id, feature_key, enabled)
select p.id, f.k, f.en
from public.saas_plans p
cross join (values
  ('inventory', true), ('crm', true), ('ai', false), ('bi', false),
  ('pdv', false), ('marketplace', false), ('whiteLabel', false), ('mobile', false), ('api', false)
) as f(k, en)
where p.code = 'start'
on conflict (plan_id, feature_key) do update set enabled = excluded.enabled;

insert into public.saas_plan_features (plan_id, feature_key, enabled)
select p.id, f.k, true
from public.saas_plans p
cross join (values
  ('inventory'), ('crm'), ('ai'), ('bi'), ('pdv'), ('marketplace'), ('whiteLabel'), ('mobile'), ('api')
) as f(k)
where p.code = 'pro'
on conflict (plan_id, feature_key) do update set enabled = true;

insert into public.saas_plan_features (plan_id, feature_key, enabled)
select p.id, f.k, true
from public.saas_plans p
cross join (values
  ('inventory'), ('crm'), ('ai'), ('bi'), ('pdv'), ('marketplace'), ('whiteLabel'), ('mobile'), ('api')
) as f(k)
where p.code = 'enterprise'
on conflict (plan_id, feature_key) do update set enabled = true;

-- limits
insert into public.saas_plan_limits (plan_id, limit_key, limit_value)
select p.id, l.k, l.v::int
from public.saas_plans p
cross join (values
  ('students', 500), ('users', 5), ('units', 1), ('trainers', 10)
) as l(k, v)
where p.code = 'start'
on conflict (plan_id, limit_key) do update set limit_value = excluded.limit_value;

insert into public.saas_plan_limits (plan_id, limit_key, limit_value)
select p.id, l.k, l.v::int
from public.saas_plans p
cross join (values
  ('students', 2000), ('users', 20), ('units', 5), ('trainers', 50)
) as l(k, v)
where p.code = 'pro'
on conflict (plan_id, limit_key) do update set limit_value = excluded.limit_value;

insert into public.saas_plan_limits (plan_id, limit_key, limit_value)
select p.id, l.k, l.v
from public.saas_plans p
cross join (values
  ('students', null::int), ('users', null::int), ('units', null::int), ('trainers', null::int)
) as l(k, v)
where p.code = 'enterprise'
on conflict (plan_id, limit_key) do update set limit_value = excluded.limit_value;

insert into public.feature_flags (flag_key, description, default_enabled, environment, beta) values
  ('inventory', 'Estoque', true, 'all', false),
  ('crm', 'CRM academia', true, 'all', false),
  ('ai', 'Movvo AI', true, 'all', false),
  ('bi', 'BI / Analytics', true, 'all', false),
  ('pdv', 'PDV', true, 'all', false),
  ('marketplace', 'Marketplace', true, 'all', false),
  ('whiteLabel', 'White Label', true, 'all', false),
  ('mobile', 'Aplicativo', true, 'all', false),
  ('api', 'API pública', true, 'all', false)
on conflict (flag_key) do nothing;

-- demo company on Pro trial
update public.companies
set
  trade_name = coalesce(trade_name, name),
  plan_code = coalesce(plan_code, 'pro'),
  saas_status = case when saas_status is null or saas_status = '' then 'active' else saas_status end,
  activated_at = coalesce(activated_at, now()),
  trial_ends_at = coalesce(trial_ends_at, now() + interval '14 days')
where id = '11111111-1111-1111-1111-111111111111';
