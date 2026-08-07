'use client';

import { useEffect, useState, useTransition } from 'react';
import type {
  BiAlert,
  BiGoal,
  BiInsight,
  CommercialInsight,
  ExecutiveDashboard,
  ForecastResult,
  HeatmapCell,
  KpiItem,
} from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { useAuthNav } from '@/components/auth/AuthNavProvider';
import { isProfessorOnly } from '@/config/navAccess';
import { biApi } from '../services/biApi';

function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExecutiveBiPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<ExecutiveDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = () =>
    biApi
      .executive(accessToken)
      .then(setData)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando executivo…</p>;

  const cards = [
    { label: 'Receita do dia', value: money(data.revenueDay) },
    { label: 'Receita do mês', value: money(data.revenueMonth) },
    { label: 'Receita do ano', value: money(data.revenueYear) },
    { label: 'MRR', value: money(data.mrr) },
    { label: 'Ticket médio', value: money(data.avgTicket) },
    { label: 'Churn', value: `${data.churn}%` },
    { label: 'Inadimplência', value: money(data.delinquency) },
    { label: 'Lucro estimado', value: money(data.profit) },
    { label: 'Caixa disponível', value: money(data.cashAvailable) },
    { label: 'Novos alunos', value: String(data.newStudents) },
    { label: 'Cancelamentos', value: String(data.cancellations) },
    { label: 'Frequência média', value: String(data.frequency) },
    { label: 'Ocupação', value: `${data.occupancy}%` },
  ];

  return (
    <div className="space-y-4" data-testid="bi-executive">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await biApi.syncWarehouse(accessToken);
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            })
          }
        >
          {pending ? 'Sincronizando…' : 'Sincronizar warehouse'}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} hover>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="mt-2 text-xl font-semibold text-[var(--text)]">{c.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function KpiBiPanel({ accessToken }: { accessToken: string }) {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .kpis(accessToken)
      .then(setKpis)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!kpis.length) return <p className="text-sm text-[var(--muted)]">Carregando KPIs…</p>;

  const categories = [...new Set(kpis.map((k) => k.category))];

  return (
    <div className="space-y-6" data-testid="bi-kpis">
      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="athena-title mb-3 text-sm uppercase tracking-wide">{cat}</h3>
          <Card>
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {kpis
                .filter((k) => k.category === cat)
                .map((k) => (
                  <li
                    key={k.code}
                    className="flex items-baseline justify-between gap-2 border-b border-[var(--border)] py-2 last:border-b-0"
                  >
                    <span className="text-sm text-[var(--muted)]">{k.name}</span>
                    <span className="font-medium text-[var(--text)]">
                      {k.unit === 'currency'
                        ? money(k.value)
                        : k.unit === 'percent'
                          ? `${k.value}%`
                          : k.value.toLocaleString('pt-BR')}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}

export function InsightsBiPanel({ accessToken }: { accessToken: string }) {
  const [insights, setInsights] = useState<BiInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .insights(accessToken, 'Gere recomendações')
      .then((r) => setInsights(r.insights))
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;

  return (
    <div className="space-y-3" data-testid="bi-insights">
      <h2 className="athena-title text-lg">Athena Insights</h2>
      {insights.map((i) => (
        <Card key={i.code}>
          <p className="text-xs uppercase text-[var(--muted)]">{i.severity}</p>
          <p className="mt-1 font-medium">{i.title}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Recomendação: {i.recommendation}</p>
        </Card>
      ))}
    </div>
  );
}

export function ForecastBiPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<ForecastResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .forecasts(accessToken)
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="bi-forecasts">
      {items.map((f) => (
        <Card key={f.type}>
          <p className="text-xs uppercase text-[var(--muted)]">{f.label}</p>
          <p className="mt-2 text-xl font-semibold">
            {f.unit === 'currency' ? money(f.value) : f.value.toLocaleString('pt-BR')}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">Confiança {f.confidence}%</p>
        </Card>
      ))}
    </div>
  );
}

export function HeatmapBiPanel({ accessToken }: { accessToken: string }) {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [type, setType] = useState('hours');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .heatmaps(accessToken, type)
      .then((r) => {
        setCells(r.cells);
        setNote(r.available ? null : r.reason || 'indisponível');
      })
      .catch((e: Error) => setError(e.message));
  }, [accessToken, type]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;

  return (
    <div className="space-y-3" data-testid="bi-heatmaps">
      <div className="flex flex-wrap gap-2">
        {['hours', 'days', 'modalities', 'equipment'].map((t) => (
          <Button key={t} type="button" variant={type === t ? 'primary' : 'secondary'} onClick={() => setType(t)}>
            {t}
          </Button>
        ))}
      </div>
      {note && <p className="text-sm text-[var(--muted)]">{note}</p>}
      <Card>
        <ul className="grid gap-1 sm:grid-cols-3 lg:grid-cols-4">
          {cells.map((c) => (
            <li key={c.key} className="flex justify-between border-b border-[var(--border)] py-1 text-sm">
              <span>{c.label}</span>
              <span className="font-medium">{c.value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

import { AthenaChat } from './AthenaChat';

export function ChatBiPanel({ accessToken }: { accessToken: string }) {
  return <AthenaChat accessToken={accessToken} />;
}

export function GoalsBiPanel({ accessToken }: { accessToken: string }) {
  const [goals, setGoals] = useState<BiGoal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = () =>
    biApi
      .goals(accessToken)
      .then(setGoals)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, [accessToken]);

  return (
    <div className="space-y-4" data-testid="bi-goals">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              const startDate = new Date();
              const end = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
              await biApi.createGoal(accessToken, {
                metric: 'revenue',
                targetValue: 100000,
                periodStart: startDate.toISOString().slice(0, 10),
                periodEnd: end.toISOString().slice(0, 10),
                label: 'Meta do mês',
              });
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          })
        }
      >
        Criar meta de receita
      </Button>
      {error && <p className="text-sm text-[var(--primary-hover)]">{error}</p>}
      {goals.map((g) => (
        <Card key={g.id}>
          <p className="font-medium">{g.label || g.metric}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {g.currentValue.toLocaleString('pt-BR')} / {g.targetValue.toLocaleString('pt-BR')}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded bg-[var(--border)]">
            <div className="h-full bg-[var(--primary)]" style={{ width: `${g.progressPct}%` }} />
          </div>
          <p className="mt-1 text-sm">{g.progressPct}%</p>
        </Card>
      ))}
    </div>
  );
}

export function AlertsBiPanel({ accessToken }: { accessToken: string }) {
  const [alerts, setAlerts] = useState<BiAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = () =>
    biApi
      .alerts(accessToken)
      .then(setAlerts)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, [accessToken]);

  return (
    <div className="space-y-3" data-testid="bi-alerts">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              await biApi.refreshAlerts(accessToken);
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          })
        }
      >
        Atualizar alertas
      </Button>
      {error && <p className="text-sm text-[var(--primary-hover)]">{error}</p>}
      {alerts.map((a) => (
        <Card key={a.id}>
          <p className="text-xs uppercase text-[var(--muted)]">{a.severity}</p>
          <p className="font-medium">{a.title}</p>
          <p className="mt-1 text-sm">{a.message}</p>
        </Card>
      ))}
    </div>
  );
}

