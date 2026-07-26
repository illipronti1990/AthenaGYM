-- PX-5 Smart Forms: templates, drafts, uploads, signatures

create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  kind text not null check (kind in ('workout', 'assessment', 'contract', 'charge', 'enrollment', 'other')),
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists form_templates_company_kind_idx
  on public.form_templates (company_id, kind);

create table if not exists public.form_drafts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  user_id uuid not null,
  form_key text not null,
  entity_id uuid null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (company_id, user_id, form_key, entity_id)
);

create index if not exists form_drafts_lookup_idx
  on public.form_drafts (company_id, user_id, form_key);

create table if not exists public.form_uploads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  storage_path text not null,
  public_url text null,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists form_uploads_company_idx
  on public.form_uploads (company_id, created_at desc);

create table if not exists public.form_signatures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  entity_type text not null,
  entity_id uuid null,
  storage_path text not null,
  public_url text null,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists form_signatures_entity_idx
  on public.form_signatures (company_id, entity_type, entity_id);

alter table public.form_templates enable row level security;
alter table public.form_drafts enable row level security;
alter table public.form_uploads enable row level security;
alter table public.form_signatures enable row level security;
