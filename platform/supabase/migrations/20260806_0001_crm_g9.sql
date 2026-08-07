-- ATHENA G-9 — CRM, Marketing e Fidelização
-- leads enrich, campaigns, templates, referrals, loyalty, NPS, segments, automations

-- ---------------------------------------------------------------------------
-- Enrich leads
-- ---------------------------------------------------------------------------
alter table public.leads
  add column if not exists objective varchar(160),
  add column if not exists first_contact_at timestamptz,
  add column if not exists goal varchar(160);

-- ---------------------------------------------------------------------------
-- Lead sources (missing system seeds)
-- ---------------------------------------------------------------------------
insert into public.lead_sources (id, company_id, name, slug, is_system) values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb0a', null, 'Wellhub', 'wellhub', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb0b', null, 'TotalPass', 'totalpass', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb0c', null, 'Passagem na recepção', 'reception', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb0d', null, 'Outros', 'other', true)
on conflict (id) do update set name = excluded.name, deleted_at = null;

-- Align DEV pipeline stages to G9 funnel
update public.pipeline_stages set name = 'Novo Lead', slug = 'new', position = 1, is_won = false, is_lost = false, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc01';
update public.pipeline_stages set name = 'Contato realizado', slug = 'contacted', position = 2, is_won = false, is_lost = false, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc02';
update public.pipeline_stages set name = 'Agendou visita', slug = 'visit_scheduled', position = 3, is_won = false, is_lost = false, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';
update public.pipeline_stages set name = 'Aula experimental', slug = 'trial_class', position = 4, is_won = false, is_lost = false, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc05';
update public.pipeline_stages set name = 'Negociação', slug = 'negotiation', position = 5, is_won = false, is_lost = false, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc07';
update public.pipeline_stages set name = 'Matrícula', slug = 'enrolled', position = 6, is_won = true, is_lost = false, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc08';
update public.pipeline_stages set name = 'Perdido', slug = 'lost', position = 7, is_won = false, is_lost = true, deleted_at = null
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccc09';
-- Soft-hide intermediate stages not in G9 funnel
update public.pipeline_stages set deleted_at = coalesce(deleted_at, now())
  where id in (
    'cccccccc-cccc-cccc-cccc-cccccccccc04',
    'cccccccc-cccc-cccc-cccc-cccccccccc06'
  );

-- ---------------------------------------------------------------------------
-- Enrich campaigns
-- ---------------------------------------------------------------------------
alter table public.campaigns
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists goal_value numeric(12,2),
  add column if not exists owner_id uuid references public.profiles(id),
  add column if not exists discount_pct numeric(5,2) default 0,
  add column if not exists segment_id uuid,
  add column if not exists budget numeric(12,2);

-- ---------------------------------------------------------------------------
-- Message templates
-- ---------------------------------------------------------------------------
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  channel varchar(30) not null default 'whatsapp',
  slug varchar(80) not null,
  name varchar(160) not null,
  subject varchar(200),
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug, channel)
);

create index if not exists idx_message_templates_company on public.message_templates(company_id)
  where deleted_at is null;

drop trigger if exists trg_message_templates_updated on public.message_templates;
create trigger trg_message_templates_updated before update on public.message_templates
for each row execute function public.set_updated_at();

alter table public.message_templates enable row level security;
drop policy if exists message_templates_tenant on public.message_templates;
create policy message_templates_tenant on public.message_templates for all using (
  company_id in (select public.user_company_ids())
) with check (
  company_id in (select public.user_company_ids())
);

