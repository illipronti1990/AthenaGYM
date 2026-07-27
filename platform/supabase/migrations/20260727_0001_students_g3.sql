-- Sprint G-3 — Gestão de Alunos: campos extras + complemento no endereço

alter table public.students
  add column if not exists marital_status varchar(40),
  add column if not exists profession varchar(120);

alter table public.student_addresses
  add column if not exists complement varchar(80);
