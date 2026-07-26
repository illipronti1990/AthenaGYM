-- ATHENA PLATFORM Sprint 3 — Sales / CRM / Enrollments / Contracts

-- ---------------------------------------------------------------------------
-- lead_sources
-- ---------------------------------------------------------------------------
create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  name varchar(80) not null,
  slug varchar(80) not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create unique index if not exists idx_lead_sources_system_slug
  on public.lead_sources(slug) where company_id is null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- pipeline_stages
-- ---------------------------------------------------------------------------
create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(80) not null,
  slug varchar(80) not null,
  position int not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create index if not exists idx_pipeline_stages_company
  on public.pipeline_stages(company_id, position) where deleted_at is null;

drop trigger if exists trg_pipeline_stages_updated on public.pipeline_stages;
create trigger trg_pipeline_stages_updated before update on public.pipeline_stages
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  full_name varchar(160) not null,
  phone varchar(40),
  whatsapp varchar(40),
  email varchar(160),
  source_id uuid references public.lead_sources(id),
  stage_id uuid references public.pipeline_stages(id),
  status varchar(30) not null default 'open',
  assigned_to uuid references public.profiles(id),
  interest varchar(120),
  notes text,
  student_id uuid references public.students(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create index if not exists idx_leads_company on public.leads(company_id) where deleted_at is null;
create index if not exists idx_leads_stage on public.leads(stage_id) where deleted_at is null;
create index if not exists idx_leads_assigned on public.leads(assigned_to) where deleted_at is null;

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- lead_activities
-- ---------------------------------------------------------------------------
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type varchar(40) not null,
  description text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id, created_at desc);

-- ---------------------------------------------------------------------------
-- plans
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  category varchar(60),
  duration_days int not null default 30,
  price numeric(12,2) not null default 0,
  enrollment_fee numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_plans_company on public.plans(company_id) where deleted_at is null;

drop trigger if exists trg_plans_updated on public.plans;
create trigger trg_plans_updated before update on public.plans
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id),
  plan_id uuid not null references public.plans(id),
  lead_id uuid references public.leads(id),
  contract_id uuid,
  salesperson_id uuid references public.profiles(id),
  start_date date not null default current_date,
  end_date date,
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_enrollments_company on public.enrollments(company_id) where deleted_at is null;
create index if not exists idx_enrollments_student on public.enrollments(student_id) where deleted_at is null;

drop trigger if exists trg_enrollments_updated on public.enrollments;
create trigger trg_enrollments_updated before update on public.enrollments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contracts
-- ---------------------------------------------------------------------------
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid references public.students(id),
  plan_id uuid not null references public.plans(id),
  enrollment_id uuid references public.enrollments(id),
  lead_id uuid references public.leads(id),
  contract_number varchar(40) not null,
  signed_at timestamptz,
  pdf_url text,
  storage_path text,
  status varchar(30) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  unique (company_id, contract_number)
);

create index if not exists idx_contracts_company on public.contracts(company_id) where deleted_at is null;

drop trigger if exists trg_contracts_updated on public.contracts;
create trigger trg_contracts_updated before update on public.contracts
for each row execute function public.set_updated_at();

