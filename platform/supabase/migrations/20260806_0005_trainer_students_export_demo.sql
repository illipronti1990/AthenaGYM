-- Vincula alunos de demo à Bruna Professora para exportação "meus alunos".
update public.students
set trainer_name = 'Bruna Professora DEV',
    updated_at = now()
where id in (
  '99999999-9999-9999-9999-999999999992', -- Renan Aluno DEV
  '15a335f6-b874-4474-9f62-f4b8a099f396'  -- THEO RODRIGUES (se existir)
)
and deleted_at is null;
