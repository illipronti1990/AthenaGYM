'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button, Card } from '@athena/ui';
import { PageState } from '@/components/ux/PageState';
import { useToast } from '@/components/ui/Toast';
import { saasApi } from '@/services/saasApi';

const inputCls =
  'w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm';

export function SaasDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [kpi, setKpi] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void saasApi
      .dashboard(accessToken)
      .then(setKpi)
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro dashboard', 'error');
        setKpi({});
      });
  }, [accessToken, push]);
  if (!kpi) return <PageState state="loading" skeleton="dashboard" />;
  const cards = [
    ['Empresas ativas', kpi.companiesActive],
    ['Trials', kpi.companiesTrial],
    ['MRR', Number(kpi.mrr || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
    ['Churn', `${(Number(kpi.churn || 0) * 100).toFixed(1)}%`],
    ['Conversão', `${(Number(kpi.conversion || 0) * 100).toFixed(1)}%`],
    ['Integrações', kpi.integrationsActive],
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="saas-dashboard">
      {cards.map(([l, v]) => (
        <Card key={l}>
          <p className="text-xs text-[var(--muted)]">{l}</p>
          <p className="athena-title mt-1 text-2xl">{String(v ?? 0)}</p>
        </Card>
      ))}
    </div>
  );
}

export function TenantsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [planCode, setPlanCode] = useState('start');

  async function load() {
    try {
      setRows(await saasApi.tenants(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro', 'error');
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  if (!rows) return <PageState state="loading" />;

  return (
    <div className="space-y-4" data-testid="saas-tenants">
      <form
        className="grid gap-3 rounded-lg border border-[var(--border)] p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void saasApi
            .createTenant(accessToken, { name, document, planCode })
            .then(() => {
              push('Tenant criado');
              setName('');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <input className={inputCls} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required data-testid="tenant-name" />
        <input className={inputCls} placeholder="CNPJ" value={document} onChange={(e) => setDocument(e.target.value)} />
        <select className={inputCls} value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
          <option value="start">Start</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <Button type="submit">Cadastrar</Button>
      </form>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)]">
            <th className="py-2 text-left">Nome</th>
            <th className="py-2 text-left">Plano</th>
            <th className="py-2 text-left">Status</th>
            <th className="py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={String(r.id)} className="border-b border-[var(--border)]/50">
              <td className="py-2">
                <a className="text-[var(--primary)]" href={`/app/platform/tenants/${r.id}/branding`}>
                  {String(r.tradeName || r.name)}
                </a>
              </td>
              <td className="py-2">{String(r.planCode || '—')}</td>
              <td className="py-2">{String(r.saasStatus)}</td>
              <td className="py-2 space-x-2">
                <button type="button" className="text-xs" onClick={() => void saasApi.activateTenant(accessToken, String(r.id)).then(load)}>
                  Ativar
                </button>
                <button type="button" className="text-xs text-amber-700" onClick={() => void saasApi.suspendTenant(accessToken, String(r.id)).then(load)}>
                  Suspender
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TenantBrandingPanel({
  accessToken,
  tenantId,
}: {
  accessToken: string;
  tenantId: string;
}) {
  const { push } = useToast();
  const [hostname, setHostname] = useState('');
  const [domains, setDomains] = useState<Array<Record<string, unknown>>>([]);
  const [primary, setPrimary] = useState('#B10018');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [theme, setTheme] = useState('light');

  async function load() {
    try {
      setDomains(await saasApi.domains(accessToken, tenantId));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro domains', 'error');
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, tenantId]);

  return (
    <div className="space-y-4" data-testid="saas-branding">
      <Card>
        <h3 className="athena-title text-base">White label</h3>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            void saasApi
              .updateTenant(accessToken, tenantId, {
                primaryColor: primary,
                fontFamily,
                theme,
              })
              .then(() => push('Branding salvo'))
              .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
          }}
        >
          <input className={inputCls} value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="Cor primária" />
          <input className={inputCls} value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} placeholder="Fonte" />
          <select className={inputCls} value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <Button type="submit">Salvar branding</Button>
        </form>
      </Card>
      <Card>
        <h3 className="athena-title text-base">Domínios (DNS + SSL)</h3>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void saasApi
              .addDomain(accessToken, tenantId, hostname)
              .then(() => {
                setHostname('');
                push('Domínio adicionado — configure TXT');
                return load();
              })
              .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
          }}
        >
          <input className={inputCls} value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="app.academia.com.br" required />
          <Button type="submit">Add</Button>
        </form>
        <ul className="mt-3 space-y-2 text-sm">
          {domains.map((d) => (
            <li key={String(d.id)} className="flex justify-between gap-2 rounded border border-[var(--border)] px-3 py-2">
              <span>
                {String(d.hostname)} · DNS {String(d.dnsStatus)} · SSL {String(d.sslStatus)}
                <br />
                <span className="text-xs text-[var(--muted)]">TXT: {String(d.verificationToken)}</span>
              </span>
              <Button type="button" variant="secondary" onClick={() => void saasApi.verifyDomain(accessToken, String(d.id)).then(load)}>
                Verificar
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function PlansPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [plans, setPlans] = useState<Array<Record<string, unknown>> | null>(null);
  useEffect(() => {
    void saasApi
      .plans(accessToken)
      .then(setPlans)
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro', 'error');
        setPlans([]);
      });
  }, [accessToken, push]);
  if (!plans) return <PageState state="loading" />;
  return (
    <div className="grid gap-3 md:grid-cols-3" data-testid="saas-plans">
      {plans.map((p) => (
        <Card key={String(p.id)}>
          <h3 className="athena-title text-lg">{String(p.name)}</h3>
          <p className="text-sm text-[var(--muted)]">{String(p.description || '')}</p>
          <p className="mt-2 text-xl">
            {Number(p.priceMonthly || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            <span className="text-sm text-[var(--muted)]">/mês</span>
          </p>
          <ul className="mt-3 text-xs text-[var(--muted)]">
            {Object.entries((p.limits as Record<string, number | null>) || {}).map(([k, v]) => (
              <li key={k}>
                {k}: {v == null ? '∞' : v}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Features: {Object.entries((p.features as Record<string, boolean>) || {})
              .filter(([, en]) => en)
              .map(([k]) => k)
              .join(', ')}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function BillingPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [sub, setSub] = useState<Record<string, unknown> | null | undefined>(undefined);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([]);
  async function load() {
    try {
      const [s, inv] = await Promise.all([
        saasApi.subscription(accessToken),
        saasApi.invoices(accessToken),
      ]);
      setSub((s as Record<string, unknown>) || null);
      setInvoices(inv as Array<Record<string, unknown>>);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro billing', 'error');
      setSub(null);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (sub === undefined) return <PageState state="loading" />;
  return (
    <div className="space-y-4" data-testid="saas-billing">
      <Card>
        <h3 className="athena-title text-base">Assinatura</h3>
        <p className="mt-1 text-sm">{sub ? `${String(sub.planCode || sub.planId)} · ${String(sub.status)}` : 'Sem assinatura'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" onClick={() => void saasApi.subscribe(accessToken, { planCode: 'pro' }).then(load)}>
            Assinar Pro (stub)
          </Button>
          <Button type="button" variant="secondary" onClick={() => void saasApi.changePlan(accessToken, { planCode: 'enterprise', direction: 'upgrade' }).then(load)}>
            Upgrade
          </Button>
          <Button type="button" variant="secondary" onClick={() => void saasApi.renew(accessToken, {}).then(load)}>
            Renovar
          </Button>
          <Button type="button" variant="danger" onClick={() => void saasApi.cancel(accessToken, { reason: 'ops' }).then(load)}>
            Cancelar
          </Button>
        </div>
      </Card>
      <Card>
        <h3 className="athena-title text-base">Faturas</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {invoices.map((i) => (
            <li key={String(i.id)}>
              {String(i.number)} · {String(i.status)} · {Number(i.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function LicensesPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<{
    entitlements?: { limits: Record<string, number | null>; usage: Record<string, number> };
    alerts?: Array<{ key: string; used: number; limit: number | null; over: boolean }>;
  } | null>(null);
  useEffect(() => {
    void saasApi
      .limits(accessToken)
      .then((r) => setData(r as typeof data))
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro', 'error');
        setData({});
      });
  }, [accessToken, push]);
  if (!data) return <PageState state="loading" />;
  const lim = data.entitlements?.limits || {};
  const use = data.entitlements?.usage || {};
  return (
    <div className="space-y-3" data-testid="saas-licenses">
      {Object.keys(lim).map((k) => (
        <Card key={k}>
          <p className="text-sm">
            {k}: {use[k] || 0} / {lim[k] == null ? '∞' : lim[k]}
            {(data.alerts || []).find((a) => a.key === k && a.over) ? (
              <span className="ml-2 text-amber-700">Limite atingido</span>
            ) : null}
          </p>
        </Card>
      ))}
    </div>
  );
}

export function PortalPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tickets, setTickets] = useState<Array<Record<string, unknown>>>([]);
  async function load() {
    try {
      setTickets((await saasApi.tickets(accessToken)) as Array<Record<string, unknown>>);
    } catch {
      setTickets([]);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  return (
    <div className="space-y-4" data-testid="saas-portal">
      <BillingPanel accessToken={accessToken} />
      <LicensesPanel accessToken={accessToken} />
      <Card>
        <h3 className="athena-title text-base">Abrir chamado</h3>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void saasApi
              .createTicket(accessToken, { subject, body })
              .then(() => {
                push('Chamado aberto');
                setSubject('');
                setBody('');
                return load();
              })
              .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
          }}
        >
          <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" required />
          <textarea className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Descrição" required />
          <Button type="submit">Enviar</Button>
        </form>
        <ul className="mt-3 text-sm">
          {tickets.map((t) => (
            <li key={String(t.id)}>
              {String(t.subject)} · {String(t.status)}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function ApiKeysPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  async function load() {
    try {
      setRows((await saasApi.clients(accessToken)) as Array<Record<string, unknown>>);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro', 'error');
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (!rows) return <PageState state="loading" />;
  return (
    <div className="space-y-4" data-testid="saas-api-keys">
      {secret ? (
        <Card>
          <p className="text-sm text-amber-800">Guarde a chave privada (exibida uma vez):</p>
          <code className="mt-1 block break-all text-xs">{secret}</code>
        </Card>
      ) : null}
      <Button
        type="button"
        onClick={() =>
          void saasApi
            .createClient(accessToken, { name: 'App key', scopes: ['students.read'], environment: 'production' })
            .then((r) => {
              const created = r as { clientSecret?: string };
              setSecret(created.clientSecret || null);
              push('Chave criada');
              return load();
            })
            .catch((e) => push(e instanceof Error ? e.message : 'Erro', 'error'))
        }
      >
        Nova API key
      </Button>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={String(r.id)} className="flex justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>
              {String(r.name || r.clientId)} · {String(r.status)} · pública: {String(r.clientId)}
            </span>
            <span className="space-x-2">
              <button type="button" className="text-xs" onClick={() => void saasApi.rotateClient(accessToken, String(r.id)).then((x) => { setSecret((x as { clientSecret?: string }).clientSecret || null); return load(); })}>
                Rotacionar
              </button>
              <button type="button" className="text-xs text-red-600" onClick={() => void saasApi.revokeClient(accessToken, String(r.id)).then(load)}>
                Revogar
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WebhooksPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null);
  const [url, setUrl] = useState('https://example.com/webhook');
  async function load() {
    try {
      setRows((await saasApi.webhooks(accessToken)) as Array<Record<string, unknown>>);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro', 'error');
      setRows([]);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);
  if (!rows) return <PageState state="loading" />;
  return (
    <div className="space-y-4" data-testid="saas-webhooks">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void saasApi
            .createWebhook(accessToken, {
              url,
              events: ['student.created', 'payment.received', 'enrollment.created'],
            })
            .then(() => {
              push('Webhook criado');
              return load();
            })
            .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
        }}
      >
        <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit">Criar</Button>
      </form>
      <ul className="space-y-2 text-sm">
        {rows.map((r) => (
          <li key={String(r.id)} className="flex justify-between rounded border border-[var(--border)] px-3 py-2">
            <span>
              {String(r.url)} · {String(r.status)}
            </span>
            <button
              type="button"
              className="text-xs"
              onClick={() =>
                void saasApi
                  .patchWebhook(accessToken, String(r.id), {
                    status: r.status === 'active' ? 'paused' : 'active',
                  })
                  .then(load)
              }
            >
              Alternar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketplaceSaasPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [plugins, setPlugins] = useState<Array<Record<string, unknown>> | null>(null);
  useEffect(() => {
    void saasApi
      .plugins(accessToken)
      .then((p) => setPlugins(p as Array<Record<string, unknown>>))
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Erro', 'error');
        setPlugins([]);
      });
  }, [accessToken, push]);
  if (!plugins) return <PageState state="loading" />;
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="saas-marketplace">
      {plugins.map((p) => (
        <Card key={String(p.id)}>
          <h3 className="athena-title text-base">{String(p.name)}</h3>
          <p className="text-xs text-[var(--muted)]">{String(p.publisher || 'oficial')} · {String(p.slug)}</p>
          <p className="mt-2 text-sm">{String(p.description || '')}</p>
        </Card>
      ))}
    </div>
  );
}

export function FeatureFlagsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [tenantId, setTenantId] = useState('11111111-1111-1111-1111-111111111111');
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  useEffect(() => {
    void saasApi
      .entitlements(accessToken, tenantId)
      .then((e) => setFlags(((e as { flags?: Record<string, boolean> }).flags) || {}))
      .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'));
  }, [accessToken, tenantId, push]);
  return (
    <div className="space-y-3" data-testid="saas-flags">
      <input className={inputCls} value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
      {Object.entries(flags).map(([k, en]) => (
        <label key={k} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={en}
            onChange={(e) =>
              void saasApi
                .setFeature(accessToken, tenantId, { flagKey: k, enabled: e.target.checked })
                .then(() => setFlags((f) => ({ ...f, [k]: e.target.checked })))
                .catch((err) => push(err instanceof Error ? err.message : 'Erro', 'error'))
            }
          />
          {k}
        </label>
      ))}
    </div>
  );
}

export function SaasReportsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  async function dl(kind: string) {
    try {
      const csv = await saasApi.report(accessToken, kind);
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${kind}.csv`;
      a.click();
      push('Download ok');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Erro', 'error');
    }
  }
  return (
    <div className="grid gap-3 sm:grid-cols-3" data-testid="saas-reports">
      {['tenants', 'subscriptions', 'invoices'].map((k) => (
        <Card key={k}>
          <h3 className="athena-title text-base">{k}</h3>
          <Button className="mt-2" type="button" onClick={() => void dl(k)}>
            CSV
          </Button>
        </Card>
      ))}
    </div>
  );
}
