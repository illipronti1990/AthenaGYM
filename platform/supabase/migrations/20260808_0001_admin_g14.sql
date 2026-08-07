-- ATHENA PLATFORM Sprint G-14 — Administração Empresarial (Backoffice)

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('admin', 'read', 'admin.read', 'Ler backoffice admin'),
  ('admin', 'write', 'admin.write', 'Escrever backoffice admin'),
  ('admin', 'employees', 'admin.employees', 'Gerenciar colaboradores'),
  ('admin', 'assets', 'admin.assets', 'Gerenciar patrimônio'),
  ('admin', 'maintenance', 'admin.maintenance', 'Gerenciar manutenção'),
  ('admin', 'documents', 'admin.documents', 'Gerenciar documentos'),
  ('admin', 'incidents', 'admin.incidents', 'Gerenciar ocorrências'),
  ('admin', 'announcements', 'admin.announcements', 'Gerenciar comunicados'),
  ('admin', 'reports', 'admin.reports', 'Relatórios administrativos')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin', 'admin', 'manager')
  and p.code like 'admin.%'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- cost_centers: category for admin taxonomy
-- ---------------------------------------------------------------------------
alter table public.cost_centers
  add column if not exists category text;

-- ---------------------------------------------------------------------------
-- departments / hr_job_titles / employees
-- ---------------------------------------------------------------------------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, name)
);

create table if not exists public.hr_job_titles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  department_id uuid references public.departments(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, name)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  profile_id uuid references public.profiles(id),
  department_id uuid references public.departments(id),
  job_title_id uuid references public.hr_job_titles(id),
  full_name varchar(200) not null,
  email varchar(200),
  phone varchar(40),
  document_cpf varchar(20),
  photo_url text,
  hired_at date,
  status varchar(30) not null default 'active'
    check (status in ('active', 'inactive', 'vacation', 'leave')),
  emergency_contacts jsonb not null default '[]'::jsonb,
  documents jsonb not null default '[]'::jsonb,
  notes text,
  hour_bank_balance numeric(10,2) not null default 0,
  vacation_start date,
  vacation_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_employees_company on public.employees(company_id) where deleted_at is null;
create index if not exists idx_employees_status on public.employees(company_id, status) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- work_schedules
-- ---------------------------------------------------------------------------
create table if not exists public.work_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  employee_id uuid not null references public.employees(id) on delete cascade,
  schedule_date date not null,
  shift_start time,
  shift_end time,
  kind varchar(30) not null default 'work'
    check (kind in ('work', 'off', 'swap', 'vacation', 'training')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_work_schedules_emp_date
  on public.work_schedules(employee_id, schedule_date);

-- ---------------------------------------------------------------------------
-- assets
-- ---------------------------------------------------------------------------
create table if not exists public.asset_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, name)
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  category_id uuid references public.asset_categories(id),
  code varchar(80) not null,
  name varchar(200) not null,
  location varchar(200),
  purchase_value numeric(12,2) not null default 0,
  purchased_at date,
  warranty_until date,
  useful_life_months int,
  status varchar(30) not null default 'active'
    check (status in ('active', 'maintenance', 'retired', 'lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, code)
);

create index if not exists idx_assets_company on public.assets(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- maintenance
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  asset_id uuid references public.assets(id),
  assignee_employee_id uuid references public.employees(id),
  title varchar(200) not null,
  kind varchar(30) not null default 'corrective'
    check (kind in ('preventive', 'corrective')),
  priority varchar(20) not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status varchar(30) not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  cost numeric(12,2) not null default 0,
  due_at date,
  completed_at timestamptz,
  photo_urls jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.maintenance_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.maintenance_orders(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  from_status varchar(30),
  to_status varchar(30),
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_maint_orders_company on public.maintenance_orders(company_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists public.document_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, name)
);

create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  category_id uuid references public.document_categories(id),
  title varchar(200) not null,
  file_url text,
  expires_at date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_company_docs_expires
  on public.company_documents(company_id, expires_at) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- incidents / announcements
-- ---------------------------------------------------------------------------
create table if not exists public.internal_incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  reporter_employee_id uuid references public.employees(id),
  type varchar(40) not null default 'operational'
    check (type in ('complaint', 'incident', 'accident', 'damaged_equipment', 'operational')),
  title varchar(200) not null,
  description text,
  status varchar(30) not null default 'open'
    check (status in ('open', 'investigating', 'resolved', 'closed')),
  attachment_urls jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.internal_announcements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  title varchar(200) not null,
  body text not null,
  audience varchar(40) not null default 'all'
    check (audience in ('all', 'trainers', 'reception', 'managers')),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.administrative_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'departments','hr_job_titles','employees','work_schedules','asset_categories','assets',
    'maintenance_orders','document_categories','company_documents','internal_incidents',
    'internal_announcements','administrative_settings'
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
-- RLS
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'departments','hr_job_titles','employees','work_schedules','asset_categories','assets',
    'maintenance_orders','maintenance_history','document_categories','company_documents',
    'internal_incidents','internal_announcements','administrative_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I_all on public.%I', t, t);
    execute format(
      'create policy %I_all on public.%I for all using (
         public.is_super_admin() or company_id in (select public.user_company_ids())
       ) with check (
         public.is_super_admin() or company_id in (select public.user_company_ids())
       )',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seeds demo company
-- ---------------------------------------------------------------------------
insert into public.departments (id, company_id, name) values
  ('a1000001-0001-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Operação'),
  ('a1000001-0001-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Administrativo'),
  ('a1000001-0001-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Manutenção')
on conflict (company_id, name) do nothing;

insert into public.hr_job_titles (id, company_id, name, department_id) values
  ('a1000002-0001-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Recepcionista', 'a1000001-0001-4000-8000-000000000001'),
  ('a1000002-0001-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Professor', 'a1000001-0001-4000-8000-000000000001'),
  ('a1000002-0001-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Limpeza', 'a1000001-0001-4000-8000-000000000003'),
  ('a1000002-0001-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'Manutenção', 'a1000001-0001-4000-8000-000000000003')
on conflict (company_id, name) do nothing;

insert into public.asset_categories (id, company_id, name) values
  ('a1000003-0001-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Cardio'),
  ('a1000003-0001-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'TI'),
  ('a1000003-0001-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Acesso')
on conflict (company_id, name) do nothing;

insert into public.document_categories (id, company_id, name) values
  ('a1000004-0001-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'Contratos'),
  ('a1000004-0001-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'Licenças'),
  ('a1000004-0001-4000-8000-000000000003', '11111111-1111-1111-1111-111111111111', 'Alvarás'),
  ('a1000004-0001-4000-8000-000000000004', '11111111-1111-1111-1111-111111111111', 'Certificados')
on conflict (company_id, name) do nothing;

insert into public.administrative_settings (company_id, settings) values
  ('11111111-1111-1111-1111-111111111111', '{"priorities":["low","medium","high","urgent"],"maintenanceTypes":["preventive","corrective"]}'::jsonb)
on conflict (company_id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('admin-documents', 'admin-documents', false)
on conflict (id) do nothing;
