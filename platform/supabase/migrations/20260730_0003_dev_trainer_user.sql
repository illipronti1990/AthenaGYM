-- DEV trainer/professor user
-- Login: bruna.professora@athena.local / teste123 (via Nest POST /auth/dev-login)

create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '99999999-9999-9999-9999-999999999993',
  'authenticated',
  'authenticated',
  'bruna.professora@athena.local',
  crypt('teste123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Bruna Professora DEV"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '99999999-9999-9999-9999-999999999993',
  '99999999-9999-9999-9999-999999999993',
  jsonb_build_object(
    'sub', '99999999-9999-9999-9999-999999999993',
    'email', 'bruna.professora@athena.local'
  ),
  'email',
  '99999999-9999-9999-9999-999999999993',
  now(),
  now(),
  now()
)
on conflict (provider, provider_id) do update set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (
  id,
  full_name,
  email,
  company_id,
  default_unit_id,
  status,
  locale,
  timezone
)
values (
  '99999999-9999-9999-9999-999999999993',
  'Bruna Professora DEV',
  'bruna.professora@athena.local',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'active',
  'pt-BR',
  'America/Sao_Paulo'
)
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  company_id = excluded.company_id,
  default_unit_id = excluded.default_unit_id,
  status = 'active',
  deleted_at = null,
  updated_at = now();

insert into public.memberships (
  profile_id,
  company_id,
  unit_id,
  role,
  status
)
values (
  '99999999-9999-9999-9999-999999999993',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'trainer',
  'active'
)
on conflict (profile_id, company_id, role) do update set
  unit_id = excluded.unit_id,
  status = 'active',
  deleted_at = null,
  updated_at = now();

-- role trainer = aaaaaaaaaaaa6
insert into public.user_roles (
  profile_id,
  role_id,
  company_id,
  unit_id
)
select
  '99999999-9999-9999-9999-999999999993',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
where not exists (
  select 1
  from public.user_roles ur
  where ur.profile_id = '99999999-9999-9999-9999-999999999993'
    and ur.role_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6'
    and ur.company_id = '11111111-1111-1111-1111-111111111111'
    and ur.deleted_at is null
);
