-- ATHENAS GYM — Épico 2 Sprint C/D
-- Transferências, professor×unidade, usuário×unidade
-- python -m scripts.apply_sql_supabase sql/004_epico2_sprint_cd.sql

create table if not exists public.professor_unidade (
  id bigserial primary key,
  professor_id varchar(20) not null,
  professor varchar(120),
  unidade_id integer not null,
  status varchar(20) default 'Ativo'
);
create index if not exists idx_prof_unidade on public.professor_unidade(unidade_id);
create index if not exists idx_prof_unidade_pid on public.professor_unidade(professor_id);

create table if not exists public.transferencias_estoque (
  id bigserial primary key,
  data date not null default current_date,
  codigo varchar(40) not null,
  produto varchar(160),
  qtde numeric(12,2) not null,
  origem_id integer not null,
  destino_id integer not null,
  usuario varchar(80),
  status varchar(20) default 'Concluída',
  obs text,
  empresa_id integer default 1
);
create index if not exists idx_transf_origem on public.transferencias_estoque(origem_id);
create index if not exists idx_transf_destino on public.transferencias_estoque(destino_id);

create table if not exists public.usuario_unidade (
  id bigserial primary key,
  usuario_id integer,
  usuario varchar(80) not null,
  unidade_id integer not null,
  status varchar(20) default 'Ativo'
);
create index if not exists idx_usr_unidade on public.usuario_unidade(usuario, unidade_id);

alter table public.alunos add column if not exists unidade_id integer default 1;
alter table public.contas_receber add column if not exists unidade_id integer default 1;

insert into public.professor_unidade (professor_id, professor, unidade_id, status)
select * from (values
  ('P001', 'Carlos Mendes', 1, 'Ativo'),
  ('P001', 'Carlos Mendes', 2, 'Ativo'),
  ('P002', 'Ana Paula Souza', 1, 'Ativo'),
  ('P003', 'Roberto Lima', 2, 'Ativo')
) as v(professor_id, professor, unidade_id, status)
where not exists (
  select 1 from public.professor_unidade p
  where p.professor_id = v.professor_id and p.unidade_id = v.unidade_id
);

insert into public.usuario_unidade (usuario_id, usuario, unidade_id, status)
select * from (values
  (2, 'admin', 1, 'Ativo'),
  (2, 'admin', 2, 'Ativo'),
  (3, 'recepcao', 1, 'Ativo')
) as v(usuario_id, usuario, unidade_id, status)
where not exists (
  select 1 from public.usuario_unidade u
  where u.usuario = v.usuario and u.unidade_id = v.unidade_id
);
