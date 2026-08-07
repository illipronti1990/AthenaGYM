-- Grant Athena AI chat to student (portal) — service already scopes answers by persona.
insert into public.permissions (module, action, code, description) values
  ('ai', 'chat', 'ai.chat', 'Chat Athena AI com dados')
on conflict (code) do update set description = excluded.description, deleted_at = null;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug = 'student'
  and p.code = 'ai.chat'
on conflict do nothing;
