-- ATHENA PLATFORM Sprint 1 — IAM RBAC
-- Evolves profiles + roles/permissions/user_roles/invites/audit_logs + RLS + seed

-- ---------------------------------------------------------------------------
-- profiles evolution
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists default_unit_id uuid references public.units(id),
  add column if not exists phone varchar(40),
  add column if not exists status varchar(20) not null default 'active',
  add column if not exists last_login_at timestamptz,
  add column if not exists locale varchar(10) default 'pt-BR',
  add column if not exists timezone varchar(64) default 'America/Sao_Paulo';

create index if not exists idx_profiles_company on public.profiles(company_id) where deleted_at is null;
create index if not exists idx_profiles_status on public.profiles(status) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- permissions (global catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  module varchar(60) not null,
  action varchar(40) not null,
  code varchar(120) not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- roles (system: company_id null; tenant roles: company_id set)
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  name varchar(120) not null,
  slug varchar(80) not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create unique index if not exists idx_roles_system_slug
  on public.roles(slug) where company_id is null and deleted_at is null;

create index if not exists idx_roles_company on public.roles(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- role_permissions
-- ---------------------------------------------------------------------------
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- user_roles (authorization source of truth)
-- ---------------------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create index if not exists idx_user_roles_profile on public.user_roles(profile_id) where deleted_at is null;
create index if not exists idx_user_roles_company on public.user_roles(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- invites
-- ---------------------------------------------------------------------------
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  role_id uuid not null references public.roles(id),
  email varchar(160) not null,
  full_name varchar(150),
  phone varchar(40),
  token varchar(64) not null unique,
  status varchar(20) not null default 'pending',
  expires_at timestamptz not null,
  invited_by uuid references public.profiles(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_invites_company on public.invites(company_id) where deleted_at is null;
create index if not exists idx_invites_token on public.invites(token) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  user_id uuid references public.profiles(id),
  module varchar(60) not null,
  action varchar(60) not null,
  entity varchar(80),
  entity_id varchar(80),
  ip varchar(64),
  browser text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_company on public.audit_logs(company_id, created_at desc);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- triggers updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists trg_roles_updated on public.roles;
create trigger trg_roles_updated before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists trg_permissions_updated on public.permissions;
create trigger trg_permissions_updated before update on public.permissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_roles_updated on public.user_roles;
create trigger trg_user_roles_updated before update on public.user_roles
for each row execute function public.set_updated_at();

drop trigger if exists trg_invites_updated on public.invites;
create trigger trg_invites_updated before update on public.invites
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- helper: is_super_admin via user_roles (keep memberships fallback)
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.profile_id = auth.uid()
      and ur.deleted_at is null
      and r.deleted_at is null
      and r.slug = 'super_admin'
  )
  or exists (
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
  select distinct company_id from (
    select m.company_id
    from public.memberships m
    where m.profile_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
    union
    select ur.company_id
    from public.user_roles ur
    where ur.profile_id = auth.uid()
      and ur.deleted_at is null
  ) t;
$$;

create or replace function public.user_unit_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select distinct unit_id from public.user_roles ur
  where ur.profile_id = auth.uid()
    and ur.deleted_at is null
    and ur.unit_id is not null;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.invites enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
  for select using (deleted_at is null);

drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select using (
    public.is_super_admin()
    or company_id is null
    or company_id in (select public.user_company_ids())
  );

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select using (true);

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select using (
    public.is_super_admin()
    or profile_id = auth.uid()
    or company_id in (select public.user_company_ids())
  );

drop policy if exists user_roles_write on public.user_roles;
create policy user_roles_write on public.user_roles
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists invites_select on public.invites;
create policy invites_select on public.invites
  for select using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists invites_write on public.invites;
create policy invites_write on public.invites
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert with check (
    public.is_super_admin()
    or company_id is null
    or company_id in (select public.user_company_ids())
  );

-- profiles: allow company members to list peers
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    public.is_super_admin()
    or id = auth.uid()
    or company_id in (select public.user_company_ids())
  );

-- ---------------------------------------------------------------------------
-- Seed permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('dashboard', 'read', 'dashboard.read', 'Ver dashboard'),
  ('students', 'read', 'students.read', 'Listar alunos'),
  ('students', 'create', 'students.create', 'Criar alunos'),
  ('students', 'update', 'students.update', 'Editar alunos'),
  ('students', 'delete', 'students.delete', 'Excluir alunos'),
  ('finance', 'read', 'finance.read', 'Ver financeiro'),
  ('finance', 'create', 'finance.create', 'Criar lançamentos'),
  ('finance', 'export', 'finance.export', 'Exportar financeiro'),
  ('crm', 'manage', 'crm.manage', 'Gerenciar CRM'),
  ('workouts', 'update', 'workouts.update', 'Editar treinos'),
  ('users', 'read', 'users.read', 'Listar usuários'),
  ('users', 'create', 'users.create', 'Convidar usuários'),
  ('users', 'update', 'users.update', 'Editar usuários'),
  ('users', 'delete', 'users.delete', 'Desativar usuários'),
  ('roles', 'read', 'roles.read', 'Ver cargos'),
  ('roles', 'manage', 'roles.manage', 'Gerenciar cargos'),
  ('audit', 'read', 'audit.read', 'Ver auditoria')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- ---------------------------------------------------------------------------
-- Seed system roles
-- ---------------------------------------------------------------------------
insert into public.roles (id, company_id, name, slug, description, is_system)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', null, 'Super Admin', 'super_admin', 'Acesso total da plataforma', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', null, 'Administrador', 'admin', 'Administrador da academia', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', null, 'Gerente', 'manager', 'Gerente operacional', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', null, 'Recepção', 'reception', 'Atendimento e matrículas', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', null, 'Financeiro', 'finance', 'Financeiro', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', null, 'Professor', 'trainer', 'Professor / instrutor', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', null, 'Personal', 'personal', 'Personal trainer', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', null, 'Aluno', 'student', 'Aluno', true)
on conflict (id) do update set name = excluded.name, description = excluded.description, is_system = true, deleted_at = null;

-- Map all permissions to super_admin + admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p where p.deleted_at is null
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p where p.deleted_at is null
on conflict do nothing;

-- manager
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'dashboard.read','students.read','students.create','students.update',
  'finance.read','crm.manage','workouts.update','users.read','roles.read'
)
on conflict do nothing;

-- reception
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id from public.permissions p
where p.code in ('dashboard.read','students.read','students.create','students.update','crm.manage')
on conflict do nothing;

-- finance
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id from public.permissions p
where p.code in ('dashboard.read','finance.read','finance.create','finance.export','students.read')
on conflict do nothing;

-- trainer / personal
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', p.id from public.permissions p
where p.code in ('dashboard.read','students.read','workouts.update')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', p.id from public.permissions p
where p.code in ('dashboard.read','students.read','workouts.update')
on conflict do nothing;

-- student
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', p.id from public.permissions p
where p.code in ('dashboard.read')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Backfill user_roles from memberships
-- ---------------------------------------------------------------------------
insert into public.user_roles (profile_id, role_id, company_id, unit_id)
select
  m.profile_id,
  r.id,
  m.company_id,
  m.unit_id
from public.memberships m
join public.roles r on r.slug = m.role and r.company_id is null and r.deleted_at is null
where m.deleted_at is null
  and m.status = 'active'
  and not exists (
    select 1 from public.user_roles ur
    where ur.profile_id = m.profile_id
      and ur.role_id = r.id
      and ur.company_id = m.company_id
      and ur.deleted_at is null
      and coalesce(ur.unit_id::text, '') = coalesce(m.unit_id::text, '')
  );

-- Sync profile company/unit from first membership when null
update public.profiles p
set company_id = m.company_id,
    default_unit_id = coalesce(p.default_unit_id, m.unit_id)
from (
  select distinct on (profile_id) profile_id, company_id, unit_id
  from public.memberships
  where deleted_at is null and status = 'active'
  order by profile_id, created_at
) m
where p.id = m.profile_id and p.company_id is null;
