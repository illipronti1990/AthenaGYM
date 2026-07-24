# ATHENAS PLATFORM — Supabase (Sprint 0)

Migrations live in `migrations/`.

Apply via Dashboard SQL Editor or:

```bash
cd ../cloud/api
python -m scripts.apply_sql_supabase ../../platform/supabase/migrations/20260722_0001_platform_core.sql
```

After creating an Auth user in Supabase Auth, link membership:

```sql
insert into public.profiles (id, full_name, email)
values ('AUTH_USER_UUID', 'Admin Athenas', 'admin@athenas.gym')
on conflict (id) do update set email = excluded.email;

insert into public.memberships (profile_id, company_id, unit_id, role, status)
values (
  'AUTH_USER_UUID',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'admin',
  'active'
)
on conflict do nothing;
```
