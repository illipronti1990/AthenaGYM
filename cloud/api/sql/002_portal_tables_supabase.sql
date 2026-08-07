-- ATHENA GYM — tabelas do portal (treino, financeiro, chat, etc.)
-- Cole em: Dashboard → SQL Editor → Run
-- Ou: python -m scripts.apply_sql_supabase sql/002_portal_tables_supabase.sql

create table if not exists public.treinos (
  id bigserial primary key,
  matricula varchar(40) not null,
  nome_aluno varchar(160),
  divisao varchar(20) default 'ABCD',
  status varchar(20) default 'Ativo',
  comentario text,
  criado_em timestamptz default now()
);

create table if not exists public.treino_itens (
  id bigserial primary key,
  treino_id bigint not null references public.treinos(id) on delete cascade,
  dia varchar(10) default 'A',
  exercicio varchar(120) not null,
  series varchar(20) default '3',
  repeticoes varchar(20) default '12',
  ordem integer default 1
);

create table if not exists public.avaliacoes (
  id bigserial primary key,
  matricula varchar(40) not null,
  data date default current_date,
  peso double precision,
  imc double precision,
  gordura double precision,
  massa_magra double precision
);

create table if not exists public.acessos (
  id bigserial primary key,
  matricula varchar(40) not null,
  data date default current_date,
  entrada varchar(10),
  saida varchar(10),
  status varchar(20) default 'Liberado'
);

create table if not exists public.contas_receber (
  id bigserial primary key,
  empresa_id integer not null default 1,
  matricula varchar(40) not null,
  competencia varchar(40),
  valor double precision default 0,
  vencimento date,
  situacao varchar(30) default 'Pendente'
);

create table if not exists public.chat (
  id bigserial primary key,
  de_usuario varchar(80) not null,
  para_usuario varchar(80) not null,
  matricula varchar(40) not null,
  mensagem text not null,
  lida boolean default false,
  criado_em timestamptz default now()
);

create table if not exists public.notificacoes (
  id bigserial primary key,
  usuario varchar(80) not null,
  matricula varchar(40),
  mensagem text not null,
  tipo varchar(40) default 'Geral',
  lida boolean default false,
  criado_em timestamptz default now()
);

create table if not exists public.metas_aluno (
  id bigserial primary key,
  matricula varchar(40) not null,
  objetivo varchar(80) not null,
  meta double precision default 0,
  atual double precision default 0,
  unidade varchar(40)
);

create table if not exists public.sync_log (
  id bigserial primary key,
  origem varchar(40) default 'excel',
  arquivo varchar(255),
  alunos_upsert integer default 0,
  status varchar(20) default 'OK',
  detalhe text,
  criado_em timestamptz default now()
);

create index if not exists idx_treinos_matricula on public.treinos(matricula);
create index if not exists idx_treino_itens_treino on public.treino_itens(treino_id);
create index if not exists idx_avaliacoes_matricula on public.avaliacoes(matricula);
create index if not exists idx_acessos_matricula on public.acessos(matricula);
create index if not exists idx_contas_matricula on public.contas_receber(matricula);
create index if not exists idx_contas_empresa on public.contas_receber(empresa_id);
create index if not exists idx_chat_matricula on public.chat(matricula);
create index if not exists idx_notificacoes_usuario on public.notificacoes(usuario);
create index if not exists idx_metas_matricula on public.metas_aluno(matricula);
