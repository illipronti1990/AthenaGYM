-- Movvo G-17 — Performance / Scale indices + atomic outbox claim

-- ---------------------------------------------------------------------------
-- Hot-path indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_audit_logs_company_module_created
  on public.audit_logs(company_id, module, created_at desc);

create index if not exists idx_audit_logs_created
  on public.audit_logs(created_at desc);

create index if not exists idx_receivables_company_due_status
  on public.receivables(company_id, due_date, status)
  where deleted_at is null;

create index if not exists idx_students_company_status_name
  on public.students(company_id, status, full_name)
  where deleted_at is null;

create index if not exists idx_students_company_email
  on public.students(company_id, email)
  where deleted_at is null and email is not null;

do $$ begin
  if to_regclass('public.checkins') is not null then
    execute 'create index if not exists idx_checkins_company_created on public.checkins(company_id, created_at desc)';
  end if;
exception when others then null;
end $$;

create index if not exists idx_outbox_events_pending_created
  on public.outbox_events(created_at)
  where status = 'pending';

create index if not exists idx_security_events_created
  on public.security_events(created_at desc);

create index if not exists idx_api_usage_logs_company_created
  on public.api_usage_logs(company_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Atomic outbox claim (FOR UPDATE SKIP LOCKED)
-- ---------------------------------------------------------------------------
create or replace function public.claim_outbox_batch(p_limit int default 50)
returns setof public.outbox_events
language plpgsql
security definer
as $$
begin
  return query
  with cte as (
    select id
    from public.outbox_events
    where status = 'pending'
    order by created_at asc
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    for update skip locked
  )
  update public.outbox_events o
  set status = 'processing'
  from cte
  where o.id = cte.id
  returning o.*;
end;
$$;

grant execute on function public.claim_outbox_batch(int) to service_role;
grant execute on function public.claim_outbox_batch(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Optional daily dashboard snapshot view (non-materialized; cheap aggregate helper)
-- ---------------------------------------------------------------------------
create or replace view public.v_company_daily_ops as
select
  c.id as company_id,
  current_date as day,
  (select count(*) from public.students s where s.company_id = c.id and s.deleted_at is null) as students_active
from public.companies c
where c.deleted_at is null;

-- ---------------------------------------------------------------------------
-- Permissions for observability DevOps panel
-- ---------------------------------------------------------------------------
insert into public.permissions (module, action, code, description) values
  ('observability', 'read', 'observability.read', 'Ver painel DevOps / métricas')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin')
  and p.code = 'observability.read'
on conflict do nothing;
