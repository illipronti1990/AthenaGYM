-- ATHENA PLATFORM Sprint 5 — Operação (Agenda, Check-in, Acesso)
-- rooms, schedules, class_enrollments, waitlist, checkins, access_devices, access_logs

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid not null references public.units(id),
  name varchar(120) not null,
  capacity integer not null default 20 check (capacity > 0),
  area varchar(60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_rooms_unit on public.rooms(unit_id) where deleted_at is null;

drop trigger if exists trg_rooms_updated on public.rooms;
create trigger trg_rooms_updated before update on public.rooms
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- schedules (agenda)
-- type: class | assessment | personal | nutrition | event | maintenance | reservation
-- ---------------------------------------------------------------------------
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid not null references public.units(id),
  title varchar(200) not null,
  type varchar(40) not null default 'class',
  start_at timestamptz not null,
  end_at timestamptz not null,
  teacher_id uuid references public.profiles(id),
  room_id uuid references public.rooms(id),
  max_capacity integer not null default 20 check (max_capacity > 0),
  status varchar(30) not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  check (end_at > start_at)
);

create index if not exists idx_schedules_company_unit on public.schedules(company_id, unit_id, start_at)
  where deleted_at is null;
create index if not exists idx_schedules_teacher on public.schedules(teacher_id) where deleted_at is null;
create index if not exists idx_schedules_type on public.schedules(type) where deleted_at is null;

drop trigger if exists trg_schedules_updated on public.schedules;
create trigger trg_schedules_updated before update on public.schedules
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- class_enrollments (reserva de aula)
-- status: reserved | checked_in | cancelled | waitlist | no_show
-- ---------------------------------------------------------------------------
create table if not exists public.class_enrollments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  student_id uuid not null references public.students(id),
  status varchar(30) not null default 'reserved',
  waitlist_position integer,
  checkin_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (schedule_id, student_id)
);

create index if not exists idx_class_enrollments_schedule on public.class_enrollments(schedule_id)
  where deleted_at is null;
create index if not exists idx_class_enrollments_student on public.class_enrollments(student_id)
  where deleted_at is null;
create index if not exists idx_class_enrollments_waitlist
  on public.class_enrollments(schedule_id, waitlist_position)
  where deleted_at is null and status = 'waitlist';

drop trigger if exists trg_class_enrollments_updated on public.class_enrollments;
create trigger trg_class_enrollments_updated before update on public.class_enrollments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- checkins
-- method: qr | biometric | facial | manual | nfc
-- ---------------------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid not null references public.units(id),
  student_id uuid not null references public.students(id),
  schedule_id uuid references public.schedules(id),
  method varchar(30) not null default 'manual',
  device varchar(120),
  device_id uuid,
  direction varchar(10) not null default 'in',
  created_at timestamptz not null default now()
);

create index if not exists idx_checkins_company_unit on public.checkins(company_id, unit_id, created_at desc);
create index if not exists idx_checkins_student on public.checkins(student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- access_devices (catracas / terminais)
-- ---------------------------------------------------------------------------
create table if not exists public.access_devices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid not null references public.units(id),
  name varchar(120) not null,
  manufacturer varchar(60),
  ip varchar(64),
  token varchar(120),
  provider varchar(40) not null default 'stub',
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_access_devices_unit on public.access_devices(unit_id) where deleted_at is null;

drop trigger if exists trg_access_devices_updated on public.access_devices;
create trigger trg_access_devices_updated before update on public.access_devices
for each row execute function public.set_updated_at();

alter table public.checkins
  drop constraint if exists checkins_device_id_fkey;
alter table public.checkins
  add constraint checkins_device_id_fkey
  foreign key (device_id) references public.access_devices(id);

-- ---------------------------------------------------------------------------
-- access_logs
-- ---------------------------------------------------------------------------
create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  student_id uuid references public.students(id),
  device_id uuid references public.access_devices(id),
  result varchar(20) not null,
  reason varchar(200),
  method varchar(30),
  raw jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_access_logs_company on public.access_logs(company_id, created_at desc);
create index if not exists idx_access_logs_student on public.access_logs(student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- occupancy_snapshots (opcional para histórico / KPIs)
-- ---------------------------------------------------------------------------
create table if not exists public.occupancy_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid not null references public.units(id),
  area varchar(60) not null default 'geral',
  present_count integer not null default 0,
  capacity integer not null default 0,
  occupancy_pct numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_occupancy_snapshots_unit
  on public.occupancy_snapshots(unit_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.rooms enable row level security;
alter table public.schedules enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.checkins enable row level security;
alter table public.access_devices enable row level security;
alter table public.access_logs enable row level security;
alter table public.occupancy_snapshots enable row level security;

drop policy if exists rooms_tenant on public.rooms;
create policy rooms_tenant on public.rooms for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists schedules_tenant on public.schedules;
create policy schedules_tenant on public.schedules for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists class_enrollments_tenant on public.class_enrollments;
create policy class_enrollments_tenant on public.class_enrollments for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists checkins_tenant on public.checkins;
create policy checkins_tenant on public.checkins for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists access_devices_tenant on public.access_devices;
create policy access_devices_tenant on public.access_devices for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists access_logs_tenant on public.access_logs;
create policy access_logs_tenant on public.access_logs for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists occupancy_snapshots_tenant on public.occupancy_snapshots;
create policy occupancy_snapshots_tenant on public.occupancy_snapshots for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('operations', 'read', 'operations.read', 'Ler agenda, check-ins e ocupação'),
  ('operations', 'create', 'operations.create', 'Criar agenda e reservas'),
  ('operations', 'update', 'operations.update', 'Atualizar agenda e reservas'),
  ('operations', 'delete', 'operations.delete', 'Cancelar reservas / remover agenda'),
  ('operations', 'checkin', 'operations.checkin', 'Registrar check-in'),
  ('operations', 'access', 'operations.access', 'Validar acesso e abrir catraca'),
  ('operations', 'configure', 'operations.configure', 'Configurar salas e dispositivos')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- super_admin + admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'operations.%' on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'operations.%' on conflict do nothing;

-- manager
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'operations.read', 'operations.create', 'operations.update',
  'operations.checkin', 'operations.access', 'operations.configure'
) on conflict do nothing;

-- reception
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id from public.permissions p
where p.code in (
  'operations.read', 'operations.create', 'operations.checkin', 'operations.access'
) on conflict do nothing;

-- trainer (aaa6 if exists — from iam seed)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'trainer' and r.company_id is null and r.deleted_at is null
  and p.code in ('operations.read', 'operations.checkin', 'operations.update')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- seed rooms DEV
-- ---------------------------------------------------------------------------
insert into public.rooms (id, company_id, unit_id, name, capacity, area, active) values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Musculação', 80, 'musculacao', true),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Cardio', 40, 'cardio', true),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Funcional', 25, 'funcional', true),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Cross Training', 20, 'cross', true)
on conflict (id) do update set name = excluded.name, capacity = excluded.capacity, active = true, deleted_at = null;

insert into public.access_devices (id, company_id, unit_id, name, manufacturer, provider, status) values
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Catraca Recepção', 'Stub', 'stub', 'active')
on conflict (id) do update set name = excluded.name, status = 'active', deleted_at = null;
