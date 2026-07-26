-- ATHENA PLATFORM Sprint 10 — Produção e Operação (Brasil)
-- gym_settings, storage buckets, permissions settings/backup

-- ---------------------------------------------------------------------------
-- gym_settings (1:1 company)
-- ---------------------------------------------------------------------------
create table if not exists public.gym_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) unique,
  name varchar(150) not null,
  cnpj varchar(18),
  logo_url text,
  phone varchar(40),
  whatsapp varchar(40),
  email varchar(160),
  instagram varchar(120),
  zip_code varchar(12),
  street varchar(160),
  number varchar(20),
  district varchar(80),
  city varchar(80),
  state varchar(2),
  primary_color varchar(20) not null default '#A3001B',
  secondary_color varchar(20) not null default '#1a1a1a',
  receipt_footer text,
  business_hours jsonb not null default '{}'::jsonb,
  interest_rate numeric(8,4) not null default 0,
  fine_rate numeric(8,4) not null default 0,
  max_discount_pct numeric(8,4) not null default 0,
  grace_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid,
  updated_by uuid
);

create index if not exists idx_gym_settings_company
  on public.gym_settings(company_id) where deleted_at is null;

drop trigger if exists trg_gym_settings_updated on public.gym_settings;
create trigger trg_gym_settings_updated before update on public.gym_settings
for each row execute function public.set_updated_at();

alter table public.gym_settings enable row level security;

drop policy if exists gym_settings_all on public.gym_settings;
create policy gym_settings_all on public.gym_settings
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

-- Seed DEV company settings from companies row
insert into public.gym_settings (company_id, name, cnpj)
select c.id, c.name, c.document
from public.companies c
where c.deleted_at is null
  and not exists (
    select 1 from public.gym_settings g where g.company_id = c.id and g.deleted_at is null
  );

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('receipts', 'receipts', false),
  ('documents', 'documents', false),
  ('contracts', 'contracts', false),
  ('assessments', 'assessments', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('settings', 'read', 'settings.read', 'Ver configurações da academia'),
  ('settings', 'update', 'settings.update', 'Editar configurações da academia'),
  ('backup', 'create', 'backup.create', 'Gerar backup da academia')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- super_admin + admin: all new perms
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id
from public.permissions p
where p.code in ('settings.read', 'settings.update', 'backup.create')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id
from public.permissions p
where p.code in ('settings.read', 'settings.update', 'backup.create')
on conflict do nothing;

-- manager: read settings + dashboard already; update settings; no backup
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id
from public.permissions p
where p.code in ('settings.read', 'settings.update', 'audit.read')
on conflict do nothing;

-- finance: read settings (policies) + update financial fields via settings.update
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id
from public.permissions p
where p.code in ('settings.read', 'settings.update')
on conflict do nothing;

-- reception: dashboard already; settings read only
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id
from public.permissions p
where p.code in ('settings.read')
on conflict do nothing;

-- Rename Recepção → Recepcionista
update public.roles
set name = 'Recepcionista', description = 'Atendimento e matrículas'
where slug = 'reception' and company_id is null;
