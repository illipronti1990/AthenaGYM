# Movvo — Administração Empresarial (G-14)

Backoffice administrativo: colaboradores, escalas, patrimônio, manutenção, documentos, ocorrências, mural, dashboard e relatórios.

## Rotas web (`/app/admin/*`)

| Rota | Função |
|------|--------|
| `/app/admin/dashboard` | KPIs RH / OS / docs / custos |
| `/app/admin/colaboradores` | CRUD colaboradores (`employees`, `profile_id` opcional) |
| `/app/admin/cargos` | Matriz RBAC (roles + permissions); `/app/roles` redireciona |
| `/app/admin/escalas` | Escalas / turnos / folgas (`work_schedules`) |
| `/app/admin/patrimonio` | Ativos (`assets`) |
| `/app/admin/manutencoes` | OS preventiva/corretiva + fotos URL Storage |
| `/app/admin/documentos` | Docs com vencimento + alerta on-read |
| `/app/admin/ocorrencias` | Incidentes internos |
| `/app/admin/comunicados` | Mural (`audience`: all/trainers/reception/managers) |
| `/app/admin/calendario` | Agregado férias / OS / docs / anúncios / escalas |
| `/app/admin/centros-custo` | Reusa `cost_centers` + `category` |
| `/app/admin/config` | Departamentos, cargos HR, settings JSON |
| `/app/admin/relatorios` | Export CSV |

## API (`/api/v1/admin/...`)

Módulo Nest `AdminModule`. Permissões: `admin.read|write|employees|assets|maintenance|documents|incidents|announcements|reports`.

Roles write: `POST/PATCH /roles`, `POST /roles/:id/permissions`, `POST /roles/assign`.

Finance: `PATCH/DELETE /finance/cost-centers/:id` (+ `category` no create).

## Schema

Migration `platform/supabase/migrations/20260808_0001_admin_g14.sql`:

- `departments`, `hr_job_titles`, `employees`, `work_schedules`
- `asset_categories`, `assets`, `maintenance_orders`, `maintenance_history`
- `document_categories`, `company_documents`
- `internal_incidents`, `internal_announcements`, `administrative_settings`
- `cost_centers.category`
- bucket Storage `admin-documents`

Colaborador ≠ usuário de login. Permissões de sistema não são duplicadas (sem `employee_permissions`).

## Auditoria

Writes admin emitem `audit_logs` com `module=admin`.

## Fora de escopo

Folha / eSocial / ponto biométrico completo · assinatura eletrônica · app mobile de OS · G-16 avançado · CMS externo.

## QA

Playwright: `platform/tests/admin.g14.smoke.spec.ts` (401/403, auth gate, redirect cargos).