-- FK enrollment.contract_id after contracts exists
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'enrollments_contract_id_fkey'
  ) then
    alter table public.enrollments
      add constraint enrollments_contract_id_fkey
      foreign key (contract_id) references public.contracts(id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.lead_sources enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.plans enable row level security;
alter table public.enrollments enable row level security;
alter table public.contracts enable row level security;

drop policy if exists lead_sources_select on public.lead_sources;
create policy lead_sources_select on public.lead_sources
  for select using (
    public.is_super_admin() or company_id is null
    or company_id in (select public.user_company_ids())
  );

drop policy if exists pipeline_stages_all on public.pipeline_stages;
create policy pipeline_stages_all on public.pipeline_stages
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists leads_all on public.leads;
create policy leads_all on public.leads
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists lead_activities_all on public.lead_activities;
create policy lead_activities_all on public.lead_activities
  for all using (
    public.is_super_admin()
    or lead_id in (
      select id from public.leads where company_id in (select public.user_company_ids())
    )
  )
  with check (
    public.is_super_admin()
    or lead_id in (
      select id from public.leads where company_id in (select public.user_company_ids())
    )
  );

drop policy if exists plans_all on public.plans;
create policy plans_all on public.plans
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists enrollments_all on public.enrollments;
create policy enrollments_all on public.enrollments
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists contracts_all on public.contracts;
create policy contracts_all on public.contracts
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

-- ---------------------------------------------------------------------------
-- Storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Seed permissions sales.*
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('sales', 'read', 'sales.read', 'Ver comercial'),
  ('sales', 'create', 'sales.create', 'Criar leads/matrículas'),
  ('sales', 'update', 'sales.update', 'Editar comercial'),
  ('sales', 'delete', 'sales.delete', 'Excluir leads'),
  ('sales', 'pipeline', 'sales.pipeline', 'Gerenciar pipeline'),
  ('sales', 'contracts', 'sales.contracts', 'Contratos'),
  ('sales', 'plans', 'sales.plans', 'Planos')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- bind to super_admin + admin
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'sales.%'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'sales.%'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in ('sales.read','sales.create','sales.update','sales.pipeline','sales.plans')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id from public.permissions p
where p.code in ('sales.read','sales.create','sales.update')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Seed lead sources (system)
-- ---------------------------------------------------------------------------
insert into public.lead_sources (id, company_id, name, slug, is_system) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', null, 'Instagram', 'instagram', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', null, 'Facebook', 'facebook', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', null, 'Google', 'google', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', null, 'Indicação', 'referral', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', null, 'Site', 'website', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb06', null, 'WhatsApp', 'whatsapp', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07', null, 'Telefone', 'phone', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb08', null, 'Evento', 'event', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb09', null, 'Panfleto', 'flyer', true)
on conflict (id) do update set name = excluded.name, deleted_at = null;

-- ---------------------------------------------------------------------------
-- Seed pipeline + plans for DEV company
-- ---------------------------------------------------------------------------
insert into public.pipeline_stages (id, company_id, name, slug, position, is_won, is_lost) values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', '11111111-1111-1111-1111-111111111111', 'Novo Lead', 'new', 1, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', '11111111-1111-1111-1111-111111111111', 'Contato', 'contact', 2, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', '11111111-1111-1111-1111-111111111111', 'Agendado', 'scheduled', 3, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04', '11111111-1111-1111-1111-111111111111', 'Visitou', 'visited', 4, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc05', '11111111-1111-1111-1111-111111111111', 'Teste', 'trial', 5, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc06', '11111111-1111-1111-1111-111111111111', 'Proposta', 'proposal', 6, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc07', '11111111-1111-1111-1111-111111111111', 'Negociação', 'negotiation', 7, false, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc08', '11111111-1111-1111-1111-111111111111', 'Fechado', 'won', 8, true, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccc09', '11111111-1111-1111-1111-111111111111', 'Perdido', 'lost', 9, false, true)
on conflict (id) do update set name = excluded.name, position = excluded.position, deleted_at = null;

insert into public.plans (id, company_id, name, category, duration_days, price, enrollment_fee, active) values
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '11111111-1111-1111-1111-111111111111', 'Mensal', 'standard', 30, 129.00, 0, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '11111111-1111-1111-1111-111111111111', 'Trimestral', 'standard', 90, 349.00, 0, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', '11111111-1111-1111-1111-111111111111', 'Semestral', 'standard', 180, 649.00, 0, true),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', '11111111-1111-1111-1111-111111111111', 'Anual', 'standard', 365, 1199.00, 0, true)
on conflict (id) do update set name = excluded.name, price = excluded.price, deleted_at = null;
