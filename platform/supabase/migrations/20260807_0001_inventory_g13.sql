-- ATHENA PLATFORM Sprint G-13 — Estoque, Loja e PDV (MVP+)

-- ---------------------------------------------------------------------------
-- Extend suppliers
-- ---------------------------------------------------------------------------
alter table public.suppliers add column if not exists contact_name varchar(120);
alter table public.suppliers add column if not exists address text;
alter table public.suppliers add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- product_categories
-- ---------------------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  slug varchar(40) not null,
  name varchar(80) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create index if not exists idx_product_categories_company
  on public.product_categories(company_id) where deleted_at is null;

drop trigger if exists trg_product_categories_updated on public.product_categories;
create trigger trg_product_categories_updated before update on public.product_categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  category_id uuid references public.product_categories(id),
  supplier_id uuid references public.suppliers(id),
  name varchar(200) not null,
  sku varchar(80) not null,
  barcode varchar(80),
  brand varchar(120),
  uom varchar(20) not null default 'un',
  cost_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  min_stock numeric(12,3) not null default 0,
  qty_on_hand numeric(12,3) not null default 0,
  photo_url text,
  description text,
  expiry_date date,
  tracks_stock boolean not null default true,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, sku)
);

create index if not exists idx_products_company on public.products(company_id) where deleted_at is null;
create index if not exists idx_products_barcode on public.products(company_id, barcode) where deleted_at is null and barcode is not null;
create index if not exists idx_products_low_stock on public.products(company_id) where deleted_at is null and active = true;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stock_movements
-- ---------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  product_id uuid not null references public.products(id),
  type varchar(30) not null,
  qty numeric(12,3) not null,
  unit_cost numeric(12,2) not null default 0,
  reason text,
  actor_id uuid references public.profiles(id),
  ref_type varchar(40),
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_company
  on public.stock_movements(company_id, created_at desc);
create index if not exists idx_stock_movements_product
  on public.stock_movements(product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- pos_sales / pos_sale_items
-- ---------------------------------------------------------------------------
create table if not exists public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  student_id uuid references public.students(id),
  cashier_id uuid references public.profiles(id),
  status varchar(30) not null default 'completed',
  payment_method varchar(30) not null,
  discount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  cost_total numeric(12,2) not null default 0,
  receivable_id uuid references public.receivables(id),
  notes text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pos_sales_company on public.pos_sales(company_id, created_at desc);

drop trigger if exists trg_pos_sales_updated on public.pos_sales;
create trigger trg_pos_sales_updated before update on public.pos_sales
for each row execute function public.set_updated_at();

create table if not exists public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name varchar(200) not null,
  qty numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2) not null default 0,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pos_sale_items_sale on public.pos_sale_items(sale_id);

-- ---------------------------------------------------------------------------
-- purchase_orders
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  supplier_id uuid not null references public.suppliers(id),
  status varchar(30) not null default 'draft',
  expected_at date,
  notes text,
  total numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_purchase_orders_company
  on public.purchase_orders(company_id, created_at desc) where deleted_at is null;

drop trigger if exists trg_purchase_orders_updated on public.purchase_orders;
create trigger trg_purchase_orders_updated before update on public.purchase_orders
for each row execute function public.set_updated_at();

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty_ordered numeric(12,3) not null,
  qty_received numeric(12,3) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  purchase_order_id uuid not null references public.purchase_orders(id),
  payable_id uuid references public.payables(id),
  received_by uuid references public.profiles(id),
  notes text,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.purchase_receipts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  qty numeric(12,3) not null,
  unit_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- inventory_counts
-- ---------------------------------------------------------------------------
create table if not exists public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  status varchar(30) not null default 'open',
  notes text,
  created_by uuid references public.profiles(id),
  closed_by uuid references public.profiles(id),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_inventory_counts_updated on public.inventory_counts;
create trigger trg_inventory_counts_updated before update on public.inventory_counts
for each row execute function public.set_updated_at();

