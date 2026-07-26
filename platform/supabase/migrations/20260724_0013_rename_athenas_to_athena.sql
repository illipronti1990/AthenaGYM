-- ATHENA PLATFORM — rename branding Athenas → Athena in existing seed/data
-- Tables keep structural names (companies, students, ...). Only display/content values change.

update public.companies
set
  name = replace(name, 'ATHENAS', 'ATHENA'),
  legal_name = replace(coalesce(legal_name, ''), 'ATHENAS', 'ATHENA'),
  updated_at = now()
where name ilike '%athenas%'
   or coalesce(legal_name, '') ilike '%athenas%';

update public.units
set
  name = replace(name, 'ATHENAS', 'ATHENA'),
  updated_at = now()
where name ilike '%athenas%';

update public.gym_settings
set
  name = replace(name, 'ATHENAS', 'ATHENA'),
  email = replace(coalesce(email, ''), '@athenas.', '@athena.'),
  updated_at = now()
where name ilike '%athenas%'
   or coalesce(email, '') ilike '%athenas%';

update public.profiles
set
  email = replace(coalesce(email, ''), '@athenas.', '@athena.'),
  updated_at = now()
where coalesce(email, '') ilike '%athenas%';

-- Auth email for DEV user (if present)
update auth.users
set
  email = replace(email, '@athenas.', '@athena.'),
  raw_user_meta_data = jsonb_set(
    coalesce(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    to_jsonb(replace(coalesce(email, ''), '@athenas.', '@athena.'))
  ),
  updated_at = now()
where email ilike '%@athenas.%';

update auth.identities
set
  identity_data = jsonb_set(
    coalesce(identity_data, '{}'::jsonb),
    '{email}',
    to_jsonb(replace(coalesce(identity_data->>'email', ''), '@athenas.', '@athena.'))
  ),
  provider_id = replace(provider_id, '@athenas.', '@athena.'),
  updated_at = now()
where coalesce(identity_data->>'email', '') ilike '%@athenas.%'
   or provider_id ilike '%@athenas.%';
