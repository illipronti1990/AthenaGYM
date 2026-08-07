'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Employee, Role } from '@movvo/shared';
import { Button, Card } from '@movvo/ui';
import { apiListPermissions, apiListRoles, apiListUsers } from '@/services/api';
import {
  apiAdminAnnouncements,
  apiAdminAssignRole,
  apiAdminAssets,
  apiAdminCalendar,
  apiAdminCostCenters,
  apiAdminCreateCostCenter,
  apiAdminCreateEmployee,
  apiAdminCreateRole,
  apiAdminDashboard,
  apiAdminDeleteAsset,
  apiAdminDeleteCostCenter,
  apiAdminDeleteDocument,
  apiAdminDeleteEmployee,
  apiAdminDepartments,
  apiAdminDocuments,
  apiAdminEmployees,
  apiAdminIncidents,
  apiAdminJobTitles,
  apiAdminMaintenance,
  apiAdminReport,
  apiAdminSaveSettings,
  apiAdminSchedules,
  apiAdminSetRolePermissions,
  apiAdminSettings,
  apiAdminUpdateCostCenter,
  apiAdminUpdateEmployee,
  apiAdminUpsertAnnouncement,
  apiAdminUpsertAsset,
  apiAdminUpsertDepartment,
  apiAdminUpsertDocument,
  apiAdminUpsertIncident,
  apiAdminUpsertJobTitle,
  apiAdminUpsertMaintenance,
  apiAdminUpsertSchedule,
} from '@/services/adminApi';
import { PageState } from '@/components/ux/PageState';
import { useConfirm } from '@/components/ux/ConfirmProvider';
import { useToast } from '@/components/ui/Toast';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm';

