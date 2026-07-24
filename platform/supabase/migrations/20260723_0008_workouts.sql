-- ATHENAS PLATFORM Sprint 6 — Treinos, Avaliações e Performance

-- ---------------------------------------------------------------------------
-- exercises (global + company library)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  name varchar(200) not null,
  slug varchar(220) not null,
  muscle_group varchar(80) not null,
  secondary_muscles text[] not null default '{}',
  equipment varchar(80),
  difficulty varchar(30) not null default 'beginner',
  exercise_type varchar(40) not null default 'strength',
  instructions text,
  common_mistakes text,
  tips text,
  contraindications text,
  video_url text,
  thumbnail_url text,
  gif_url text,
  is_global boolean not null default false,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists idx_exercises_slug_company
  on public.exercises (slug, coalesce(company_id, '00000000-0000-0000-0000-000000000000'))
  where deleted_at is null;
create index if not exists idx_exercises_muscle on public.exercises(muscle_group) where deleted_at is null;
create index if not exists idx_exercises_company on public.exercises(company_id) where deleted_at is null;

drop trigger if exists trg_exercises_updated on public.exercises;
create trigger trg_exercises_updated before update on public.exercises
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_templates
-- ---------------------------------------------------------------------------
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(200) not null,
  category varchar(80),
  objective varchar(120),
  difficulty varchar(30) not null default 'beginner',
  estimated_duration integer,
  created_by uuid references public.profiles(id),
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_workout_templates_company
  on public.workout_templates(company_id) where deleted_at is null;

drop trigger if exists trg_workout_templates_updated on public.workout_templates;
create trigger trg_workout_templates_updated before update on public.workout_templates
for each row execute function public.set_updated_at();

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order integer not null default 1,
  sets integer not null default 3,
  repetitions varchar(40) not null default '10',
  load varchar(40),
  rest_seconds integer not null default 60,
  tempo varchar(40),
  notes text
);

create index if not exists idx_wte_template on public.workout_template_exercises(template_id);

-- ---------------------------------------------------------------------------
-- workouts (assigned to student)
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  student_id uuid not null references public.students(id),
  template_id uuid references public.workout_templates(id),
  trainer_id uuid references public.profiles(id),
  name varchar(200) not null,
  objective varchar(120),
  starts_at date,
  expires_at date,
  status varchar(30) not null default 'draft',
  version integer not null default 1,
  source varchar(30) not null default 'manual',
  ai_suggestion_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  published_at timestamptz
);

create index if not exists idx_workouts_student on public.workouts(student_id) where deleted_at is null;
create index if not exists idx_workouts_company on public.workouts(company_id, status) where deleted_at is null;

drop trigger if exists trg_workouts_updated on public.workouts;
create trigger trg_workouts_updated before update on public.workouts
for each row execute function public.set_updated_at();

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  sort_order integer not null default 1,
  sets integer not null default 3,
  repetitions varchar(40) not null default '10',
  load varchar(40),
  rest_seconds integer not null default 60,
  tempo varchar(40),
  notes text
);

create index if not exists idx_workout_exercises_workout on public.workout_exercises(workout_id);

-- ---------------------------------------------------------------------------
-- workout_sessions / set logs (execution)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  student_id uuid not null references public.students(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  status varchar(30) not null default 'in_progress'
);

create index if not exists idx_workout_sessions_student on public.workout_sessions(student_id, started_at desc);

create table if not exists public.workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number integer not null,
  repetitions integer,
  load numeric(10,2),
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_set_logs_session on public.workout_set_logs(session_id);

-- ---------------------------------------------------------------------------
-- assessments + body measurements
-- ---------------------------------------------------------------------------
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  unit_id uuid references public.units(id),
  student_id uuid not null references public.students(id),
  trainer_id uuid references public.profiles(id),
  weight numeric(6,2),
  height numeric(5,2),
  body_fat numeric(5,2),
  lean_mass numeric(6,2),
  bmi numeric(5,2),
  bmr numeric(8,2),
  visceral_fat numeric(5,2),
  metabolic_age integer,
  objective varchar(120),
  observations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_assessments_student on public.assessments(student_id, created_at desc)
  where deleted_at is null;

drop trigger if exists trg_assessments_updated on public.assessments;
create trigger trg_assessments_updated before update on public.assessments
for each row execute function public.set_updated_at();

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  chest numeric(6,2),
  waist numeric(6,2),
  abdomen numeric(6,2),
  hip numeric(6,2),
  arm_left numeric(6,2),
  arm_right numeric(6,2),
  thigh_left numeric(6,2),
  thigh_right numeric(6,2),
  calf_left numeric(6,2),
  calf_right numeric(6,2)
);

-- ---------------------------------------------------------------------------
-- progress photos + AI suggestions
-- ---------------------------------------------------------------------------
create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id),
  type varchar(40) not null default 'front',
  storage_path text not null,
  public_url text,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_progress_photos_student
  on public.progress_photos(student_id, taken_at desc) where deleted_at is null;

create table if not exists public.ai_workout_suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id),
  assessment_id uuid references public.assessments(id),
  objective varchar(120),
  payload jsonb not null default '{}',
  status varchar(30) not null default 'pending_review',
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  workout_id uuid references public.workouts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_suggestions_student
  on public.ai_workout_suggestions(student_id, created_at desc);

alter table public.workouts
  drop constraint if exists workouts_ai_suggestion_id_fkey;
