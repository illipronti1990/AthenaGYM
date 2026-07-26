-- PX-6 DataGrid: saved filters + table preferences

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  user_id uuid not null,
  table_name text not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  search text null,
  sort jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists saved_filters_user_table_idx
  on public.saved_filters (company_id, user_id, table_name);

create table if not exists public.table_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id),
  user_id uuid not null,
  table_name text not null,
  columns jsonb not null default '[]'::jsonb,
  column_order jsonb not null default '[]'::jsonb,
  column_widths jsonb not null default '{}'::jsonb,
  page_size int not null default 20,
  sort jsonb null,
  updated_at timestamptz not null default now(),
  unique (company_id, user_id, table_name)
);

create index if not exists table_preferences_user_table_idx
  on public.table_preferences (company_id, user_id, table_name);

alter table public.saved_filters enable row level security;
alter table public.table_preferences enable row level security;