insert into public.message_templates (id, company_id, channel, slug, name, subject, body, variables) values
  ('e1111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'welcome', 'Boas-vindas', null, 'Olá {{nome}}! Bem-vindo(a) à Athena. Estamos felizes em ter você conosco.', '["nome"]'),
  ('e1111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'billing', 'Cobrança', null, 'Oi {{nome}}, sua mensalidade de {{valor}} vence em {{data}}. Qualquer dúvida, fale conosco.', '["nome","valor","data"]'),
  ('e1111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'renewal', 'Renovação', null, 'Oi {{nome}}, seu plano vence em {{dias}} dias. Renove e continue treinando!', '["nome","dias"]'),
  ('e1111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'birthday', 'Aniversário', null, 'Feliz aniversário, {{nome}}! 🎉 A Athena deseja um dia incrível.', '["nome"]'),
  ('e1111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'class_reminder', 'Lembrete de aula', null, 'Oi {{nome}}, lembrete: sua aula {{aula}} é hoje às {{hora}}.', '["nome","aula","hora"]'),
  ('e1111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'workout_ready', 'Treino disponível', null, 'Oi {{nome}}, seu novo treino está disponível no app!', '["nome"]'),
  ('e1111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111111', 'whatsapp', 'nps', 'Pesquisa NPS', null, 'Oi {{nome}}, de 0 a 10, quanto você indicaria a Athena a um amigo?', '["nome"]'),
  ('e1111111-1111-1111-1111-111111111108', '11111111-1111-1111-1111-111111111111', 'email', 'welcome', 'Boas-vindas (e-mail)', 'Bem-vindo(a) à Athena', 'Olá {{nome}},\n\nSeja bem-vindo(a) à Athena Gym!\n\nEquipe Athena', '["nome"]'),
  ('e1111111-1111-1111-1111-111111111109', '11111111-1111-1111-1111-111111111111', 'email', 'enrollment', 'Matrícula', 'Matrícula confirmada', 'Olá {{nome}},\n\nSua matrícula no plano {{plano}} foi confirmada.\n\nAthena Gym', '["nome","plano"]'),
  ('e1111111-1111-1111-1111-11111111110a', '11111111-1111-1111-1111-111111111111', 'email', 'campaign', 'Campanha', 'Oferta especial Athena', 'Olá {{nome}},\n\n{{mensagem}}\n\nAthena Gym', '["nome","mensagem"]')
on conflict (company_id, slug, channel) do update set
  name = excluded.name,
  body = excluded.body,
  subject = excluded.subject,
  deleted_at = null,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Referrals
-- ---------------------------------------------------------------------------
create table if not exists public.referral_program_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) unique,
  benefit_type varchar(40) not null default 'discount',
  benefit_value numeric(12,2) not null default 30,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_referral_settings_updated on public.referral_program_settings;
create trigger trg_referral_settings_updated before update on public.referral_program_settings
for each row execute function public.set_updated_at();

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  referrer_student_id uuid not null references public.students(id),
  referred_lead_id uuid references public.leads(id),
  referred_student_id uuid references public.students(id),
  status varchar(30) not null default 'pending',
  benefit_type varchar(40),
  benefit_value numeric(12,2),
  rewarded_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_referrals_company on public.referrals(company_id, status)
  where deleted_at is null;
create index if not exists idx_referrals_referrer on public.referrals(referrer_student_id)
  where deleted_at is null;

drop trigger if exists trg_referrals_updated on public.referrals;
create trigger trg_referrals_updated before update on public.referrals
for each row execute function public.set_updated_at();

alter table public.referral_program_settings enable row level security;
alter table public.referrals enable row level security;
drop policy if exists referral_settings_tenant on public.referral_program_settings;
create policy referral_settings_tenant on public.referral_program_settings for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));
drop policy if exists referrals_tenant on public.referrals;
create policy referrals_tenant on public.referrals for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));

insert into public.referral_program_settings (company_id, benefit_type, benefit_value, notes)
values ('11111111-1111-1111-1111-111111111111', 'discount', 30, 'G-9: 30% de desconto na próxima mensalidade')
on conflict (company_id) do update set active = true, updated_at = now();

-- ---------------------------------------------------------------------------
-- Loyalty earn rules / rewards / redemptions
-- ---------------------------------------------------------------------------
create table if not exists public.loyalty_earn_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  event varchar(40) not null,
  points integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, event)
);

create table if not exists public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  slug varchar(80) not null,
  points_cost integer not null,
  description text,
  active boolean not null default true,
  stock integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

create table if not exists public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id),
  reward_id uuid not null references public.loyalty_rewards(id),
  points_spent integer not null,
  status varchar(30) not null default 'pending',
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists idx_loyalty_redemptions_student on public.loyalty_redemptions(student_id, created_at desc);

alter table public.loyalty_earn_rules enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_redemptions enable row level security;
drop policy if exists loyalty_earn_rules_tenant on public.loyalty_earn_rules;
create policy loyalty_earn_rules_tenant on public.loyalty_earn_rules for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));
drop policy if exists loyalty_rewards_tenant on public.loyalty_rewards;
create policy loyalty_rewards_tenant on public.loyalty_rewards for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));
drop policy if exists loyalty_redemptions_tenant on public.loyalty_redemptions;
create policy loyalty_redemptions_tenant on public.loyalty_redemptions for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));

insert into public.loyalty_earn_rules (company_id, event, points) values
  ('11111111-1111-1111-1111-111111111111', 'checkin', 10),
  ('11111111-1111-1111-1111-111111111111', 'renewal', 100),
  ('11111111-1111-1111-1111-111111111111', 'referral', 200),
  ('11111111-1111-1111-1111-111111111111', 'purchase', 50),
  ('11111111-1111-1111-1111-111111111111', 'event', 30)
on conflict (company_id, event) do update set points = excluded.points, active = true;

insert into public.loyalty_rewards (id, company_id, name, slug, points_cost, description) values
  ('f2222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Camiseta', 'camiseta', 500, 'Camiseta Athena'),
  ('f2222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Shake', 'shake', 150, 'Shake proteico'),
  ('f2222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'Personal 1 sessão', 'personal', 800, 'Uma sessão com personal'),
  ('f2222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111', 'Avaliação física', 'avaliacao', 400, 'Avaliação física completa'),
  ('f2222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111', 'Desconto 20%', 'desconto-20', 300, '20% na próxima mensalidade')
on conflict (company_id, slug) do update set points_cost = excluded.points_cost, deleted_at = null;

-- ---------------------------------------------------------------------------
-- NPS
-- ---------------------------------------------------------------------------
create table if not exists public.nps_surveys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  title varchar(200) not null default 'Pesquisa NPS',
  question text not null default 'Quanto você indicaria a Athena para um amigo?',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nps_responses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  survey_id uuid not null references public.nps_surveys(id) on delete cascade,
  student_id uuid references public.students(id),
  score integer not null check (score >= 0 and score <= 10),
  comment text,
  channel varchar(30) not null default 'app',
  created_at timestamptz not null default now()
);

