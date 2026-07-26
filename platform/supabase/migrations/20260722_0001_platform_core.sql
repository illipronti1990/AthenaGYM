-- ATHENA PLATFORM Sprint 0 — core SaaS schema (UUID + soft delete + RLS)
-- Parallel to legacy tables (empresas, alunos, ...). Do NOT drop legacy.
-- Apply: Supabase SQL Editor OR scripts/apply_sql_supabase from cloud/api pointing to this file.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  legal_name varchar(200),
  document varchar(18),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create index if not exists idx_companies_status on public.companies(status) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- units
-- ---------------------------------------------------------------------------
create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(150) not null,
  code varchar(20),
  city varchar(80),
  state varchar(2),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create index if not exists idx_units_company on public.units(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(150),
  email varchar(160),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

-- ---------------------------------------------------------------------------
-- memberships
-- ---------------------------------------------------------------------------
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  role varchar(40) not null default 'admin',
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  unique (profile_id, company_id, role)
);

create index if not exists idx_memberships_profile on public.memberships(profile_id) where deleted_at is null;
create index if not exists idx_memberships_company on public.memberships(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists trg_units_updated on public.units;
create trigger trg_units_updated before update on public.units
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_memberships_updated on public.memberships;
create trigger trg_memberships_updated before update on public.memberships
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.profile_id = auth.uid()
      and m.role = 'super_admin'
      and m.status = 'active'
      and m.deleted_at is null
  );
$$;

create or replace function public.user_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.company_id from public.memberships m
  where m.profile_id = auth.uid()
    and m.status = 'active'
    and m.deleted_at is null;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.units enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select using (
    public.is_super_admin() or id in (select public.user_company_ids())
  );

drop policy if exists companies_write on public.companies;
create policy companies_write on public.companies
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists units_select on public.units;
create policy units_select on public.units
  for select using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists units_write on public.units;
create policy units_write on public.units
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    public.is_super_admin() or id = auth.uid()
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (
    public.is_super_admin()
    or profile_id = auth.uid()
    or company_id in (select public.user_company_ids())
  );

-- ---------------------------------------------------------------------------
-- Seed DEV (company + unit). Profile/membership after Auth user exists — see README.
-- ---------------------------------------------------------------------------
insert into public.companies (id, name, legal_name, document, status)
values (
  '11111111-1111-1111-1111-111111111111',
  'ATHENA GYM',
  'ATHENA GYM ACADEMIA LTDA',
  '12.345.678/0001-90',
  'active'
)
on conflict (id) do update set name = excluded.name, status = 'active', deleted_at = null;

insert into public.units (id, company_id, name, code, city, state, status)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ATHENA GYM Matriz',
  'MX',
  'São Paulo',
  'SP',
  'active'
)
on conflict (id) do update set name = excluded.name, status = 'active', deleted_at = null;

-- Storage path convention (document only — create buckets in Dashboard):
-- companies/{company_id}/logos|students|assessment|contracts|documents|workouts
