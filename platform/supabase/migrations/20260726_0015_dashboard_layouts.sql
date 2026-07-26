-- ATHENA PLATFORM PX-3 — Executive Dashboard layouts (per user)

create table if not exists public.dashboard_layouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  user_id uuid not null references auth.users(id),
  layout_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists idx_dashboard_layouts_user
  on public.dashboard_layouts(user_id);

drop trigger if exists trg_dashboard_layouts_updated on public.dashboard_layouts;
create trigger trg_dashboard_layouts_updated before update on public.dashboard_layouts
  for each row execute function public.set_updated_at();

alter table public.dashboard_layouts enable row level security;

drop policy if exists dashboard_layouts_own on public.dashboard_layouts;
create policy dashboard_layouts_own on public.dashboard_layouts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