export function AdminDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [kpi, setKpi] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setKpi(await apiAdminDashboard(accessToken));
      } catch (err) {
        push(err instanceof Error ? err.message : 'Falha no dashboard', 'error');
        setKpi({});
      }
    })();
  }, [accessToken, push]);

  if (!kpi) return <PageState state="loading" skeleton="dashboard" />;

  const cards = [
    ['Colaboradores ativos', kpi.employeesActive],
    ['Férias próximas', kpi.employeesVacationSoon],
    ['Contratações no mês', kpi.recentHires],
    ['OS abertas', kpi.openMaintenanceOrders],
    ['Ativos em manutenção', kpi.assetsInMaintenance],
    ['Docs vencendo', kpi.documentsExpiringSoon],
    ['Custo manutenção (mês)', kpi.maintenanceCostMonth],
    ['Ocorrências (mês)', kpi.incidentsThisMonth],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-dashboard">
      {cards.map(([label, value]) => (
        <Card key={label}>
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="movvo-title mt-1 text-2xl">
            {label.includes('Custo')
              ? Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : value ?? 0}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function EmployeesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState<Employee[] | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('active');

  async function load() {
    setRows(null);
    try {
      setRows(await apiAdminEmployees(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao listar', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await apiAdminCreateEmployee(accessToken, { fullName, email, status });
      push('Colaborador criado');
      setFullName('');
      setEmail('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao criar', 'error');
    }
  }

  async function onDelete(emp: Employee) {
    const ok = await confirm({
      title: `Remover ${emp.fullName}?`,
      message: 'O colaborador será marcado como inativo.',
      confirmLabel: 'Remover',
      danger: true,
    });
    if (!ok) return;
    try {
      await apiAdminDeleteEmployee(accessToken, emp.id);
      push('Removido');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao remover', 'error');
    }
  }

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-employees">
      <form onSubmit={onCreate} className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4">
        <Field label="Nome">
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required data-testid="emp-name" />
        </Field>
        <Field label="E-mail">
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="emp-email" />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="vacation">Férias</option>
            <option value="leave">Afastado</option>
          </select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" data-testid="emp-create">Adicionar</Button>
        </div>
      </form>
      {rows.length === 0 ? (
        <PageState state="empty" emptyTitle="Nenhum colaborador" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Banco horas</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]/60">
                  <td className="py-2 pr-3">{r.fullName}</td>
                  <td className="py-2 pr-3">{r.email || '—'}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3">{r.hourBankBalance}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={() => void onDelete(r)}
                    >
                      Remover
                    </button>
                    <button
                      type="button"
                      className="ml-3 text-xs text-[var(--primary)]"
                      onClick={() =>
                        void apiAdminUpdateEmployee(accessToken, r.id, {
                          status: r.status === 'active' ? 'vacation' : 'active',
                        }).then(load)
                      }
                    >
                      Alternar férias
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminRolesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [perms, setPerms] = useState<Array<{ id: string; code: string }>>([]);
  const [selected, setSelected] = useState<string>('');
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [profileId, setProfileId] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; fullName: string | null; email: string | null }>>([]);

  async function load() {
    try {
      const [r, p, u] = await Promise.all([
        apiListRoles(accessToken),
        apiListPermissions(accessToken),
        apiListUsers(accessToken),
      ]);
      setRoles(r);
      setPerms(p);
      setUsers(u);
      if (!selected && r[0]) {
        setSelected(r[0].id);
        setChecked(new Set((r[0].permissions || []).map((x) => x.id)));
      }
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha cargos', 'error');
      setRoles([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    const role = roles?.find((r) => r.id === selected);
    if (role) setChecked(new Set((role.permissions || []).map((p) => p.id)));
  }, [selected, roles]);

  if (!roles) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-roles">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminCreateRole(accessToken, { name, slug })
            .then(() => {
              push('Cargo criado');
              setName('');
              setSlug('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Nome">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Slug">
          <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </Field>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit">Criar cargo</Button>
        </div>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="movvo-title text-base">Cargos</h3>
          <ul className="mt-3 space-y-2">
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`w-full rounded px-2 py-1 text-left text-sm ${selected === r.id ? 'bg-[var(--primary)]/10' : ''}`}
                  onClick={() => setSelected(r.id)}
                >
                  {r.name} <span className="text-[var(--muted)]">({r.slug})</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="movvo-title text-base">Matriz de permissões</h3>
          <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
            {perms.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked.has(p.id)}
                  onChange={(e) => {
                    const next = new Set(checked);
                    if (e.target.checked) next.add(p.id);
                    else next.delete(p.id);
                    setChecked(next);
                  }}
                />
                {p.code}
              </label>
            ))}
          </div>
          <Button
            className="mt-3"
            type="button"
            onClick={() =>
              void apiAdminSetRolePermissions(accessToken, selected, [...checked])
                .then(() => {
                  push('Permissões salvas');
                  return load();
                })
                .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'))
            }
          >
            Salvar matriz
          </Button>
        </Card>
      </div>

      <Card>
        <h3 className="movvo-title text-base">Atribuir cargo a usuário</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Usuário">
            <select className={inputCls} value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              <option value="">Selecione</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={() => {
                if (!profileId || !selected) return;
                void apiAdminAssignRole(accessToken, { profileId, roleId: selected })
                  .then(() => push('Cargo atribuído'))
                  .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
              }}
            >
              Atribuir
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function AdminConfigPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [deps, setDeps] = useState<Array<{ id: string; name: string }>>([]);
  const [titles, setTitles] = useState<Array<{ id: string; name: string }>>([]);
  const [depName, setDepName] = useState('');
  const [titleName, setTitleName] = useState('');
  const [settingsJson, setSettingsJson] = useState('{}');

  async function load() {
    try {
      const [d, t, s] = await Promise.all([
        apiAdminDepartments(accessToken),
        apiAdminJobTitles(accessToken),
        apiAdminSettings(accessToken),
      ]);
      setDeps(d);
      setTitles(t);
      setSettingsJson(JSON.stringify(s.settings || {}, null, 2));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha config', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="space-y-4" data-testid="admin-config">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="movvo-title text-base">Departamentos</h3>
          <ul className="mt-2 text-sm">
            {deps.map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void apiAdminUpsertDepartment(accessToken, { name: depName })
                .then(() => {
                  setDepName('');
                  return load();
                })
                .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
            }}
          >
            <input className={inputCls} value={depName} onChange={(e) => setDepName(e.target.value)} placeholder="Novo departamento" required />
            <Button type="submit">Add</Button>
          </form>
        </Card>
        <Card>
          <h3 className="movvo-title text-base">Cargos HR</h3>
          <ul className="mt-2 text-sm">
            {titles.map((t) => (
              <li key={t.id}>{t.name}</li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void apiAdminUpsertJobTitle(accessToken, { name: titleName })
                .then(() => {
                  setTitleName('');
                  return load();
                })
                .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
            }}
          >
            <input className={inputCls} value={titleName} onChange={(e) => setTitleName(e.target.value)} placeholder="Novo cargo HR" required />
            <Button type="submit">Add</Button>
          </form>
        </Card>
      </div>
      <Card>
        <h3 className="movvo-title text-base">Settings (JSON)</h3>
        <textarea
          className={`${inputCls} mt-2 min-h-[160px] font-mono text-xs`}
          value={settingsJson}
          onChange={(e) => setSettingsJson(e.target.value)}
        />
        <Button
          className="mt-2"
          type="button"
          onClick={() => {
            try {
              const parsed = JSON.parse(settingsJson) as Record<string, unknown>;
              void apiAdminSaveSettings(accessToken, parsed)
                .then(() => push('Config salva'))
                .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
            } catch {
              push('JSON inválido', 'error');
            }
          }}
        >
          Salvar
        </Button>
      </Card>
    </div>
  );
}

export function SchedulesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState('work');

  async function load() {
    try {
      const [emps, sched] = await Promise.all([
        apiAdminEmployees(accessToken),
        apiAdminSchedules(accessToken),
      ]);
      setEmployees(emps);
      setRows(sched);
      if (!employeeId && emps[0]) setEmployeeId(emps[0].id);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha escalas', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-schedules">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminUpsertSchedule(accessToken, { employeeId, scheduleDate, kind })
            .then(() => {
              push('Escala salva');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Colaborador">
          <select className={inputCls} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </Field>
        <Field label="Data">
          <input className={inputCls} type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
        </Field>
        <Field label="Tipo">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="work">Trabalho</option>
            <option value="off">Folga</option>
            <option value="swap">Troca</option>
            <option value="vacation">Férias</option>
            <option value="training">Treinamento</option>
          </select>
        </Field>
        <div className="flex items-end"><Button type="submit">Salvar</Button></div>
      </form>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={String(r.id)}>{String(r.scheduleDate)} · {String(r.kind)}</li>
        ))}
      </ul>
    </div>
  );
}

export function AssetsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('0');

  async function load() {
    try {
      setRows(await apiAdminAssets(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha patrimônio', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-assets">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminUpsertAsset(accessToken, {
            code,
            name,
            purchaseValue: Number(purchaseValue) || 0,
          })
            .then(() => {
              push('Ativo salvo');
              setCode('');
              setName('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Código"><input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required data-testid="asset-code" /></Field>
        <Field label="Nome"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Valor"><input className={inputCls} value={purchaseValue} onChange={(e) => setPurchaseValue(e.target.value)} /></Field>
        <div className="flex items-end"><Button type="submit">Adicionar</Button></div>
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)]">
            <th className="py-2 text-left">Código</th>
            <th className="py-2 text-left">Nome</th>
            <th className="py-2 text-left">Status</th>
            <th className="py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-b border-[var(--border)]/50">
              <td className="py-2">{String(r.code)}</td>
              <td className="py-2">{String(r.name)}</td>
              <td className="py-2">{String(r.status)}</td>
              <td className="py-2">
                <button type="button" className="text-xs text-red-600" onClick={() => void apiAdminDeleteAsset(accessToken, String(r.id)).then(load)}>
                  Baixar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MaintenancePanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('corrective');
  const [priority, setPriority] = useState('medium');
  const [photoUrl, setPhotoUrl] = useState('');

  async function load() {
    try {
      setRows(await apiAdminMaintenance(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha OS', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-maintenance">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminUpsertMaintenance(accessToken, {
            title,
            kind,
            priority,
            photoUrls: photoUrl ? [photoUrl] : [],
          })
            .then(() => {
              push('OS criada');
              setTitle('');
              setPhotoUrl('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Título"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Tipo">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="corrective">Corretiva</option>
            <option value="preventive">Preventiva</option>
          </select>
        </Field>
        <Field label="Prioridade">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </Field>
        <Field label="Foto (URL Storage)">
          <input className={inputCls} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="admin-documents/..." />
        </Field>
        <div className="flex items-end"><Button type="submit">Abrir OS</Button></div>
      </form>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={String(r.id)} className="flex items-center justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>{String(r.title)} · {String(r.status)} · {String(r.priority)}</span>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                void apiAdminUpsertMaintenance(accessToken, {
                  id: r.id,
                  title: r.title,
                  kind: r.kind,
                  priority: r.priority,
                  status: 'done',
                  cost: r.cost,
                  photoUrls: r.photo_urls,
                }).then(load)
              }
            >
              Concluir
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  async function load() {
    try {
      setRows(await apiAdminDocuments(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha docs', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-documents">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminUpsertDocument(accessToken, { title, expiresAt: expiresAt || null, fileUrl: fileUrl || null })
            .then(() => {
              push('Documento salvo');
              setTitle('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Título"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Vencimento"><input className={inputCls} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></Field>
        <Field label="Arquivo URL"><input className={inputCls} value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} /></Field>
        <div className="flex items-end"><Button type="submit">Salvar</Button></div>
      </form>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={String(r.id)} className="flex justify-between">
            <span>{String(r.title)} · vence {String(r.expires_at || '—')}</span>
            <button type="button" className="text-xs text-red-600" onClick={() => void apiAdminDeleteDocument(accessToken, String(r.id)).then(load)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IncidentsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('operational');

  async function load() {
    try {
      setRows(await apiAdminIncidents(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ocorrências', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-incidents">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminUpsertIncident(accessToken, { title, type })
            .then(() => {
              push('Ocorrência registrada');
              setTitle('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Título"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Tipo">
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="complaint">Reclamação</option>
            <option value="incident">Incidente</option>
            <option value="accident">Acidente</option>
            <option value="damaged_equipment">Equipamento</option>
            <option value="operational">Operacional</option>
          </select>
        </Field>
        <div className="flex items-end"><Button type="submit">Registrar</Button></div>
      </form>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={String(r.id)}>{String(r.title)} · {String(r.type)} · {String(r.status)}</li>
        ))}
      </ul>
    </div>
  );
}

export function AnnouncementsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');

  async function load() {
    try {
      setRows(await apiAdminAnnouncements(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha mural', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-announcements">
      <form
        className="space-y-3 rounded-lg border border-[var(--border)] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminUpsertAnnouncement(accessToken, { title, body, audience })
            .then(() => {
              push('Comunicado publicado');
              setTitle('');
              setBody('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Título"><input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Mensagem"><textarea className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} required /></Field>
        <Field label="Público">
          <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="all">Todos</option>
            <option value="trainers">Professores</option>
            <option value="reception">Recepção</option>
            <option value="managers">Gestores</option>
          </select>
        </Field>
        <Button type="submit">Publicar</Button>
      </form>
      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={String(r.id)}>
            <h3 className="movvo-title text-base">{String(r.title)}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{String(r.audience)}</p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{String(r.body)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CalendarPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [events, setEvents] = useState<Array<{ id: string; type: string; title: string; date: string; href?: string }> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setEvents(await apiAdminCalendar(accessToken));
      } catch (err) {
        push(err instanceof Error ? err.message : 'Falha calendário', 'error');
        setEvents([]);
      }
    })();
  }, [accessToken, push]);

  if (!events) return <PageState state="loading" />;

  return (
    <div className="space-y-2" data-testid="admin-calendar">
      {events.length === 0 ? (
        <PageState state="empty" emptyTitle="Sem eventos no período" />
      ) : (
        events.map((e) => (
          <a key={e.id} href={e.href || '#'} className="block rounded border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface)]">
            <span className="text-[var(--muted)]">{e.date}</span> · <strong>{e.type}</strong> — {e.title}
          </a>
        ))
      )}
    </div>
  );
}

const CC_CATEGORIES = [
  'rh',
  'equipamentos',
  'manutencao',
  'limpeza',
  'marketing',
  'administrativo',
  'outro',
];

export function CostCentersPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    active: boolean;
  }> | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('administrativo');

  async function load() {
    try {
      setRows(await apiAdminCostCenters(accessToken));
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha centros de custo', 'error');
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="admin-cost-centers">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          void apiAdminCreateCostCenter(accessToken, { name, category })
            .then(() => {
              push('Centro criado');
              setName('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <Field label="Nome"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required /></Field>
        <Field label="Categoria">
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CC_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-end"><Button type="submit">Criar</Button></div>
      </form>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>
              {r.name} · {r.category || '—'} · {r.active ? 'ativo' : 'inativo'}
            </span>
            <span className="flex gap-2">
              <a className="text-xs text-[var(--primary)]" href={`/app/finance/payables?costCenterId=${r.id}`}>
                Despesas
              </a>
              <button
                type="button"
                className="text-xs"
                onClick={() =>
                  void apiAdminUpdateCostCenter(accessToken, r.id, {
                    category: r.category || 'outro',
                    active: !r.active,
                  }).then(load)
                }
              >
                Alternar
              </button>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => void apiAdminDeleteCostCenter(accessToken, r.id).then(load)}
              >
                Excluir
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const kinds = useMemo(
    () => [
      ['employees', 'Colaboradores'],
      ['assets', 'Patrimônio'],
      ['maintenance', 'Manutenção'],
      ['documents', 'Documentos'],
      ['incidents', 'Ocorrências'],
      ['costs', 'Centros de custo'],
    ] as const,
    [],
  );

  async function download(kind: string, label: string) {
    try {
      const csv = await apiAdminReport(accessToken, kind);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kind}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      push(`Relatório ${label} baixado`);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha relatório', 'error');
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="admin-reports">
      {kinds.map(([kind, label]) => (
        <Card key={kind}>
          <h3 className="movvo-title text-base">{label}</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">Exportação CSV</p>
          <Button className="mt-3" type="button" onClick={() => void download(kind, label)}>
            Baixar CSV
          </Button>
        </Card>
      ))}
    </div>
  );
}
