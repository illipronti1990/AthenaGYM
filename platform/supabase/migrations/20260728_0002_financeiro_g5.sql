-- ATHENA PLATFORM Sprint G-5 — Financeiro Inteligente (onda 1A)

-- ---------------------------------------------------------------------------
-- receivables enrich
-- ---------------------------------------------------------------------------
alter table public.receivables
  add column if not exists enrollment_id uuid references public.enrollments(id),
  add column if not exists plan_id uuid references public.plans(id),
  add column if not exists trainer_id uuid,
  add column if not exists addition numeric(12,2) not null default 0,
  add column if not exists amount_paid numeric(12,2) not null default 0,
  add column if not exists cashier_user_id uuid,
  add column if not exists notes text,
  add column if not exists cash_session_id uuid;

create index if not exists idx_receivables_enrollment
  on public.receivables(enrollment_id) where deleted_at is null;
create index if not exists idx_receivables_plan
  on public.receivables(plan_id) where deleted_at is null;
create index if not exists idx_receivables_trainer
  on public.receivables(trainer_id) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- payables enrich
-- ---------------------------------------------------------------------------
alter table public.payables
  add column if not exists category varchar(40) not null default 'outros',
  add column if not exists competence_month date,
  add column if not exists installment_label varchar(20),
  add column if not exists notes text,
  add column if not exists attachment_url text;

create index if not exists idx_payables_category
  on public.payables(company_id, category) where deleted_at is null;

-- ---------------------------------------------------------------------------
-- payment_transactions card/nsu details
-- ---------------------------------------------------------------------------
alter table public.payment_transactions
  add column if not exists payment_method_id uuid references public.payment_methods(id),
  add column if not exists nsu varchar(80),
  add column if not exists authorization_code varchar(80),
  add column if not exists card_brand varchar(40),
  add column if not exists installments int not null default 1,
  add column if not exists cash_session_id uuid;

-- ---------------------------------------------------------------------------
-- cash sessions (caixa diário)
-- ---------------------------------------------------------------------------
create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  operator_user_id uuid not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_amount numeric(12,2) not null default 0,
  expected_amount numeric(12,2) not null default 0,
  counted_amount numeric(12,2),
  difference numeric(12,2),
  status varchar(20) not null default 'open',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_cash_sessions_one_open
  on public.cash_sessions(company_id, unit_id)
  where status = 'open';

create index if not exists idx_cash_sessions_company
  on public.cash_sessions(company_id, opened_at desc);

drop trigger if exists trg_cash_sessions_updated on public.cash_sessions;
create trigger trg_cash_sessions_updated before update on public.cash_sessions
for each row execute function public.set_updated_at();

create table if not exists public.cash_session_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cash_sessions(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  movement_type varchar(30) not null,
  amount numeric(12,2) not null,
  payment_method_id uuid references public.payment_methods(id),
  receivable_id uuid references public.receivables(id),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_cash_session_movements_session
  on public.cash_session_movements(session_id, created_at);

-- FK soft link from receivables after cash_sessions exists
do $$ begin
  alter table public.receivables
    drop constraint if exists receivables_cash_session_id_fkey;
  alter table public.receivables
    add constraint receivables_cash_session_id_fkey
    foreign key (cash_session_id) references public.cash_sessions(id);
exception when others then null;
end $$;

do $$ begin
  alter table public.payment_transactions
    drop constraint if exists payment_transactions_cash_session_id_fkey;
  alter table public.payment_transactions
    add constraint payment_transactions_cash_session_id_fkey
    foreign key (cash_session_id) references public.cash_sessions(id);
exception when others then null;
end $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.cash_sessions enable row level security;
alter table public.cash_session_movements enable row level security;

drop policy if exists cash_sessions_all on public.cash_sessions;
create policy cash_sessions_all on public.cash_sessions
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists cash_session_movements_all on public.cash_session_movements;
create policy cash_session_movements_all on public.cash_session_movements
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

-- ---------------------------------------------------------------------------
-- Payment methods seeds (G5.5)
-- ---------------------------------------------------------------------------
insert into public.payment_methods (id, company_id, name, slug, is_system) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', null, 'PIX', 'pix', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', null, 'Cartão Crédito', 'credit', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', null, 'Dinheiro', 'cash', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', null, 'Transferência', 'transfer', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', null, 'Boleto', 'boleto', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06', null, 'Cartão Débito', 'debit', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', null, 'Voucher', 'voucher', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee08', null, 'Crédito interno', 'internal_credit', true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, deleted_at = null;

-- keep legacy 'card' slug alias if present
insert into public.payment_methods (id, company_id, name, slug, is_system) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee09', null, 'Cartão (legado)', 'card', true)
on conflict (id) do update set name = excluded.name, deleted_at = null;

-- ---------------------------------------------------------------------------
-- Cost centers seeds (G5.11)
-- ---------------------------------------------------------------------------
insert into public.cost_centers (id, company_id, name, description, active) values
  ('ffffffff-ffff-ffff-ffff-ffffffffff01', '11111111-1111-1111-1111-111111111111', 'Recepção', 'Atendimento', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff07', '11111111-1111-1111-1111-111111111111', 'Musculação', 'Sala de musculação', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff08', '11111111-1111-1111-1111-111111111111', 'Cross', 'Cross training', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff09', '11111111-1111-1111-1111-111111111111', 'Pilates', 'Studio pilates', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff06', '11111111-1111-1111-1111-111111111111', 'Personal', 'Personal trainers', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff03', '11111111-1111-1111-1111-111111111111', 'Marketing', 'Aquisição', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff04', '11111111-1111-1111-1111-111111111111', 'Administrativo', 'Backoffice', true)
on conflict (id) do update set name = excluded.name, description = excluded.description, deleted_at = null;
