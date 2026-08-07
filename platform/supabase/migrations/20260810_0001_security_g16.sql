-- Movvo G-16 — Security, LGPD, Audit & Compliance

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('security', 'read', 'security.read', 'Ver dashboard e eventos de segurança'),
  ('security', 'write', 'security.write', 'Gerenciar MFA/sessões/retenção/bloqueios'),
  ('lgpd', 'manage', 'lgpd.manage', 'Exportar/anonimizar/excluir dados LGPD'),
  ('lgpd', 'read', 'lgpd.read', 'Consultar consentimentos e solicitações LGPD')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin', 'admin')
  and p.code in ('security.read', 'security.write', 'lgpd.manage', 'lgpd.read')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Extend audit_logs
-- ---------------------------------------------------------------------------
alter table public.audit_logs
  add column if not exists before_data jsonb,
  add column if not exists after_data jsonb,
  add column if not exists request_id varchar(64),
  add column if not exists severity varchar(20) not null default 'info';

do $$ begin
  alter table public.audit_logs drop constraint if exists audit_logs_severity_check;
  alter table public.audit_logs
    add constraint audit_logs_severity_check
    check (severity in ('info', 'low', 'medium', 'high', 'critical'));
exception when others then null;
end $$;

create index if not exists idx_audit_logs_request on public.audit_logs(request_id) where request_id is not null;
create index if not exists idx_audit_logs_severity on public.audit_logs(severity, created_at desc);

-- ---------------------------------------------------------------------------
-- user_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  session_token_hash varchar(128),
  supabase_session_id text,
  device varchar(120),
  browser text,
  ip varchar(64),
  city varchar(80),
  country varchar(80),
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason varchar(80)
);

create index if not exists idx_user_sessions_user on public.user_sessions(user_id, revoked_at, last_seen_at desc);
create index if not exists idx_user_sessions_company on public.user_sessions(company_id, created_at desc);

alter table public.user_sessions enable row level security;
drop policy if exists user_sessions_own on public.user_sessions;
create policy user_sessions_own on public.user_sessions for select using (
  user_id = auth.uid()
  or company_id in (select public.user_company_ids())
  or public.is_super_admin()
);
drop policy if exists user_sessions_insert on public.user_sessions;
create policy user_sessions_insert on public.user_sessions for insert with check (
  user_id = auth.uid() or public.is_super_admin()
);
drop policy if exists user_sessions_update on public.user_sessions;
create policy user_sessions_update on public.user_sessions for update using (
  user_id = auth.uid()
  or company_id in (select public.user_company_ids())
  or public.is_super_admin()
);

-- ---------------------------------------------------------------------------
-- user_mfa
-- ---------------------------------------------------------------------------
create table if not exists public.user_mfa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  company_id uuid references public.companies(id) on delete set null,
  totp_enabled boolean not null default false,
  email_otp_enabled boolean not null default false,
  supabase_factor_id text,
  recovery_codes_hash text[],
  email_otp_hash varchar(128),
  email_otp_expires_at timestamptz,
  preferred_method varchar(20) not null default 'totp'
    check (preferred_method in ('totp', 'email')),
  enforced_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_mfa_company on public.user_mfa(company_id);

alter table public.user_mfa enable row level security;
drop policy if exists user_mfa_own on public.user_mfa;
create policy user_mfa_own on public.user_mfa for all using (
  user_id = auth.uid() or public.is_super_admin()
) with check (
  user_id = auth.uid() or public.is_super_admin()
);

-- ---------------------------------------------------------------------------
-- security_events
-- ---------------------------------------------------------------------------
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  event_type varchar(60) not null,
  severity varchar(20) not null default 'medium'
    check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  email varchar(200),
  ip varchar(64),
  fingerprint varchar(128),
  details jsonb not null default '{}'::jsonb,
  audit_log_id uuid references public.audit_logs(id) on delete set null,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_type on public.security_events(event_type, created_at desc);
create index if not exists idx_security_events_email on public.security_events(email, created_at desc);
create index if not exists idx_security_events_ip on public.security_events(ip, created_at desc);
create index if not exists idx_security_events_company on public.security_events(company_id, created_at desc);

