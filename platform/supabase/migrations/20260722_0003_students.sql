-- ATHENA PLATFORM Sprint 2 — Students core + backfill from legacy alunos
-- Does NOT drop/rename public.alunos (FastAPI Excel sync stays)

-- ---------------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid not null references public.units(id),
  legacy_aluno_id bigint unique,
  registration_number varchar(40) not null,
  full_name varchar(160) not null,
  social_name varchar(160),
  cpf varchar(14),
  rg varchar(30),
  birth_date date,
  gender varchar(20),
  email varchar(160),
  phone varchar(40),
  whatsapp varchar(40),
  photo_url text,
  status varchar(30) not null default 'pre_registration',
  plan_name varchar(80),
  trainer_name varchar(120),
  notes text,
  last_access_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid,
  unique (company_id, registration_number)
);

create unique index if not exists idx_students_company_cpf
  on public.students(company_id, cpf)
  where cpf is not null and deleted_at is null;

create index if not exists idx_students_company on public.students(company_id) where deleted_at is null;
create index if not exists idx_students_unit on public.students(unit_id) where deleted_at is null;
create index if not exists idx_students_status on public.students(status) where deleted_at is null;
create index if not exists idx_students_name on public.students(full_name) where deleted_at is null;

drop trigger if exists trg_students_updated on public.students;
create trigger trg_students_updated before update on public.students
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- student_addresses
-- ---------------------------------------------------------------------------
create table if not exists public.student_addresses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  zipcode varchar(12),
  street varchar(160),
  number varchar(20),
  district varchar(80),
  city varchar(80),
  state varchar(2),
  country varchar(60) default 'Brasil',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_student_addresses_student on public.student_addresses(student_id) where deleted_at is null;

drop trigger if exists trg_student_addresses_updated on public.student_addresses;
create trigger trg_student_addresses_updated before update on public.student_addresses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- emergency_contacts
-- ---------------------------------------------------------------------------
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name varchar(120) not null,
  relationship varchar(60),
  phone varchar(40),
  whatsapp varchar(40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_emergency_contacts_student on public.emergency_contacts(student_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- student_documents
-- ---------------------------------------------------------------------------
create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  type varchar(60) not null,
  storage_path text not null,
  file_name varchar(200),
  uploaded_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz
);

create index if not exists idx_student_documents_student on public.student_documents(student_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- student_status_history
-- ---------------------------------------------------------------------------
create table if not exists public.student_status_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  old_status varchar(30),
  new_status varchar(30) not null,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_student_status_history_student
  on public.student_status_history(student_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.students enable row level security;
alter table public.student_addresses enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.student_documents enable row level security;
alter table public.student_status_history enable row level security;

drop policy if exists students_select on public.students;
create policy students_select on public.students
  for select using (
    public.is_super_admin()
    or company_id in (select public.user_company_ids())
  );

drop policy if exists students_write on public.students;
create policy students_write on public.students
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists student_addresses_all on public.student_addresses;
create policy student_addresses_all on public.student_addresses
  for all using (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  )
  with check (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  );

drop policy if exists emergency_contacts_all on public.emergency_contacts;
create policy emergency_contacts_all on public.emergency_contacts
  for all using (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  )
  with check (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  );

drop policy if exists student_documents_all on public.student_documents;
create policy student_documents_all on public.student_documents
  for all using (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  )
  with check (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  );

drop policy if exists student_status_history_select on public.student_status_history;
create policy student_status_history_select on public.student_status_history
  for select using (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  );

drop policy if exists student_status_history_insert on public.student_status_history;
create policy student_status_history_insert on public.student_status_history
  for insert with check (
    public.is_super_admin()
    or student_id in (
      select id from public.students
      where company_id in (select public.user_company_ids()) and deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- Storage buckets (idempotent)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('student-photos', 'student-photos', true),
  ('student-documents', 'student-documents', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Backfill from legacy alunos (empresa_id=1 → seed company/unit)
-- ---------------------------------------------------------------------------
insert into public.students (
  company_id,
  unit_id,
  legacy_aluno_id,
  registration_number,
  full_name,
  email,
  phone,
  status,
  plan_name,
  trainer_name,
  created_at,
  updated_at
)
select
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  a.id,
  a.matricula,
  a.nome,
  a.email,
  a.telefone,
  case lower(coalesce(a.status, 'ativo'))
    when 'ativo' then 'active'
    when 'bloqueado' then 'blocked'
    when 'cancelado' then 'cancelled'
    when 'lead' then 'lead'
    when 'inadimplente' then 'delinquent'
    when 'arquivado' then 'archived'
    when 'pré cadastro' then 'pre_registration'
    when 'pre cadastro' then 'pre_registration'
    else 'active'
  end,
  a.plano,
  a.professor,
  coalesce(a.atualizado_em, now()),
  coalesce(a.atualizado_em, now())
from public.alunos a
where a.empresa_id = 1
  and not exists (
    select 1 from public.students s where s.legacy_aluno_id = a.id
  );
