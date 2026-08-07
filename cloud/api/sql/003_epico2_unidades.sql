-- ATHENA GYM — Épico 2 Multiunidade
-- Cole no SQL Editor do Supabase ou: python -m scripts.apply_sql_supabase sql/003_epico2_unidades.sql

-- Expandir unidades
alter table public.unidades add column if not exists codigo varchar(20) default 'MX';
alter table public.unidades add column if not exists cnpj varchar(18) default '';
alter table public.unidades add column if not exists telefone varchar(20);
alter table public.unidades add column if not exists whatsapp varchar(20);
alter table public.unidades add column if not exists email varchar(120);
alter table public.unidades add column if not exists cep varchar(10);
alter table public.unidades add column if not exists endereco varchar(250);
alter table public.unidades add column if not exists estado varchar(2) default 'SP';
alter table public.unidades add column if not exists responsavel varchar(120);
alter table public.unidades add column if not exists data_cadastro timestamptz default now();

-- Renomear nome se ainda for só "nome" (já existe); garantir not null soft
update public.unidades set codigo = 'MX' where id = 1 and (codigo is null or codigo = '');
update public.unidades set codigo = 'ZS' where id = 2 and (codigo is null or codigo = '');
update public.unidades set status = 'Ativa' where id = 2;

insert into public.unidades (id, empresa_id, nome, codigo, cidade, estado, status)
values
  (1, 1, 'ATHENA GYM Matriz', 'MX', 'São Paulo', 'SP', 'Ativa'),
  (2, 1, 'ATHENA GYM Zona Sul', 'ZS', 'São Paulo', 'SP', 'Ativa')
on conflict (id) do update set
  nome = excluded.nome,
  codigo = excluded.codigo,
  cidade = excluded.cidade,
  status = excluded.status;

-- Parametros por unidade
create table if not exists public.parametros_unidade (
  id bigserial primary key,
  unidade_id integer not null,
  chave varchar(80) not null,
  valor varchar(255) not null
);

create index if not exists idx_param_unidade on public.parametros_unidade(unidade_id);

insert into public.parametros_unidade (unidade_id, chave, valor)
select * from (values
  (1, 'HorarioAbertura', '06:00'),
  (1, 'HorarioFechamento', '23:00'),
  (2, 'HorarioAbertura', '06:00'),
  (2, 'HorarioFechamento', '22:00')
) as v(unidade_id, chave, valor)
where not exists (
  select 1 from public.parametros_unidade p
  where p.unidade_id = v.unidade_id and p.chave = v.chave
);

-- unidade_id nas tabelas núcleo
alter table public.alunos add column if not exists unidade_id integer default 1;
alter table public.usuarios add column if not exists unidade_id integer default 0;
alter table public.contas_receber add column if not exists unidade_id integer default 1;

create index if not exists idx_alunos_unidade on public.alunos(unidade_id);
create index if not exists idx_usuarios_unidade on public.usuarios(unidade_id);

update public.alunos set unidade_id = 1 where unidade_id is null;
update public.usuarios set unidade_id = 0 where perfil in ('Administrador', 'SuperAdmin') and (unidade_id is null or unidade_id = 0);
update public.usuarios set unidade_id = 1 where perfil not in ('Administrador', 'SuperAdmin') and (unidade_id is null or unidade_id = 0);
