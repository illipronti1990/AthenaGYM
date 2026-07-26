-- ATHENA Sprint 11 — user favorites + profile theme/preferences

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  href varchar(200) not null,
  label varchar(120) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (profile_id, company_id, href)
);

create index if not exists idx_user_favorites_profile
  on public.user_favorites(profile_id, company_id);

alter table public.user_favorites enable row level security;

drop policy if exists user_favorites_all on public.user_favorites;
create policy user_favorites_all on public.user_favorites
  for all using (
    public.is_super_admin()
    or (
      profile_id = auth.uid()
      and company_id in (select public.user_company_ids())
    )
  )
  with check (
    public.is_super_admin()
    or (
      profile_id = auth.uid()
      and company_id in (select public.user_company_ids())
    )
  );

alter table public.profiles
  add column if not exists theme varchar(20) not null default 'system',
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Helpful indexes for dashboard series
create index if not exists idx_checkins_company_created
  on public.checkins(company_id, created_at desc);

create index if not exists idx_students_company_birth
  on public.students(company_id, birth_date)
  where deleted_at is null and birth_date is not null;

create index if not exists idx_receivables_company_paid
  on public.receivables(company_id, paid_at)
  where deleted_at is null and paid_at is not null;
