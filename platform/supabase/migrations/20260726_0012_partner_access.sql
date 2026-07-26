-- Wellhub / TotalPass partner access approvals
-- ---------------------------------------------------------------------------

create table if not exists public.partner_integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  provider varchar(40) not null check (provider in ('wellhub', 'totalpass')),
  enabled boolean not null default true,
  status varchar(30) not null default 'connected',
  external_gym_id varchar(120),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, provider)
);

create table if not exists public.partner_access_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  provider varchar(40) not null check (provider in ('wellhub', 'totalpass')),
  status varchar(30) not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  member_name varchar(200) not null,
  member_document varchar(40),
  member_email varchar(200),
  external_member_id varchar(120),
  external_booking_id varchar(120),
  student_id uuid references public.students(id),
  checkin_id uuid references public.checkins(id),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  reject_reason varchar(255),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_access_pending
  on public.partner_access_requests(company_id, status, created_at desc);

create index if not exists idx_partner_access_provider
  on public.partner_access_requests(company_id, provider, created_at desc);

alter table public.partner_integrations enable row level security;
alter table public.partner_access_requests enable row level security;

drop policy if exists partner_integrations_tenant on public.partner_integrations;
create policy partner_integrations_tenant on public.partner_integrations for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists partner_access_requests_tenant on public.partner_access_requests;
create policy partner_access_requests_tenant on public.partner_access_requests for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- Seed integrations for DEV company
insert into public.partner_integrations (company_id, provider, enabled, status, external_gym_id)
values
  ('11111111-1111-1111-1111-111111111111', 'wellhub', true, 'connected', 'ATHENA-WELLHUB-DEV'),
  ('11111111-1111-1111-1111-111111111111', 'totalpass', true, 'connected', 'ATHENA-TOTALPASS-DEV')
on conflict (company_id, provider) do update
set enabled = excluded.enabled,
    status = excluded.status,
    updated_at = now();
