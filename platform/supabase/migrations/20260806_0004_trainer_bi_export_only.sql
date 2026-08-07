-- Professor (trainer/personal): sem dashboards BI; apenas exportações (reports.export).
-- Mantém ai.chat para Athena AI.

delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and rp.role_id in (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', -- trainer
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7'  -- personal (se existir)
  )
  and p.code in (
    'analytics.read',
    'predictions.read',
    'ai.insights',
    'executive.read'
  );

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('trainer', 'personal')
  and p.code = 'reports.export'
on conflict do nothing;
