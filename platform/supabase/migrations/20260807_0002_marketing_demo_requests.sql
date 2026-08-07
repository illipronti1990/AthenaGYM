-- M-2 marketing demo requests (commercial leads ≠ tenant CRM leads)

create table if not exists public.marketing_demo_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  academy_name text not null,
  city text not null,
  email text not null,
  phone text not null,
  student_count integer not null check (student_count > 0),
  message text,
  consent_lgpd boolean not null default false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  user_agent text,
  ip_hash text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_demo_requests_created_idx
  on public.marketing_demo_requests (created_at desc);

create index if not exists marketing_demo_requests_email_idx
  on public.marketing_demo_requests (lower(email));

create index if not exists marketing_demo_requests_status_idx
  on public.marketing_demo_requests (status);

alter table public.marketing_demo_requests enable row level security;

-- No public policies: only service role (API) writes/reads.
