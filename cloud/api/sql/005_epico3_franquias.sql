-- ATHENAS GYM — Épico 3 Franquias (Sprint A+B)
-- python -m scripts.apply_sql_supabase sql/005_epico3_franquias.sql

alter table public.empresas add column if not exists franqueadora_id integer default 0;
alter table public.empresas add column if not exists franqueado_id integer default 0;

create table if not exists public.franqueadoras (
  id integer primary key,
  nome varchar(150) not null,
  cnpj varchar(18) default '',
  razao_social varchar(200) default '',
  ceo varchar(120),
  email varchar(120),
  telefone varchar(20),
  site varchar(150),
  status varchar(20) default 'Ativa'
);

create table if not exists public.franqueados (
  id integer primary key,
  franqueadora_id integer not null,
  empresa_id integer not null,
  nome varchar(150) not null,
  cpf_cnpj varchar(18) default '',
  cidade varchar(80),
  estado varchar(2),
  contrato varchar(40),
  data_inicio date,
  data_fim date,
  status varchar(20) default 'Ativo'
);
create index if not exists idx_franqueados_rede on public.franqueados(franqueadora_id);
create index if not exists idx_franqueados_emp on public.franqueados(empresa_id);

create table if not exists public.contratos_franquia (
  id bigserial primary key,
  numero varchar(40) not null,
  franqueado_id integer not null,
  franqueado varchar(150),
  vigencia_inicio date,
  vigencia_fim date,
  taxa_inicial numeric(14,2) default 0,
  royalty_pct numeric(8,2) default 6,
  fundo_marketing_pct numeric(8,2) default 2,
  status varchar(20) default 'Ativo'
);

create table if not exists public.royalties (
  id bigserial primary key,
  franqueado_id integer not null,
  franqueado varchar(150),
  competencia date not null,
  receita_base numeric(14,2) default 0,
  percentual numeric(8,2) default 6,
  valor_royalty numeric(14,2) default 0,
  percentual_marketing numeric(8,2) default 2,
  valor_marketing numeric(14,2) default 0,
  status varchar(20) default 'Em Aberto'
);
create index if not exists idx_royalties_comp on public.royalties(competencia);
create index if not exists idx_royalties_fdo on public.royalties(franqueado_id);

insert into public.franqueadoras (id, nome, cnpj, razao_social, ceo, email, telefone, site, status)
values (1, 'ATHENAS FRANCHISE', '00.111.222/0001-33', 'ATHENAS FRANCHISE HOLDING LTDA',
        'Renan Athenas', 'franchise@athenas.gym', '(11) 3000-0100', 'https://franchise.athenas.gym', 'Ativa')
on conflict (id) do update set nome = excluded.nome, status = excluded.status;

insert into public.empresas (id, razao_social, nome_fantasia, cnpj, plano, status, cidade, estado, email, franqueadora_id, franqueado_id)
values
  (2, 'ATHENAS GYM CAMPINAS LTDA', 'ATHENAS Campinas', '23.456.789/0001-01', 'Enterprise', 'Ativo', 'Campinas', 'SP', 'campinas@athenas.gym', 1, 2),
  (3, 'ATHENAS GYM SANTOS LTDA', 'ATHENAS Santos', '34.567.890/0001-12', 'Enterprise', 'Ativo', 'Santos', 'SP', 'santos@athenas.gym', 1, 3)
on conflict (id) do update set
  franqueadora_id = excluded.franqueadora_id,
  franqueado_id = excluded.franqueado_id,
  nome_fantasia = excluded.nome_fantasia;

update public.empresas set franqueadora_id = 1, franqueado_id = 1 where id = 1;

insert into public.franqueados (id, franqueadora_id, empresa_id, nome, cpf_cnpj, cidade, estado, contrato, data_inicio, data_fim, status)
values
  (1, 1, 1, 'Franquia São Paulo', '12.345.678/0001-90', 'São Paulo', 'SP', 'CTR-SP-001', current_date - 400, current_date + 965, 'Ativo'),
  (2, 1, 2, 'Franquia Campinas', '23.456.789/0001-01', 'Campinas', 'SP', 'CTR-CP-002', current_date - 200, current_date + 1165, 'Ativo'),
  (3, 1, 3, 'Franquia Santos', '34.567.890/0001-12', 'Santos', 'SP', 'CTR-ST-003', current_date - 120, current_date + 1245, 'Ativo')
on conflict (id) do update set status = excluded.status, nome = excluded.nome;

insert into public.contratos_franquia (numero, franqueado_id, franqueado, vigencia_inicio, vigencia_fim, taxa_inicial, royalty_pct, fundo_marketing_pct, status)
select * from (values
  ('CTR-SP-001', 1, 'Franquia São Paulo', current_date - 400, current_date + 965, 50000.0, 6.0, 2.0, 'Ativo'),
  ('CTR-CP-002', 2, 'Franquia Campinas', current_date - 200, current_date + 1165, 45000.0, 6.0, 2.0, 'Ativo'),
  ('CTR-ST-003', 3, 'Franquia Santos', current_date - 120, current_date + 1245, 40000.0, 6.0, 2.0, 'Ativo')
) as v(numero, franqueado_id, franqueado, vigencia_inicio, vigencia_fim, taxa_inicial, royalty_pct, fundo_marketing_pct, status)
where not exists (select 1 from public.contratos_franquia c where c.numero = v.numero);