create table if not exists public.inventory_count_lines (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.inventory_counts(id) on delete cascade,
  product_id uuid not null references public.products(id),
  system_qty numeric(12,3) not null default 0,
  counted_qty numeric(12,3),
  difference numeric(12,3),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.purchase_receipts enable row level security;
alter table public.purchase_receipt_items enable row level security;
alter table public.inventory_counts enable row level security;
alter table public.inventory_count_lines enable row level security;

drop policy if exists product_categories_all on public.product_categories;
create policy product_categories_all on public.product_categories
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists products_all on public.products;
create policy products_all on public.products
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists stock_movements_all on public.stock_movements;
create policy stock_movements_all on public.stock_movements
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists pos_sales_all on public.pos_sales;
create policy pos_sales_all on public.pos_sales
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists pos_sale_items_all on public.pos_sale_items;
create policy pos_sale_items_all on public.pos_sale_items
  for all using (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id
        and (public.is_super_admin() or s.company_id in (select public.user_company_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.pos_sales s
      where s.id = sale_id
        and (public.is_super_admin() or s.company_id in (select public.user_company_ids()))
    )
  );

drop policy if exists purchase_orders_all on public.purchase_orders;
create policy purchase_orders_all on public.purchase_orders
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists purchase_order_items_all on public.purchase_order_items;
create policy purchase_order_items_all on public.purchase_order_items
  for all using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and (public.is_super_admin() or po.company_id in (select public.user_company_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and (public.is_super_admin() or po.company_id in (select public.user_company_ids()))
    )
  );

drop policy if exists purchase_receipts_all on public.purchase_receipts;
create policy purchase_receipts_all on public.purchase_receipts
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists purchase_receipt_items_all on public.purchase_receipt_items;
create policy purchase_receipt_items_all on public.purchase_receipt_items
  for all using (
    exists (
      select 1 from public.purchase_receipts r
      where r.id = receipt_id
        and (public.is_super_admin() or r.company_id in (select public.user_company_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.purchase_receipts r
      where r.id = receipt_id
        and (public.is_super_admin() or r.company_id in (select public.user_company_ids()))
    )
  );

drop policy if exists inventory_counts_all on public.inventory_counts;
create policy inventory_counts_all on public.inventory_counts
  for all using (public.is_super_admin() or company_id in (select public.user_company_ids()))
  with check (public.is_super_admin() or company_id in (select public.user_company_ids()));

drop policy if exists inventory_count_lines_all on public.inventory_count_lines;
create policy inventory_count_lines_all on public.inventory_count_lines
  for all using (
    exists (
      select 1 from public.inventory_counts c
      where c.id = count_id
        and (public.is_super_admin() or c.company_id in (select public.user_company_ids()))
    )
  )
  with check (
    exists (
      select 1 from public.inventory_counts c
      where c.id = count_id
        and (public.is_super_admin() or c.company_id in (select public.user_company_ids()))
    )
  );

-- ---------------------------------------------------------------------------
-- Seeds: categories for demo company
-- ---------------------------------------------------------------------------
insert into public.product_categories (company_id, slug, name)
select '11111111-1111-1111-1111-111111111111', v.slug, v.name
from (values
  ('suplementos', 'Suplementos'),
  ('bebidas', 'Bebidas'),
  ('roupas', 'Roupas'),
  ('acessorios', 'Acessórios'),
  ('alimentacao', 'Alimentação'),
  ('equipamentos', 'Equipamentos'),
  ('higiene', 'Higiene'),
  ('servicos', 'Serviços'),
  ('outros', 'Outros')
) as v(slug, name)
on conflict (company_id, slug) do update set name = excluded.name, deleted_at = null;

-- ---------------------------------------------------------------------------
-- Permissions + role grants
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('inventory', 'read', 'inventory.read', 'Ler estoque e produtos'),
  ('inventory', 'manage', 'inventory.manage', 'Gerenciar produtos e estoque'),
  ('inventory', 'adjust', 'inventory.adjust', 'Ajustar inventário e perdas'),
  ('pdv', 'sell', 'pdv.sell', 'Vender no PDV'),
  ('pdv', 'cancel', 'pdv.cancel', 'Cancelar venda PDV'),
  ('purchases', 'read', 'purchases.read', 'Ler compras e fornecedores'),
  ('purchases', 'manage', 'purchases.manage', 'Gerenciar compras e recebimentos')
on conflict (code) do update set description = excluded.description, deleted_at = null;

-- stockkeeper role (optional)
insert into public.roles (id, company_id, name, slug, description, is_system)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9',
  null,
  'Estoquista',
  'stockkeeper',
  'Controle de estoque e compras',
  true
)
on conflict (id) do nothing;

-- super_admin + admin: all inventory perms
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin', 'admin')
  and p.code in (
    'inventory.read','inventory.manage','inventory.adjust',
    'pdv.sell','pdv.cancel','purchases.read','purchases.manage'
  )
on conflict do nothing;

-- manager
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'inventory.read','inventory.manage','inventory.adjust',
  'pdv.sell','pdv.cancel','purchases.read','purchases.manage'
)
on conflict do nothing;

-- reception: PDV + read
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id from public.permissions p
where p.code in ('inventory.read', 'pdv.sell', 'pdv.cancel')
on conflict do nothing;

-- finance: read + purchases
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', p.id from public.permissions p
where p.code in ('inventory.read', 'purchases.read', 'purchases.manage', 'pdv.sell')
on conflict do nothing;

-- stockkeeper
insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', p.id from public.permissions p
where p.code in (
  'inventory.read','inventory.manage','inventory.adjust',
  'purchases.read','purchases.manage'
)
on conflict do nothing;

-- Demo products
insert into public.products (
  id, company_id, unit_id, category_id, name, sku, barcode, brand, uom,
  cost_price, sale_price, min_stock, qty_on_hand, tracks_stock, active, description
)
select
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  c.id,
  'Whey Protein 900g',
  'SUP-WHEY-900',
  '7891000100011',
  'Athena Nutri',
  'un',
  65.00,
  119.90,
  5,
  12,
  true,
  true,
  'Proteína concentrada'
from public.product_categories c
where c.company_id = '11111111-1111-1111-1111-111111111111' and c.slug = 'suplementos'
on conflict (company_id, sku) do nothing;

insert into public.products (
  id, company_id, unit_id, category_id, name, sku, barcode, brand, uom,
  cost_price, sale_price, min_stock, qty_on_hand, tracks_stock, active, description
)
select
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  c.id,
  'Creatina 300g',
  'SUP-CREA-300',
  '7891000100028',
  'Athena Nutri',
  'un',
  28.00,
  59.90,
  8,
  3,
  true,
  true,
  'Creatina monohidratada'
from public.product_categories c
where c.company_id = '11111111-1111-1111-1111-111111111111' and c.slug = 'suplementos'
on conflict (company_id, sku) do nothing;

insert into public.products (
  id, company_id, unit_id, category_id, name, sku, barcode, brand, uom,
  cost_price, sale_price, min_stock, qty_on_hand, tracks_stock, active, description
)
select
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  c.id,
  'Água 500ml',
  'BEB-AGUA-500',
  '7891000100035',
  'Crystal',
  'un',
  0.80,
  3.50,
  20,
  48,
  true,
  true,
  'Água mineral'
from public.product_categories c
where c.company_id = '11111111-1111-1111-1111-111111111111' and c.slug = 'bebidas'
on conflict (company_id, sku) do nothing;