create index if not exists idx_nps_responses_company on public.nps_responses(company_id, created_at desc);

alter table public.nps_surveys enable row level security;
alter table public.nps_responses enable row level security;
drop policy if exists nps_surveys_tenant on public.nps_surveys;
create policy nps_surveys_tenant on public.nps_surveys for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));
drop policy if exists nps_responses_tenant on public.nps_responses;
create policy nps_responses_tenant on public.nps_responses for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));

insert into public.nps_surveys (id, company_id, title, question, active)
values (
  'a3333333-3333-3333-3333-333333333301',
  '11111111-1111-1111-1111-111111111111',
  'NPS Athena',
  'Quanto você indicaria a Athena para um amigo?',
  true
)
on conflict (id) do update set active = true, updated_at = now();

-- ---------------------------------------------------------------------------
-- Audience segments
-- ---------------------------------------------------------------------------
create table if not exists public.audience_segments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(120) not null,
  slug varchar(80) not null,
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (company_id, slug)
);

alter table public.audience_segments enable row level security;
drop policy if exists audience_segments_tenant on public.audience_segments;
create policy audience_segments_tenant on public.audience_segments for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));

-- FK campaigns.segment_id
do $$ begin
  alter table public.campaigns
    add constraint campaigns_segment_id_fkey
    foreign key (segment_id) references public.audience_segments(id);
exception when duplicate_object then null;
end $$;

insert into public.audience_segments (id, company_id, name, slug, rules) values
  ('b4444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111', 'Mulheres', 'mulheres', '{"gender":"female"}'),
  ('b4444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111', 'Homens', 'homens', '{"gender":"male"}'),
  ('b4444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111', 'Inadimplentes', 'inadimplentes', '{"delinquent":true}'),
  ('b4444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111111', 'Wellhub', 'wellhub', '{"partner":"wellhub"}'),
  ('b4444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111111', 'TotalPass', 'totalpass', '{"partner":"totalpass"}'),
  ('b4444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111111', 'Sem check-in 30 dias', 'no-checkin-30', '{"noCheckinDays":30}'),
  ('b4444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111111', 'Novos alunos', 'novos', '{"maxMembershipDays":30}'),
  ('b4444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111111', 'Alunos antigos', 'antigos', '{"minMembershipDays":365}')
on conflict (company_id, slug) do update set rules = excluded.rules, deleted_at = null;

-- ---------------------------------------------------------------------------
-- Automations stub
-- ---------------------------------------------------------------------------
create table if not exists public.automation_flows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(160) not null,
  trigger_event varchar(80) not null,
  steps jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  flow_id uuid not null references public.automation_flows(id) on delete cascade,
  status varchar(30) not null default 'running',
  context jsonb not null default '{}'::jsonb,
  steps_log jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.automation_flows enable row level security;
alter table public.automation_runs enable row level security;
drop policy if exists automation_flows_tenant on public.automation_flows;
create policy automation_flows_tenant on public.automation_flows for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));
drop policy if exists automation_runs_tenant on public.automation_runs;
create policy automation_runs_tenant on public.automation_runs for all using (
  company_id in (select public.user_company_ids())
) with check (company_id in (select public.user_company_ids()));

insert into public.automation_flows (id, company_id, name, trigger_event, steps, active)
values (
  'c5555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111111',
  'Lead cadastrado → WhatsApp',
  'lead_created',
  '[{"type":"send_whatsapp","template":"welcome"},{"type":"wait","days":2},{"type":"send_whatsapp","template":"nps"},{"type":"create_task","title":"Agendar ligação"}]'::jsonb,
  true
)
on conflict (id) do update set active = true, steps = excluded.steps;

-- ---------------------------------------------------------------------------
-- Gamification achievement catalog seed (earned via API)
-- ---------------------------------------------------------------------------
-- no table change; achievements already exist per student

-- ---------------------------------------------------------------------------
-- RBAC
-- ---------------------------------------------------------------------------
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('manager', 'admin', 'super_admin')
  and p.code in (
    'sales.read','sales.create','sales.update','sales.pipeline',
    'campaigns.read','campaigns.manage',
    'loyalty.read','loyalty.manage',
    'engagement.read','notifications.read','notifications.send'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'reception'
  and p.code in (
    'sales.read','sales.create','sales.update','sales.pipeline',
    'campaigns.read','loyalty.read','engagement.read',
    'notifications.read','notifications.send'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'student'
  and p.code in ('engagement.read','loyalty.read')
on conflict do nothing;
