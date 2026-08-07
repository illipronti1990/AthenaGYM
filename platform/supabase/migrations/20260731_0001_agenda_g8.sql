-- ATHENA G-8 — Agenda, Aulas e Reservas
-- modalities, enrich schedules/rooms/enrollments, audit logs

-- ---------------------------------------------------------------------------
-- modalities
-- ---------------------------------------------------------------------------
create table if not exists public.modalities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  slug varchar(120) not null,
  color varchar(20) not null default '#0f766e',
  default_teacher_id uuid references public.profiles(id),
  default_room_id uuid references public.rooms(id),
  default_capacity integer not null default 20 check (default_capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create index if not exists idx_modalities_company on public.modalities(company_id)
  where deleted_at is null;

drop trigger if exists trg_modalities_updated on public.modalities;
create trigger trg_modalities_updated before update on public.modalities
for each row execute function public.set_updated_at();

alter table public.modalities enable row level security;
drop policy if exists modalities_tenant on public.modalities;
create policy modalities_tenant on public.modalities for all using (
  company_id in (select public.user_company_ids())
) with check (
  company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- enrich schedules
-- ---------------------------------------------------------------------------
alter table public.schedules
  add column if not exists modality_id uuid references public.modalities(id),
  add column if not exists color varchar(20),
  add column if not exists recurrence_rule text,
  add column if not exists series_id uuid,
  add column if not exists is_block boolean not null default false,
  add column if not exists equipment_notes text;

create index if not exists idx_schedules_modality on public.schedules(modality_id)
  where deleted_at is null;
create index if not exists idx_schedules_series on public.schedules(series_id)
  where deleted_at is null and series_id is not null;
create index if not exists idx_schedules_room_start on public.schedules(room_id, start_at)
  where deleted_at is null;
create index if not exists idx_schedules_teacher_start on public.schedules(teacher_id, start_at)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- enrich rooms
-- ---------------------------------------------------------------------------
alter table public.rooms
  add column if not exists equipment_json jsonb not null default '[]'::jsonb,
  add column if not exists status varchar(30) not null default 'active';

-- ---------------------------------------------------------------------------
-- enrich class_enrollments (attendance)
-- ---------------------------------------------------------------------------
alter table public.class_enrollments
  add column if not exists attended_at timestamptz,
  add column if not exists marked_by uuid references public.profiles(id),
  add column if not exists source varchar(30) not null default 'manual';

-- ---------------------------------------------------------------------------
-- schedule audit logs
-- ---------------------------------------------------------------------------
create table if not exists public.schedule_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  schedule_id uuid references public.schedules(id) on delete set null,
  actor_id uuid references public.profiles(id),
  action varchar(60) not null,
  diff jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_schedule_audit_schedule on public.schedule_audit_logs(schedule_id, created_at desc);
create index if not exists idx_schedule_audit_company on public.schedule_audit_logs(company_id, created_at desc);

alter table public.schedule_audit_logs enable row level security;
drop policy if exists schedule_audit_tenant on public.schedule_audit_logs;
create policy schedule_audit_tenant on public.schedule_audit_logs for all using (
  company_id in (select public.user_company_ids())
) with check (
  company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- unit setting: auto attendance on check-in (document via company_settings if exists;
-- fallback column on units)
-- ---------------------------------------------------------------------------
alter table public.units
  add column if not exists auto_attendance_on_checkin boolean not null default true;

-- ---------------------------------------------------------------------------
-- Seed modalities (DEV company)
-- ---------------------------------------------------------------------------
insert into public.modalities (id, company_id, name, slug, color, default_capacity)
values
  ('c8888888-8888-8888-8888-888888888801', '11111111-1111-1111-1111-111111111111', 'Musculação', 'musculacao', '#0f766e', 40),
  ('c8888888-8888-8888-8888-888888888802', '11111111-1111-1111-1111-111111111111', 'Funcional', 'funcional', '#0369a1', 20),
  ('c8888888-8888-8888-8888-888888888803', '11111111-1111-1111-1111-111111111111', 'Cross Training', 'cross', '#b45309', 16),
  ('c8888888-8888-8888-8888-888888888804', '11111111-1111-1111-1111-111111111111', 'Pilates', 'pilates', '#7c3aed', 10),
  ('c8888888-8888-8888-8888-888888888805', '11111111-1111-1111-1111-111111111111', 'Yoga', 'yoga', '#15803d', 15),
  ('c8888888-8888-8888-8888-888888888806', '11111111-1111-1111-1111-111111111111', 'Dança', 'danca', '#db2777', 20),
  ('c8888888-8888-8888-8888-888888888807', '11111111-1111-1111-1111-111111111111', 'HIIT', 'hiit', '#dc2626', 18),
  ('c8888888-8888-8888-8888-888888888808', '11111111-1111-1111-1111-111111111111', 'Spinning', 'spinning', '#ea580c', 20),
  ('c8888888-8888-8888-8888-888888888809', '11111111-1111-1111-1111-111111111111', 'Jump', 'jump', '#0891b2', 16),
  ('c8888888-8888-8888-8888-88888888880a', '11111111-1111-1111-1111-111111111111', 'Alongamento', 'alongamento', '#65a30d', 25),
  ('c8888888-8888-8888-8888-88888888880b', '11111111-1111-1111-1111-111111111111', 'Personal', 'personal', '#475569', 1)
on conflict (company_id, slug) do update set
  name = excluded.name,
  color = excluded.color,
  default_capacity = excluded.default_capacity,
  deleted_at = null,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- RBAC: ensure student can read operations + enroll path (operations.read already)
-- trainer already has operations.read/update
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'student'
  and p.code in ('operations.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('trainer', 'personal', 'reception')
  and p.code in ('operations.read', 'operations.create', 'operations.update')
on conflict do nothing;
