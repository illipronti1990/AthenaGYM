'use client';

import { useEffect, useState } from 'react';
import { Button, Card } from '@movvo/ui';
import { PageState } from '@/components/ux/PageState';
import { useToast } from '@/components/ui/Toast';
import { securityApi } from '@/services/securityApi';

const inputCls =
  'w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm';

export function SecurityDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [kpi, setKpi] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void securityApi
      .dashboard(accessToken)
      .then(setKpi)
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro dashboard', 'error');
        setKpi({});
      });
  }, [accessToken, push]);
  if (!kpi) return <PageState state="loading" skeleton="dashboard" />;
  const cards: Array<[string, unknown]> = [
    ['Logins OK (24h)', kpi.loginsSuccess24h],
    ['Logins falhos (24h)', kpi.loginsFailed24h],
    ['Usuários MFA', kpi.mfaEnrolledUsers],
    ['Sessões ativas', kpi.activeSessions],
    ['Auditorias (24h)', kpi.auditEvents24h],
    ['Eventos segurança (24h)', kpi.securityEvents24h],
    ['Lockouts (7d)', kpi.lockouts7d],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="security-dashboard">
      {cards.map(([label, value]) => (
        <Card key={label} className="p-4">
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{String(value ?? '—')}</p>
        </Card>
      ))}
    </div>
  );
}

export function SecuritySessionsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Array<Record<string, unknown>> | null>(null);
  const reload = () =>
    securityApi
      .sessions(accessToken)
      .then((r) => setItems(r.items))
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro sessões', 'error');
        setItems([]);
      });
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (!items) return <PageState state="loading" skeleton="table" />;
  return (
    <div className="space-y-3" data-testid="security-sessions">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            void securityApi
              .revokeAll(accessToken)
              .then(() => {
                push('Sessões encerradas', 'success');
                void reload();
              })
              .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
          }
        >
          Encerrar todas
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="p-2">Dispositivo</th>
              <th className="p-2">IP</th>
              <th className="p-2">Cidade</th>
              <th className="p-2">Último acesso</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={String(s.id)} className="border-b border-[var(--border)]">
                <td className="p-2">{String(s.device || s.browser || '—')}</td>
                <td className="p-2">{String(s.ip || '—')}</td>
                <td className="p-2">{String(s.city || '—')}</td>
                <td className="p-2">{String(s.lastSeenAt || '—')}</td>
                <td className="p-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void securityApi
                        .revokeSession(accessToken, String(s.id))
                        .then(() => {
                          push('Sessão encerrada', 'success');
                          void reload();
                        })
                        .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
                    }
                  >
                    Encerrar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length ? <p className="p-4 text-sm text-[var(--muted)]">Nenhuma sessão ativa.</p> : null}
      </div>
    </div>
  );
}

