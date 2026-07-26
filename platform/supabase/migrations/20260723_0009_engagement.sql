-- ATHENA PLATFORM Sprint 7 — Comunicação, Engajamento e Apps

-- ---------------------------------------------------------------------------
-- communication preferences (LGPD)
-- ---------------------------------------------------------------------------
create table if not exists public.communication_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  whatsapp_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, profile_id)
);

drop trigger if exists trg_comm_prefs_updated on public.communication_preferences;
create trigger trg_comm_prefs_updated before update on public.communication_preferences
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  body text not null,
  type varchar(40) not null default 'internal',
  channel varchar(30) not null default 'internal',
  status varchar(30) not null default 'pending',
  payload jsonb not null default '{}',
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_company on public.notifications(company_id, status);

-- ---------------------------------------------------------------------------
-- conversations / messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  type varchar(40) not null default 'direct',
  title varchar(200),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_company on public.conversations(company_id, updated_at desc);

drop trigger if exists trg_conversations_updated on public.conversations;
create trigger trg_conversations_updated before update on public.conversations
for each row execute function public.set_updated_at();

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role varchar(30) not null default 'member',
  joined_at timestamptz not null default now(),
  unique (conversation_id, profile_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  company_id uuid not null references public.companies(id),
  sender_id uuid not null references public.profiles(id),
  content text not null,
  attachments jsonb not null default '[]',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  name varchar(200) not null,
  type varchar(60) not null,
  channel varchar(30) not null default 'push',
  subject varchar(200),
  body text not null,
  status varchar(30) not null default 'draft',
  schedule_at timestamptz,
  sent_at timestamptz,
  audience jsonb not null default '{}',
  requires_marketing_consent boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_campaigns_company on public.campaigns(company_id, status)
  where deleted_at is null;

drop trigger if exists trg_campaigns_updated on public.campaigns;
create trigger trg_campaigns_updated before update on public.campaigns
for each row execute function public.set_updated_at();

create table if not exists public.campaign_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  channel varchar(30) not null,
  status varchar(30) not null default 'queued',
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- ---------------------------------------------------------------------------
-- loyalty / challenges / achievements
-- ---------------------------------------------------------------------------
create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id) on delete cascade,
  points integer not null default 0,
  tier varchar(40) not null default 'bronze',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, student_id)
);

drop trigger if exists trg_loyalty_accounts_updated on public.loyalty_accounts;
create trigger trg_loyalty_accounts_updated before update on public.loyalty_accounts
for each row execute function public.set_updated_at();

create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id),
  points integer not null,
  reason varchar(80) not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_loyalty_ledger_student on public.loyalty_ledger(student_id, created_at desc);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  title varchar(200) not null,
  description text,
  start_date date not null,
  end_date date not null,
  reward varchar(200),
  points_reward integer not null default 50,
  status varchar(30) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (end_date >= start_date)
);

create index if not exists idx_challenges_company on public.challenges(company_id, status)
  where deleted_at is null;

drop trigger if exists trg_challenges_updated on public.challenges;
create trigger trg_challenges_updated before update on public.challenges
for each row execute function public.set_updated_at();

create table if not exists public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  student_id uuid not null references public.students(id),
  score integer not null default 0,
  position integer,
  joined_at timestamptz not null default now(),
  unique (challenge_id, student_id)
);

create index if not exists idx_challenge_participants_score
  on public.challenge_participants(challenge_id, score desc);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  student_id uuid not null references public.students(id),
  badge varchar(80) not null,
  title varchar(160) not null,
  description text,
  earned_at timestamptz not null default now(),
  unique (company_id, student_id, badge)
);

create index if not exists idx_achievements_student on public.achievements(student_id, earned_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.communication_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_deliveries enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.achievements enable row level security;

drop policy if exists notifications_tenant on public.notifications;
create policy notifications_tenant on public.notifications for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists conversations_tenant on public.conversations;
create policy conversations_tenant on public.conversations for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists messages_tenant on public.messages;
create policy messages_tenant on public.messages for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists campaigns_tenant on public.campaigns;
create policy campaigns_tenant on public.campaigns for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists loyalty_tenant on public.loyalty_accounts;
create policy loyalty_tenant on public.loyalty_accounts for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists challenges_tenant on public.challenges;
create policy challenges_tenant on public.challenges for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

drop policy if exists achievements_tenant on public.achievements;
create policy achievements_tenant on public.achievements for all using (
  public.is_super_admin() or company_id in (select public.user_company_ids())
) with check (
  public.is_super_admin() or company_id in (select public.user_company_ids())
);

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('notifications', 'read', 'notifications.read', 'Ler notificações'),
  ('notifications', 'send', 'notifications.send', 'Enviar notificações'),
  ('messaging', 'read', 'messaging.read', 'Ler conversas'),
  ('messaging', 'send', 'messaging.send', 'Enviar mensagens'),
  ('campaigns', 'read', 'campaigns.read', 'Ler campanhas'),
  ('campaigns', 'manage', 'campaigns.manage', 'Criar/enviar campanhas'),
  ('loyalty', 'read', 'loyalty.read', 'Ler fidelidade e ranking'),
  ('loyalty', 'manage', 'loyalty.manage', 'Gerenciar pontos e desafios'),
  ('engagement', 'read', 'engagement.read', 'Dashboard de engajamento'),
  ('ai', 'chat', 'ai.chat', 'Assistente IA conversacional')
on conflict (code) do update set description = excluded.description, deleted_at = null;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', p.id from public.permissions p
where p.code like 'notifications.%' or p.code like 'messaging.%' or p.code like 'campaigns.%'
   or p.code like 'loyalty.%' or p.code = 'engagement.read' or p.code = 'ai.chat'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', p.id from public.permissions p
where p.code like 'notifications.%' or p.code like 'messaging.%' or p.code like 'campaigns.%'
   or p.code like 'loyalty.%' or p.code = 'engagement.read' or p.code = 'ai.chat'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', p.id from public.permissions p
where p.code in (
  'notifications.read','notifications.send',
  'messaging.read','messaging.send',
  'campaigns.read','campaigns.manage',
  'loyalty.read','loyalty.manage','engagement.read','ai.chat'
) on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', p.id from public.permissions p
where p.code in (
  'notifications.read','notifications.send',
  'messaging.read','messaging.send',
  'loyalty.read','engagement.read'
) on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', p.id from public.permissions p
where p.code in (
  'notifications.read','messaging.read','messaging.send',
  'loyalty.read','ai.chat'
) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- seed sample challenge
-- ---------------------------------------------------------------------------
insert into public.challenges (
  id, company_id, title, description, start_date, end_date, reward, points_reward, status
) values (
  '66666666-6666-6666-6666-666666666601',
  '11111111-1111-1111-1111-111111111111',
  '30 dias de presença',
  'Faça check-in em 30 dias neste mês e ganhe medalha + pontos.',
  current_date,
  current_date + 30,
  'Medalha 30 dias + 100 pontos',
  100,
  'active'
) on conflict (id) do update set status = 'active', deleted_at = null;
