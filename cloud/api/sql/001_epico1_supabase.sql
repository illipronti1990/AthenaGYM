-- ATHENAS GYM — Épico 1 schema no Supabase (public)
-- Cole em: Dashboard → SQL Editor → New query → Run
-- Projeto: https://supabase.com/dashboard/project/jvwcgjfszpzifyfbwtqf

create table if not exists public.empresas (
  id integer primary key,
  razao_social varchar(200) not null,
  nome_fantasia varchar(150) not null,
  cnpj varchar(18) default '',
  plano varchar(20) default 'Enterprise',
  status varchar(20) default 'Ativo',
  cidade varchar(80),
  estado varchar(2),
  email varchar(120),
  data_cadastro timestamptz default now(),
  data_expiracao timestamptz
);

create table if not exists public.licencas (
  id bigserial primary key,
  empresa_id integer not null references public.empresas(id),
  chave varchar(64) unique not null,
  plano varchar(20) default 'Pro',
  ativacao date default current_date,
  expiracao date,
  status varchar(20) default 'Ativa'
);

create table if not exists public.config_empresa (
  id bigserial primary key,
  empresa_id integer not null references public.empresas(id),
  chave varchar(80) not null,
  valor varchar(255) not null
);

create table if not exists public.usuarios (
  id bigserial primary key,
  empresa_id integer not null default 1,
  nome varchar(120) not null,
  usuario varchar(80) not null,
  senha_hash varchar(255) not null,
  perfil varchar(40) not null,
  status varchar(20) default 'Ativo',
  matricula varchar(40),
  criado_em timestamptz default now(),
  unique (empresa_id, usuario)
);

create table if not exists public.unidades (
  id bigserial primary key,
  empresa_id integer not null default 1,
  nome varchar(120),
  cidade varchar(80) default 'São Paulo',
  status varchar(20) default 'Ativa'
);

create table if not exists public.alunos (
  id bigserial primary key,
  empresa_id integer not null default 1,
  matricula varchar(40) not null,
  nome varchar(160) not null,
  plano varchar(60),
  professor varchar(120),
  status varchar(30) default 'Ativo',
  telefone varchar(40),
  email varchar(120),
  unidade varchar(120) default 'ATHENAS GYM Matriz',
  data_cadastro date,
  atualizado_em timestamptz default now(),
  unique (empresa_id, matricula)
);

create index if not exists idx_usuarios_empresa on public.usuarios(empresa_id);
create index if not exists idx_alunos_empresa on public.alunos(empresa_id);

-- Seed mínimo plataforma + academia demo
insert into public.empresas (id, razao_social, nome_fantasia, cnpj, plano, status, cidade, estado, email)
values
  (0, 'ATHENAS PLATFORM LTDA', 'ATHENAS PLATFORM', '00.000.000/0001-00', 'Enterprise', 'Ativo', 'São Paulo', 'SP', 'platform@athenas.gym'),
  (1, 'ATHENAS GYM ACADEMIA LTDA', 'ATHENAS GYM', '12.345.678/0001-90', 'Enterprise', 'Ativo', 'São Paulo', 'SP', 'contato@athenas.gym')
on conflict (id) do nothing;

-- Após rodar: Dashboard → Settings → API → Reload schema (ou aguarde o cache PostgREST)
-- Depois: GET /supabase/status e GET /supabase/empresas na API
