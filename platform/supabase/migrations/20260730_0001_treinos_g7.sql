-- ATHENA PLATFORM Sprint G-7 — Treinos, Avaliação Física e Evolução (1A)

-- ---------------------------------------------------------------------------
-- exercises enrich (G7.1)
-- ---------------------------------------------------------------------------
alter table public.exercises
  add column if not exists subgroup varchar(80),
  add column if not exists duration_seconds int,
  add column if not exists observations text,
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists objective varchar(120),
  add column if not exists categories text[] not null default '{}';

create index if not exists idx_exercises_equipment
  on public.exercises(equipment) where deleted_at is null;
create index if not exists idx_exercises_difficulty
  on public.exercises(difficulty) where deleted_at is null;
create index if not exists idx_exercises_created_by
  on public.exercises(created_by) where deleted_at is null and created_by is not null;

-- ---------------------------------------------------------------------------
-- prescription enrich (G7.8)
-- ---------------------------------------------------------------------------
alter table public.workout_exercises
  add column if not exists rpe numeric(4,1),
  add column if not exists cadence varchar(40),
  add column if not exists superset_group varchar(20),
  add column if not exists day_label varchar(10);

alter table public.workout_template_exercises
  add column if not exists rpe numeric(4,1),
  add column if not exists cadence varchar(40),
  add column if not exists superset_group varchar(20),
  add column if not exists day_label varchar(10);

-- ---------------------------------------------------------------------------
-- workouts split / days / signature (G7.3, G7.11)
-- ---------------------------------------------------------------------------
alter table public.workouts
  add column if not exists split_type varchar(40) not null default 'custom',
  add column if not exists days_json jsonb not null default '{}'::jsonb,
  add column if not exists signed_trainer_at timestamptz,
  add column if not exists signed_trainer_by uuid references public.profiles(id),
  add column if not exists signed_student_at timestamptz,
  add column if not exists signed_student_by uuid references public.profiles(id);

create index if not exists idx_workouts_expires
  on public.workouts(company_id, expires_at) where deleted_at is null;
create index if not exists idx_workouts_trainer
  on public.workouts(trainer_id) where deleted_at is null and trainer_id is not null;

-- ---------------------------------------------------------------------------
-- assessments enrich (G7.4)
-- ---------------------------------------------------------------------------
alter table public.assessments
  add column if not exists fat_mass numeric(6,2),
  add column if not exists hr_rest int,
  add column if not exists bp_systolic int,
  add column if not exists bp_diastolic int,
  add column if not exists skinfolds_json jsonb not null default '{}'::jsonb,
  add column if not exists goal varchar(40),
  add column if not exists next_due_at date,
  add column if not exists signed_trainer_at timestamptz,
  add column if not exists signed_trainer_by uuid references public.profiles(id),
  add column if not exists signed_student_at timestamptz,
  add column if not exists signed_student_by uuid references public.profiles(id);

alter table public.body_measurements
  add column if not exists neck numeric(6,2),
  add column if not exists shoulder numeric(6,2),
  add column if not exists forearm_left numeric(6,2),
  add column if not exists forearm_right numeric(6,2);

create index if not exists idx_assessments_next_due
  on public.assessments(company_id, next_due_at)
  where deleted_at is null and next_due_at is not null;

-- ---------------------------------------------------------------------------
-- workout_change_logs (G7.7 / G7.11)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_change_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  workout_id uuid references public.workouts(id) on delete cascade,
  student_id uuid references public.students(id),
  assessment_id uuid references public.assessments(id) on delete set null,
  actor_id uuid references public.profiles(id),
  action varchar(60) not null,
  diff jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_change_logs_workout
  on public.workout_change_logs(workout_id, created_at desc);
create index if not exists idx_workout_change_logs_student
  on public.workout_change_logs(student_id, created_at desc);

alter table public.workout_change_logs enable row level security;
drop policy if exists workout_change_logs_tenant on public.workout_change_logs;
create policy workout_change_logs_tenant on public.workout_change_logs for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- templates seed (G7.9) — company demo
-- ---------------------------------------------------------------------------
insert into public.workout_templates (
  id, company_id, name, category, objective, difficulty, estimated_duration, status
) values
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111',
   'Hipertrofia Iniciante', 'hipertrofia', 'hipertrofia', 'beginner', 45, 'active'),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111',
   'Hipertrofia Avançado', 'hipertrofia', 'hipertrofia', 'advanced', 60, 'active'),
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111',
   'Emagrecimento', 'emagrecimento', 'emagrecimento', 'beginner', 40, 'active'),
  ('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111111',
   'Idosos', 'saude', 'saude', 'beginner', 30, 'active'),
  ('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111111',
   'Reabilitação', 'reabilitacao', 'reabilitacao', 'beginner', 30, 'active'),
  ('66666666-6666-6666-6666-666666666606', '11111111-1111-1111-1111-111111111111',
   'Funcional', 'funcional', 'condicionamento', 'intermediate', 45, 'active'),
  ('66666666-6666-6666-6666-666666666607', '11111111-1111-1111-1111-111111111111',
   'Feminino', 'hipertrofia', 'hipertrofia', 'intermediate', 50, 'active'),
  ('66666666-6666-6666-6666-666666666608', '11111111-1111-1111-1111-111111111111',
   'Masculino', 'hipertrofia', 'hipertrofia', 'intermediate', 55, 'active')
on conflict (id) do update set name = excluded.name, status = 'active', deleted_at = null;

-- Link seed exercises to first template (Hipertrofia Iniciante)
delete from public.workout_template_exercises
where template_id = '66666666-6666-6666-6666-666666666601';

insert into public.workout_template_exercises (
  template_id, exercise_id, sort_order, sets, repetitions, load, rest_seconds, day_label, rpe
) values
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555502', 1, 4, '12', '60kg', 60, 'A', 7),
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555508', 2, 3, '15', null, 45, 'A', 6),
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555504', 3, 4, '10', null, 60, 'B', 7),
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 4, 3, '12', null, 90, 'B', 7);

-- ---------------------------------------------------------------------------
-- RBAC: reception read + student read (G7 permissions)
-- ---------------------------------------------------------------------------
-- reception = aaa4 (typical), student = aaa8 — verify from IAM seed
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'reception'
  and p.code in ('workouts.read', 'assessments.read', 'progress.read', 'exercises.read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'student'
  and p.code in ('workouts.read', 'assessments.read', 'progress.read', 'exercises.read')
on conflict do nothing;