alter table public.workouts
  add constraint workouts_ai_suggestion_id_fkey
  foreign key (ai_suggestion_id) references public.ai_workout_suggestions(id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_set_logs enable row level security;
alter table public.assessments enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;
alter table public.ai_workout_suggestions enable row level security;

drop policy if exists exercises_select on public.exercises;
create policy exercises_select on public.exercises for select using (
  public.is_super_admin()
  or is_global = true
  or company_id in (select public.user_company_ids())
);

drop policy if exists exercises_write on public.exercises;
create policy exercises_write on public.exercises for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists workout_templates_tenant on public.workout_templates;
create policy workout_templates_tenant on public.workout_templates for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists workouts_tenant on public.workouts;
create policy workouts_tenant on public.workouts for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists assessments_tenant on public.assessments;
create policy assessments_tenant on public.assessments for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists progress_photos_tenant on public.progress_photos;
create policy progress_photos_tenant on public.progress_photos for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists ai_suggestions_tenant on public.ai_workout_suggestions;
create policy ai_suggestions_tenant on public.ai_workout_suggestions for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('workouts', 'read', 'workouts.read', 'Ler treinos e modelos'),
  ('workouts', 'create', 'workouts.create', 'Criar treinos'),
  ('workouts', 'update', 'workouts.update', 'Editar/publicar treinos'),
  ('workouts', 'delete', 'workouts.delete', 'Excluir treinos'),
  ('exercises', 'read', 'exercises.read', 'Ler biblioteca de exercícios'),
  ('exercises', 'manage', 'exercises.manage', 'Gerenciar exercícios'),
  ('assessments', 'read', 'assessments.read', 'Ler avaliações físicas'),
  ('assessments', 'create', 'assessments.create', 'Criar avaliações'),
  ('assessments', 'update', 'assessments.update', 'Atualizar avaliações'),
  ('progress', 'read', 'progress.read', 'Ler evolução e fotos'),
  ('progress', 'create', 'progress.create', 'Registrar progresso/fotos'),
  ('ai', 'suggest', 'ai.suggest', 'Gerar sugestões de treino com IA')
on conflict (code) do update set description = excluded.description, deleted_at = null;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'workouts.%' or p.code like 'exercises.%' or p.code like 'assessments.%'
   or p.code like 'progress.%' or p.code = 'ai.suggest'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'workouts.%' or p.code like 'exercises.%' or p.code like 'assessments.%'
   or p.code like 'progress.%' or p.code = 'ai.suggest'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'workouts.read','workouts.create','workouts.update',
  'exercises.read','exercises.manage',
  'assessments.read','assessments.create','assessments.update',
  'progress.read','progress.create','ai.suggest'
) on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', p.id from public.permissions p
where p.code in (
  'workouts.read','workouts.create','workouts.update',
  'exercises.read',
  'assessments.read','assessments.create','assessments.update',
  'progress.read','progress.create','ai.suggest'
) on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', p.id from public.permissions p
where p.code in (
  'workouts.read','workouts.create','workouts.update',
  'exercises.read',
  'assessments.read','assessments.create',
  'progress.read','progress.create','ai.suggest'
) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- seed global exercises
-- ---------------------------------------------------------------------------
insert into public.exercises (
  id, company_id, name, slug, muscle_group, secondary_muscles, equipment,
  difficulty, exercise_type, instructions, is_global, status
) values
  ('55555555-5555-5555-5555-555555555501', null, 'Agachamento Livre', 'agachamento-livre', 'pernas',
   array['gluteos','core'], 'barra', 'intermediate', 'strength',
   'Pés na largura dos ombros, desça controlado mantendo coluna neutra.', true, 'active'),
  ('55555555-5555-5555-5555-555555555502', null, 'Supino Reto', 'supino-reto', 'peito',
   array['triceps','ombros'], 'barra', 'intermediate', 'strength',
   'Controle a descida até o peito e empurre sem travar os cotovelos.', true, 'active'),
  ('55555555-5555-5555-5555-555555555503', null, 'Levantamento Terra', 'levantamento-terra', 'costas',
   array['gluteos','posteriores','core'], 'barra', 'advanced', 'strength',
   'Barra próxima às canelas, hip hinge, empurrar o chão.', true, 'active'),
  ('55555555-5555-5555-5555-555555555504', null, 'Remada Curvada', 'remada-curvada', 'costas',
   array['biceps','core'], 'barra', 'intermediate', 'strength',
   'Tronco inclinado, puxar a barra em direção ao umbigo.', true, 'active'),
  ('55555555-5555-5555-5555-555555555505', null, 'Desenvolvimento Militar', 'desenvolvimento-militar', 'ombros',
   array['triceps','core'], 'barra', 'intermediate', 'strength',
   'Empurre a barra acima da cabeça sem arquear a lombar.', true, 'active'),
  ('55555555-5555-5555-5555-555555555506', null, 'Prancha Isométrica', 'prancha-isometrica', 'core',
   array['ombros'], 'peso_corporal', 'beginner', 'mobility',
   'Corpo alinhado, contraia o abdômen e glúteos.', true, 'active'),
  ('55555555-5555-5555-5555-555555555507', null, 'Corrida Esteira', 'corrida-esteira', 'cardio',
   array['pernas'], 'esteira', 'beginner', 'cardio',
   'Mantenha cadência constante conforme zona alvo.', true, 'active'),
  ('55555555-5555-5555-5555-555555555508', null, 'Leg Press 45°', 'leg-press-45', 'pernas',
   array['gluteos'], 'maquina', 'beginner', 'strength',
   'Amplitude controlada sem levantar o quadril do assento.', true, 'active')
on conflict (id) do update set
  name = excluded.name,
  instructions = excluded.instructions,
  status = 'active',
  deleted_at = null;