export function SecurityMfaPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [code, setCode] = useState('');
  const [enroll, setEnroll] = useState<Record<string, unknown> | null>(null);
  const reload = () =>
    securityApi
      .mfaStatus(accessToken)
      .then(setStatus)
      .catch((e) => push(e instanceof Error ? e.message : 'Erro MFA', 'error'));
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (!status) return <PageState state="loading" skeleton="form" />;
  return (
    <div className="max-w-lg space-y-4" data-testid="security-mfa">
      <Card className="space-y-2 p-4">
        <p className="text-sm">
          TOTP: {status.totpEnabled ? 'ativo' : 'inativo'} · E-mail OTP:{' '}
          {status.emailOtpEnabled ? 'ativo' : 'inativo'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() =>
              void securityApi
                .enrollTotp(accessToken)
                .then((r) => {
                  setEnroll(r);
                  push('Escaneie o QR no autenticador', 'success');
                })
                .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
            }
          >
            Ativar autenticador
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void securityApi
                .sendEmailOtp(accessToken)
                .then(() => push('Código enviado por e-mail', 'success'))
                .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
            }
          >
            Enviar OTP e-mail
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void securityApi
                .disableTotp(accessToken)
                .then(() => {
                  push('TOTP desativado', 'success');
                  void reload();
                })
                .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
            }
          >
            Desativar TOTP
          </Button>
        </div>
        {enroll?.qrCode ? (
          <div className="text-xs break-all text-[var(--muted)]">
            Secret: {String(enroll.secret || '')}
          </div>
        ) : null}
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="Código MFA"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            data-testid="mfa-code"
          />
          <Button
            type="button"
            onClick={() =>
              void securityApi
                .verifyTotp(accessToken, code)
                .then(() => {
                  push('TOTP verificado', 'success');
                  setCode('');
                  void reload();
                })
                .catch(() =>
                  void securityApi
                    .verifyEmailOtp(accessToken, code)
                    .then(() => {
                      push('OTP e-mail verificado', 'success');
                      setCode('');
                      void reload();
                    })
                    .catch((e) => push(e instanceof Error ? e.message : 'Código inválido', 'error')),
                )
            }
          >
            Verificar
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function SecurityAuditPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [module, setModule] = useState('');
  const [items, setItems] = useState<Array<Record<string, unknown>> | null>(null);
  useEffect(() => {
    const qs = module ? `module=${encodeURIComponent(module)}` : '';
    void securityApi
      .audit(accessToken, qs)
      .then((r) => setItems(r.items))
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro auditoria', 'error');
        setItems([]);
      });
  }, [accessToken, module, push]);
  if (!items) return <PageState state="loading" skeleton="table" />;
  return (
    <div className="space-y-3" data-testid="security-audit">
      <select className={inputCls} value={module} onChange={(e) => setModule(e.target.value)}>
        <option value="">Todos os módulos</option>
        {['auth', 'security', 'lgpd', 'finance', 'saas', 'platform', 'integrations', 'admin'].map(
          (m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ),
        )}
      </select>
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="p-2">Quando</th>
              <th className="p-2">Módulo</th>
              <th className="p-2">Ação</th>
              <th className="p-2">Entidade</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={String(row.id)} className="border-b border-[var(--border)]">
                <td className="p-2 whitespace-nowrap">{String(row.createdAt || '')}</td>
                <td className="p-2">{String(row.module || '')}</td>
                <td className="p-2">{String(row.action || '')}</td>
                <td className="p-2">{String(row.entity || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SecurityLgpdPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [requests, setRequests] = useState<Array<Record<string, unknown>> | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const reload = () =>
    securityApi
      .lgpdRequests(accessToken)
      .then((r) => setRequests(r.items))
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro LGPD', 'error');
        setRequests([]);
      });
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (!requests) return <PageState state="loading" skeleton="table" />;
  return (
    <div className="space-y-4" data-testid="security-lgpd">
      <Card className="space-y-2 p-4">
        <input
          className={inputCls}
          placeholder="UUID do titular (vazio = você)"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() =>
              void securityApi
                .exportData(accessToken, subjectId || undefined)
                .then(() => {
                  push('Exportação concluída', 'success');
                  void reload();
                })
                .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
            }
          >
            Exportar dados
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!subjectId) {
                push('Informe o UUID do titular', 'error');
                return;
              }
              void securityApi
                .anonymize(accessToken, subjectId)
                .then(() => {
                  push('Anonimização concluída', 'success');
                  void reload();
                })
                .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'));
            }}
          >
            Anonimizar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!subjectId) {
                push('Informe o UUID do titular', 'error');
                return;
              }
              void securityApi
                .erase(accessToken, subjectId)
                .then(() => {
                  push('Exclusão (soft) concluída', 'success');
                  void reload();
                })
                .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'));
            }}
          >
            Excluir
          </Button>
        </div>
      </Card>
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
              <th className="p-2">Tipo</th>
              <th className="p-2">Status</th>
              <th className="p-2">E-mail</th>
              <th className="p-2">Quando</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={String(r.id)} className="border-b border-[var(--border)]">
                <td className="p-2">{String(r.request_type)}</td>
                <td className="p-2">{String(r.status)}</td>
                <td className="p-2">{String(r.subject_email || '')}</td>
                <td className="p-2">{String(r.created_at || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SecurityRetentionPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Array<Record<string, unknown>> | null>(null);
  const reload = () =>
    securityApi
      .retention(accessToken)
      .then((r) => setItems(r.items))
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro retenção', 'error');
        setItems([]);
      });
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (!items) return <PageState state="loading" skeleton="table" />;
  return (
    <div className="space-y-3" data-testid="security-retention">
      {items.map((row) => (
        <Card key={String(row.resource)} className="flex flex-wrap items-center gap-3 p-4">
          <span className="min-w-[8rem] font-medium">{String(row.resource)}</span>
          <input
            className={`${inputCls} max-w-[8rem]`}
            type="number"
            min={30}
            defaultValue={Number(row.retainDays || 365)}
            onBlur={(e) => {
              const retainDays = Number(e.target.value);
              void securityApi
                .upsertRetention(accessToken, {
                  resource: row.resource,
                  retainDays,
                  active: true,
                })
                .then(() => push('Política salva', 'success'))
                .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
            }}
          />
          <span className="text-sm text-[var(--muted)]">dias</span>
        </Card>
      ))}
    </div>
  );
}
