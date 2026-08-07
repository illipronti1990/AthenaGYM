-- Sprint G-4 — Matrículas, Planos e Contratos (plans enrich + lifecycle)

-- ---------------------------------------------------------------------------
-- plans — enriched fields
-- ---------------------------------------------------------------------------
alter table public.plans
  add column if not exists plan_type varchar(40) not null default 'mensal',
  add column if not exists frequency varchar(40),
  add column if not exists allowed_days int[],
  add column if not exists allowed_hours jsonb,
  add column if not exists fidelity_days int not null default 0,
  add column if not exists grace_days int not null default 0,
  add column if not exists discount_percent numeric(5,2) not null default 0,
  add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- enrollments — lifecycle fields
-- ---------------------------------------------------------------------------
alter table public.enrollments
  add column if not exists trainer_id uuid references public.profiles(id),
  add column if not exists discount_percent numeric(5,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists payment_method varchar(40),
  add column if not exists monthly_fee numeric(12,2),
  add column if not exists notes text,
  add column if not exists cancel_reason varchar(80),
  add column if not exists cancelled_at timestamptz;

create index if not exists idx_enrollments_end_date
  on public.enrollments(company_id, end_date)
  where deleted_at is null and status in ('active', 'frozen');

create index if not exists idx_enrollments_status
  on public.enrollments(company_id, status)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- contracts — digital signature
-- ---------------------------------------------------------------------------
alter table public.contracts
  add column if not exists signature_data text,
  add column if not exists signed_name varchar(160),
  add column if not exists signed_ip varchar(64);

-- ---------------------------------------------------------------------------
-- enrollment_freezes
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_freezes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason varchar(120) not null,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_enrollment_freezes_enrollment
  on public.enrollment_freezes(enrollment_id, start_date)
  where deleted_at is null;

create index if not exists idx_enrollment_freezes_active
  on public.enrollment_freezes(enrollment_id, start_date, end_date)
  where deleted_at is null and ended_at is null;

-- ---------------------------------------------------------------------------
-- enrollment_events (timeline)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  kind varchar(40) not null,
  title varchar(160) not null,
  description text,
  meta jsonb,
  created_by uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_enrollment_events_enrollment
  on public.enrollment_events(enrollment_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- enrollment_plan_changes (upgrade/downgrade)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollment_plan_changes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  from_plan_id uuid not null references public.plans(id),
  to_plan_id uuid not null references public.plans(id),
  proration_amount numeric(12,2) not null default 0,
  credit_amount numeric(12,2) not null default 0,
  effective_date date not null default current_date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_enrollment_plan_changes_enrollment
  on public.enrollment_plan_changes(enrollment_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.enrollment_freezes enable row level security;
alter table public.enrollment_events enable row level security;
alter table public.enrollment_plan_changes enable row level security;

drop policy if exists enrollment_freezes_all on public.enrollment_freezes;
create policy enrollment_freezes_all on public.enrollment_freezes
  for all using (true) with check (true);

drop policy if exists enrollment_events_all on public.enrollment_events;
create policy enrollment_events_all on public.enrollment_events
  for all using (true) with check (true);

drop policy if exists enrollment_plan_changes_all on public.enrollment_plan_changes;
create policy enrollment_plan_changes_all on public.enrollment_plan_changes
  for all using (true) with check (true);
