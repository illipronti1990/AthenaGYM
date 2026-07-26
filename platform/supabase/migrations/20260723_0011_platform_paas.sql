-- ATHENA PLATFORM Sprint 9 — Plataforma Aberta, Marketplace e Ecossistema (PaaS)
-- Public API clients, OAuth2 tokens, outbound webhooks, marketplace plugins, sandbox, usage logs.

-- ---------------------------------------------------------------------------
-- API clients (OAuth2 credentials + scopes)
-- ---------------------------------------------------------------------------
create table if not exists public.api_clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(160) not null,
  client_id varchar(64) not null unique,
  client_secret_hash text not null,
  scopes text[] not null default '{}',
  status varchar(30) not null default 'active'
    check (status in ('active', 'suspended', 'revoked')),
  environment varchar(20) not null default 'production'
    check (environment in ('production', 'sandbox')),
  ip_allowlist text[] not null default '{}',
  rate_limit_per_minute integer not null default 60,
  rate_limit_per_day integer not null default 10000,
  last_used_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_api_clients_company
  on public.api_clients(company_id) where deleted_at is null;

create index if not exists idx_api_clients_env
  on public.api_clients(company_id, environment) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- OAuth2 tokens
-- ---------------------------------------------------------------------------
create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  api_client_id uuid not null references public.api_clients(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  access_token_hash text not null,
  refresh_token_hash text,
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_oauth_tokens_client
  on public.oauth_tokens(api_client_id) where revoked_at is null;

create index if not exists idx_oauth_tokens_access
  on public.oauth_tokens(access_token_hash) where revoked_at is null;

-- ---------------------------------------------------------------------------
-- Outbound webhook subscriptions + deliveries
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  api_client_id uuid references public.api_clients(id),
  url text not null,
  signing_secret text not null,
  secret_hint varchar(12) not null,
  events text[] not null default '{}',
  status varchar(30) not null default 'active'
    check (status in ('active', 'paused', 'disabled')),
  environment varchar(20) not null default 'production'
    check (environment in ('production', 'sandbox')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_webhook_subs_company
  on public.webhook_subscriptions(company_id) where deleted_at is null;

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  subscription_id uuid not null references public.webhook_subscriptions(id) on delete cascade,
  event_type varchar(80) not null,
  payload jsonb not null default '{}',
  status varchar(30) not null default 'pending'
    check (status in ('pending', 'delivering', 'delivered', 'failed', 'dead')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_status_code integer,
  last_error text,
  response_ms integer,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_deliveries_pending
  on public.webhook_deliveries(status, next_attempt_at)
  where status in ('pending', 'failed');

create index if not exists idx_webhook_deliveries_company
  on public.webhook_deliveries(company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Marketplace plugins
-- ---------------------------------------------------------------------------
create table if not exists public.marketplace_plugins (
  id uuid primary key default gen_random_uuid(),
  slug varchar(80) not null unique,
  name varchar(160) not null,
  description text,
  version varchar(40) not null default '1.0.0',
  publisher varchar(160) not null default 'ATHENA',
  category varchar(60) not null default 'general',
  permissions jsonb not null default '[]',
  manifest jsonb not null default '{}',
  status varchar(30) not null default 'published'
    check (status in ('draft', 'published', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_installations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  plugin_id uuid not null references public.marketplace_plugins(id),
  status varchar(30) not null default 'installed'
    check (status in ('installed', 'configured', 'disabled', 'removed')),
  config jsonb not null default '{}',
  installed_by uuid references public.profiles(id),
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, plugin_id)
);

create index if not exists idx_marketplace_installations_company
  on public.marketplace_installations(company_id);

-- ---------------------------------------------------------------------------
-- Sandbox environments
-- ---------------------------------------------------------------------------
create table if not exists public.sandbox_environments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(160) not null,
  status varchar(30) not null default 'active'
    check (status in ('active', 'resetting', 'disabled')),
  mock_data jsonb not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

-- ---------------------------------------------------------------------------
-- Public API usage / observability
-- ---------------------------------------------------------------------------
create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  api_client_id uuid references public.api_clients(id),
  endpoint varchar(200) not null,
  method varchar(10) not null,
  status_code integer not null,
  latency_ms integer not null default 0,
  error_code varchar(80),
  environment varchar(20) not null default 'production',
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_company_created
  on public.api_usage_logs(company_id, created_at desc);

create index if not exists idx_api_usage_client_created
  on public.api_usage_logs(api_client_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Seed marketplace plugins
-- ---------------------------------------------------------------------------
insert into public.marketplace_plugins (slug, name, description, version, publisher, category, permissions, manifest)
values
  (
    'nutrition',
    'Nutrição',
    'Planos alimentares, macros e integração com o aluno.',
    '1.0.0',
    'ATHENA Labs',
    'health',
    '["students.read","workouts.read"]'::jsonb,
    '{"menu":"Nutrição","tables":["nutrition_plans"],"api":"/plugins/nutrition"}'::jsonb
  ),
  (
    'wearables-sync',
    'Wearables Sync',
    'Sincroniza passos, FC e calorias de wearables.',
    '1.0.0',
    'ATHENA Labs',
    'wearables',
    '["students.read","workouts.write"]'::jsonb,
    '{"menu":"Wearables","providers":["apple_health","google_fit","garmin","fitbit"]}'::jsonb
  ),
  (
    'accounting-bridge',
    'Ponte Contábil',
    'Envia notas e pagamentos para ERPs contábeis.',
    '1.0.0',
    'ATHENA Labs',
    'finance',
    '["finance.read","payments.create"]'::jsonb,
    '{"connectors":["conta_azul","omie","tiny","bling"]}'::jsonb
  )
on conflict (slug) do update set
  description = excluded.description,
  version = excluded.version,
  manifest = excluded.manifest,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- permissions (developer portal / marketplace admin)
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('platform', 'read', 'platform.read', 'Ler portal do desenvolvedor e consumo de API'),
  ('platform', 'manage', 'platform.manage', 'Gerenciar API clients, OAuth e sandbox'),
  ('platform', 'webhooks', 'platform.webhooks', 'Gerenciar webhooks outbound'),
  ('marketplace', 'read', 'marketplace.read', 'Listar plugins do marketplace'),
  ('marketplace', 'manage', 'marketplace.manage', 'Instalar e configurar plugins'),
  ('integrations', 'read', 'integrations.read', 'Ler Integration Hub'),
  ('integrations', 'manage', 'integrations.manage', 'Configurar conectores do hub')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- super_admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'platform.%' or p.code like 'marketplace.%' or p.code like 'integrations.%'
on conflict do nothing;

-- admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'platform.%' or p.code like 'marketplace.%' or p.code like 'integrations.%'
on conflict do nothing;

-- manager
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'platform.read','platform.webhooks','marketplace.read','marketplace.manage','integrations.read'
) on conflict do nothing;

-- finance
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id from public.permissions p
where p.code in ('platform.read','integrations.read','marketplace.read')
on conflict do nothing;