alter table public.security_events enable row level security;
drop policy if exists security_events_tenant on public.security_events;
create policy security_events_tenant on public.security_events for select using (
  public.is_super_admin()
  or company_id in (select public.user_company_ids())
  or company_id is null
);

-- ---------------------------------------------------------------------------
-- consents
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subject_user_id uuid references public.profiles(id) on delete set null,
  subject_email varchar(200),
  purpose varchar(80) not null,
  version varchar(20) not null default '1.0',
  legal_basis varchar(80) not null default 'consent',
  granted boolean not null default true,
  evidence jsonb not null default '{}'::jsonb,
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_consents_company on public.consents(company_id, purpose, created_at desc);
create index if not exists idx_consents_subject on public.consents(subject_user_id, purpose);

alter table public.consents enable row level security;
drop policy if exists consents_tenant on public.consents;
create policy consents_tenant on public.consents for all using (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
) with check (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
);

create table if not exists public.lgpd_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  subject_user_id uuid references public.profiles(id) on delete set null,
  subject_email varchar(200),
  request_type varchar(30) not null
    check (request_type in ('export', 'anonymize', 'erase')),
  status varchar(30) not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'rejected')),
  requested_by uuid references public.profiles(id),
  result_url text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lgpd_requests_company on public.lgpd_requests(company_id, created_at desc);

alter table public.lgpd_requests enable row level security;
drop policy if exists lgpd_requests_tenant on public.lgpd_requests;
create policy lgpd_requests_tenant on public.lgpd_requests for all using (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
) with check (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
);

-- ---------------------------------------------------------------------------
-- retention_policies
-- ---------------------------------------------------------------------------
create table if not exists public.retention_policies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  resource varchar(40) not null
    check (resource in ('logs', 'audit', 'files', 'backup', 'security_events')),
  retain_days int not null default 365 check (retain_days >= 30),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, resource)
);

alter table public.retention_policies enable row level security;
drop policy if exists retention_policies_tenant on public.retention_policies;
create policy retention_policies_tenant on public.retention_policies for all using (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
) with check (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
);

-- ---------------------------------------------------------------------------
-- integration_secrets (encrypted at rest)
-- ---------------------------------------------------------------------------
create table if not exists public.integration_secrets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider varchar(40) not null,
  environment varchar(20) not null default 'production'
    check (environment in ('development', 'homologation', 'production')),
  key_name varchar(80) not null,
  ciphertext text not null,
  iv varchar(64) not null,
  key_version int not null default 1,
  rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider, environment, key_name)
);

create index if not exists idx_integration_secrets_company on public.integration_secrets(company_id, provider);

alter table public.integration_secrets enable row level security;
drop policy if exists integration_secrets_tenant on public.integration_secrets;
create policy integration_secrets_tenant on public.integration_secrets for all using (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
) with check (
  company_id in (select public.user_company_ids()) or public.is_super_admin()
);

-- ---------------------------------------------------------------------------
-- backup_logs
-- ---------------------------------------------------------------------------
create table if not exists public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  backup_type varchar(30) not null default 'tenant_export'
    check (backup_type in ('tenant_export', 'daily', 'weekly', 'monthly', 'restore_test')),
  status varchar(30) not null default 'pending'
    check (status in ('pending', 'running', 'success', 'failed')),
  storage_path text,
  bytes bigint,
  checksum varchar(128),
  triggered_by uuid references public.profiles(id),
  error text,
  meta jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_backup_logs_company on public.backup_logs(company_id, started_at desc);

alter table public.backup_logs enable row level security;
drop policy if exists backup_logs_tenant on public.backup_logs;
create policy backup_logs_tenant on public.backup_logs for select using (
  public.is_super_admin()
  or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- api_rate_limits (optional counters for login/public)
-- ---------------------------------------------------------------------------
create table if not exists public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  bucket_key varchar(200) not null,
  window_start timestamptz not null,
  hit_count int not null default 0,
  unique (bucket_key, window_start)
);

create index if not exists idx_api_rate_limits_bucket on public.api_rate_limits(bucket_key, window_start desc);
