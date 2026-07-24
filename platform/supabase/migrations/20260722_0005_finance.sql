-- ATHENAS PLATFORM Sprint 4 — Finance Enterprise

-- ---------------------------------------------------------------------------
-- financial_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  bank_name varchar(120) not null,
  agency varchar(40),
  account varchar(40),
  pix_key varchar(160),
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_financial_accounts_company
  on public.financial_accounts(company_id) where deleted_at is null;

drop trigger if exists trg_financial_accounts_updated on public.financial_accounts;
create trigger trg_financial_accounts_updated before update on public.financial_accounts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- cost_centers
-- ---------------------------------------------------------------------------
create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, name)
);

drop trigger if exists trg_cost_centers_updated on public.cost_centers;
create trigger trg_cost_centers_updated before update on public.cost_centers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_methods (system catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  name varchar(80) not null,
  slug varchar(40) not null,
  is_system boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create unique index if not exists idx_payment_methods_system_slug
  on public.payment_methods(slug) where company_id is null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(160) not null,
  document varchar(40),
  email varchar(160),
  phone varchar(40),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_suppliers_company on public.suppliers(company_id) where deleted_at is null;

drop trigger if exists trg_suppliers_updated on public.suppliers;
create trigger trg_suppliers_updated before update on public.suppliers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  student_id uuid not null references public.students(id),
  plan_id uuid not null references public.plans(id),
  enrollment_id uuid references public.enrollments(id),
  contract_id uuid references public.contracts(id),
  gateway varchar(40) not null default 'stub',
  recurrence varchar(30) not null default 'monthly',
  next_due_date date,
  amount numeric(12,2) not null default 0,
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_subscriptions_company on public.subscriptions(company_id) where deleted_at is null;
create index if not exists idx_subscriptions_due on public.subscriptions(next_due_date) where deleted_at is null and status = 'active';

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- receivables
-- ---------------------------------------------------------------------------
create table if not exists public.receivables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  student_id uuid references public.students(id),
  contract_id uuid references public.contracts(id),
  subscription_id uuid references public.subscriptions(id),
  cost_center_id uuid references public.cost_centers(id),
  payment_method_id uuid references public.payment_methods(id),
  description varchar(255) not null,
  amount numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  interest numeric(12,2) not null default 0,
  fine numeric(12,2) not null default 0,
  due_date date not null,
  paid_at timestamptz,
  status varchar(30) not null default 'open',
  competence_month date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid
);

create index if not exists idx_receivables_company on public.receivables(company_id) where deleted_at is null;
create index if not exists idx_receivables_status on public.receivables(company_id, status) where deleted_at is null;
create index if not exists idx_receivables_due on public.receivables(due_date) where deleted_at is null;

drop trigger if exists trg_receivables_updated on public.receivables;
create trigger trg_receivables_updated before update on public.receivables
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payables
-- ---------------------------------------------------------------------------
create table if not exists public.payables (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  supplier_id uuid references public.suppliers(id),
  cost_center_id uuid references public.cost_centers(id),
  description varchar(255) not null,
  amount numeric(12,2) not null,
  due_date date not null,
  paid_at timestamptz,
  status varchar(30) not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid
);

create index if not exists idx_payables_company on public.payables(company_id) where deleted_at is null;

drop trigger if exists trg_payables_updated on public.payables;
create trigger trg_payables_updated before update on public.payables
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_transactions
-- ---------------------------------------------------------------------------
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  receivable_id uuid references public.receivables(id),
  subscription_id uuid references public.subscriptions(id),
  gateway varchar(40) not null default 'stub',
  external_id varchar(120),
  idempotency_key varchar(120) not null,
  status varchar(30) not null default 'pending',
  amount numeric(12,2) not null,
  paid_at timestamptz,
  qr_code text,
  copy_paste text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create index if not exists idx_payment_tx_company on public.payment_transactions(company_id);
create index if not exists idx_payment_tx_external on public.payment_transactions(gateway, external_id);

drop trigger if exists trg_payment_transactions_updated on public.payment_transactions;
create trigger trg_payment_transactions_updated before update on public.payment_transactions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  receivable_id uuid references public.receivables(id),
  student_id uuid references public.students(id),
  invoice_number varchar(60) not null,
  amount numeric(12,2) not null,
  status varchar(30) not null default 'draft',
  pdf_url text,
  storage_path text,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description varchar(255) not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null,
  amount numeric(12,2) not null
);

-- ---------------------------------------------------------------------------
-- bank statements / reconciliation
-- ---------------------------------------------------------------------------
create table if not exists public.bank_statements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  financial_account_id uuid references public.financial_accounts(id),
  source_format varchar(20) not null,
  file_name varchar(255),
  imported_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists public.bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.bank_statements(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  posted_at date not null,
  description varchar(255),
  amount numeric(12,2) not null,
  direction varchar(10) not null,
  fitid varchar(120),
  matched_receivable_id uuid references public.receivables(id),
  matched_payable_id uuid references public.payables(id),
  status varchar(30) not null default 'unmatched',
  created_at timestamptz not null default now()
);

create index if not exists idx_bank_lines_company on public.bank_statement_lines(company_id, status);

-- ---------------------------------------------------------------------------
-- cash_movements
-- ---------------------------------------------------------------------------
create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  cost_center_id uuid references public.cost_centers(id),
  movement_date date not null,
  direction varchar(10) not null,
  amount numeric(12,2) not null,
  description varchar(255),
  source_type varchar(40) not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_cash_movements_company_date
  on public.cash_movements(company_id, movement_date);