export function CommercialBiPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<CommercialInsight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .commercial(accessToken)
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;

  return (
    <div className="space-y-3" data-testid="bi-commercial">
      {items.map((c) => (
        <Card key={c.campaignId}>
          <p className="font-medium">{c.name}</p>
          <p className="mt-1 text-sm">
            ROI {c.roiPct != null ? `${c.roiPct}%` : 'n/d'} · {'★'.repeat(c.stars)}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{c.recommendation}</p>
          {c.note && <p className="mt-1 text-xs text-[var(--muted)]">{c.note}</p>}
        </Card>
      ))}
      {!items.length && <p className="text-sm text-[var(--muted)]">Nenhuma campanha encontrada.</p>}
    </div>
  );
}

export function ReportsBiPanel({ accessToken }: { accessToken: string }) {
  const { auth } = useAuthNav();
  const professorOnly = isProfessorOnly(auth.roles);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const downloadDataUrl = (fileUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = filename;
    a.click();
  };

  return (
    <div className="space-y-3" data-testid="bi-reports">
      {professorOnly ? (
        <>
          <p className="text-sm text-[var(--muted)]">
            Exporte a lista dos alunos vinculados a você (professor responsável ou treinos
            publicados).
          </p>
          <Button
            type="button"
            disabled={pending}
            data-testid="export-my-students"
            onClick={() =>
              start(async () => {
                setError(null);
                try {
                  const job = await biApi.createExport(accessToken, {
                    format: 'csv',
                    source: 'my_students',
                  });
                  setMessage(
                    `Exportação de alunos: ${job.status} (${job.rowCount ?? 0} aluno(s))`,
                  );
                  if (job.fileUrl?.startsWith('data:')) {
                    downloadDataUrl(job.fileUrl, 'meus-alunos.csv');
                  }
                } catch (e) {
                  setError(e instanceof Error ? e.message : String(e));
                }
              })
            }
          >
            Exportar meus alunos (CSV)
          </Button>
        </>
      ) : (
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                const job = await biApi.createExport(accessToken, {
                  format: 'csv',
                  source: 'revenue',
                });
                setMessage(`Export ${job.format}: ${job.status} (${job.rowCount ?? 0} linhas)`);
                await biApi.connectors(accessToken);
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            })
          }
        >
          Exportar CSV
        </Button>
      )}
      {message && <p className="text-sm">{message}</p>}
      {error && <p className="text-sm text-[var(--primary-hover)]">{error}</p>}
      {!professorOnly && (
        <p className="text-xs text-[var(--muted)]">
          Power BI / Looker Studio: connectors stub (not_configured). PDF: stub://
        </p>
      )}
    </div>
  );
}