-- ---------------------------------------------------------------------------
-- outbox_events
-- ---------------------------------------------------------------------------
create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  aggregate_type varchar(80) not null,
  aggregate_id uuid,
  event_type varchar(120) not null,
  payload jsonb not null default '{}'::jsonb,
  status varchar(30) not null default 'pending',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_outbox_pending on public.outbox_events(status, created_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- webhook_receipts
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  provider varchar(40) not null,
  signature varchar(255),
  payload_hash varchar(128) not null,
  external_id varchar(120),
  processed_at timestamptz not null default now(),
  unique (provider, payload_hash)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.financial_accounts enable row level security;
alter table public.cost_centers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.suppliers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.receivables enable row level security;
alter table public.payables enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.bank_statements enable row level security;
alter table public.bank_statement_lines enable row level security;
alter table public.cash_movements enable row level security;
alter table public.outbox_events enable row level security;
alter table public.webhook_receipts enable row level security;

drop policy if exists financial_accounts_all on public.financial_accounts;
create policy financial_accounts_all on public.financial_accounts
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists cost_centers_all on public.cost_centers;
create policy cost_centers_all on public.cost_centers
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists payment_methods_select on public.payment_methods;
create policy payment_methods_select on public.payment_methods
  for select using (
    company_id is null or public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists payment_methods_write on public.payment_methods;
create policy payment_methods_write on public.payment_methods
  for all using (
    public.is_super_admin() or (company_id is not null and company_id in (select public.user_company_ids()))
  )
  with check (
    public.is_super_admin() or (company_id is not null and company_id in (select public.user_company_ids()))
  );

drop policy if exists suppliers_all on public.suppliers;
create policy suppliers_all on public.suppliers
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists subscriptions_all on public.subscriptions;
create policy subscriptions_all on public.subscriptions
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists receivables_all on public.receivables;
create policy receivables_all on public.receivables
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists payables_all on public.payables;
create policy payables_all on public.payables
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists payment_transactions_all on public.payment_transactions;
create policy payment_transactions_all on public.payment_transactions
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists invoices_all on public.invoices;
create policy invoices_all on public.invoices
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists invoice_items_all on public.invoice_items;
create policy invoice_items_all on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (public.is_super_admin() or i.company_id in (select public.user_company_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and (public.is_super_admin() or i.company_id in (select public.user_company_ids()))
    )
  );

drop policy if exists bank_statements_all on public.bank_statements;
create policy bank_statements_all on public.bank_statements
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists bank_statement_lines_all on public.bank_statement_lines;
create policy bank_statement_lines_all on public.bank_statement_lines
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists cash_movements_all on public.cash_movements;
create policy cash_movements_all on public.cash_movements
  for all using (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin() or company_id in (select public.user_company_ids())
  );

drop policy if exists outbox_events_all on public.outbox_events;
create policy outbox_events_all on public.outbox_events
  for all using (
    public.is_super_admin()
    or company_id is null
    or company_id in (select public.user_company_ids())
  )
  with check (
    public.is_super_admin()
    or company_id is null
    or company_id in (select public.user_company_ids())
  );

drop policy if exists webhook_receipts_all on public.webhook_receipts;
create policy webhook_receipts_all on public.webhook_receipts
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('finance', 'update', 'finance.update', 'Editar financeiro'),
  ('finance', 'pay', 'finance.pay', 'Registrar pagamentos'),
  ('finance', 'refund', 'finance.refund', 'Estornar pagamentos'),
  ('finance', 'reconcile', 'finance.reconcile', 'Conciliação bancária'),
  ('finance', 'reports', 'finance.reports', 'Relatórios financeiros')
on conflict (code) do update set description = excluded.description, deleted_at = null;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'finance.%'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'finance.%'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in ('finance.read','finance.create','finance.export','finance.reports')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id from public.permissions p
where p.code like 'finance.%'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Seeds DEV company
-- ---------------------------------------------------------------------------
insert into public.payment_methods (id, company_id, name, slug, is_system) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01', null, 'PIX', 'pix', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02', null, 'Cartão', 'card', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03', null, 'Dinheiro', 'cash', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04', null, 'TED', 'ted', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee05', null, 'Boleto', 'boleto', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee06', null, 'Débito', 'debit', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeee07', null, 'Voucher', 'voucher', true)
on conflict (id) do update set name = excluded.name, deleted_at = null;

insert into public.cost_centers (id, company_id, name, description, active) values
  ('ffffffff-ffff-ffff-ffff-ffffffffff01', '11111111-1111-1111-1111-111111111111', 'Recepção', 'Atendimento', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff02', '11111111-1111-1111-1111-111111111111', 'Academia', 'Operação da sala', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff03', '11111111-1111-1111-1111-111111111111', 'Marketing', 'Aquisição', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff04', '11111111-1111-1111-1111-111111111111', 'Administrativo', 'Backoffice', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff05', '11111111-1111-1111-1111-111111111111', 'Loja', 'Varejo', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffff06', '11111111-1111-1111-1111-111111111111', 'Personal', 'Personal trainers', true)
on conflict (id) do update set name = excluded.name, deleted_at = null;

insert into public.financial_accounts (id, company_id, unit_id, bank_name, agency, account, pix_key, status) values
  ('12121212-1212-1212-1212-121212121201', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
   'Banco Stub', '0001', '12345-6', 'athenas@pix.stub', 'active')
on conflict (id) do update set bank_name = excluded.bank_name, deleted_at = null;
