'use client';

import { useEffect, useState, useTransition } from 'react';
import type { ExecutiveDashboard, KpiItem, PredictionItem, ReportDefinition } from '@movvo/shared';
import { Button, Card, chartColors } from '@movvo/ui';
import { analyticsApi } from '../services/analyticsApi';

function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={up ? 'text-emerald-400' : 'text-[var(--primary-hover)]'}>
      {up ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
}

export function ExecutiveStrip({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<ExecutiveDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .executive(accessToken)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando executivo…</p>;

  const cards = [
    { label: 'Receita', value: money(data.revenue), delta: data.revenueDeltaPct, color: chartColors.revenue },
    { label: 'Lucro', value: money(data.profit), delta: data.profitDeltaPct, color: chartColors.workouts },
    { label: 'Churn', value: `${data.churn}%`, delta: data.churnDeltaPct, color: chartColors.finance },
    { label: 'Conversão', value: `${data.conversion}%`, delta: data.conversionDeltaPct, color: chartColors.checkins },
    {
      label: 'Check-ins',
      value: data.checkins.toLocaleString('pt-BR'),
      delta: data.checkinsDeltaPct,
      color: chartColors.revenue,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="executive-strip">
      {cards.map((c) => (
        <Card key={c.label} hover>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
          <p className="mt-2 text-xl font-semibold" style={{ color: c.color }}>
            {c.value}
          </p>
          <p className="mt-1 text-sm">
            <Delta value={c.delta} />
          </p>
        </Card>
      ))}
    </div>
  );
}

export function KpiGrid({ accessToken }: { accessToken: string }) {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi
      .kpis(accessToken)
      .then(setKpis)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!kpis.length) return <p className="text-sm text-[var(--muted)]">Carregando KPIs…</p>;

  const categories = [...new Set(kpis.map((k) => k.category))];

  return (
    <div className="space-y-6" data-testid="kpi-grid">
      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="movvo-title mb-3 text-sm uppercase tracking-wide">{cat}</h3>
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

export function ChurnPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<PredictionItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    analyticsApi
      .churn(accessToken)
      .then(setItems)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, [accessToken]);

  return (
    <div className="space-y-3" data-testid="churn-panel">
      <div className="flex items-center justify-between gap-2">
        <h2 className="movvo-title text-lg">Predição de churn</h2>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await analyticsApi.runPredictions(accessToken, 'churn');
                await load();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            })
          }
        >
          {pending ? 'Rodando…' : 'Rodar prediction engine'}
        </Button>
      </div>
      {error && <p className="text-sm text-[var(--primary-hover)]">{error}</p>}
      {!items.length && (
        <p className="text-sm text-[var(--muted)]">Nenhuma predição ainda. Execute o engine.</p>
      )}
      <ul className="movvo-list">
        {items.slice(0, 10).map((p) => (
          <li key={p.id} className="movvo-list-item flex-wrap">
            <div>
              <p className="font-medium text-[var(--text)]">
                {(p.features.name as string) || p.entityId.slice(0, 8)}
              </p>
              <p className="text-sm text-[var(--muted)]">{p.recommendation}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-[var(--gold)]">{Math.round(p.score * 100)}%</p>
              <p className="text-xs uppercase text-[var(--muted)]">{p.label}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsPanel({ accessToken }: { accessToken: string }) {
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [name, setName] = useState('DRE semanal');
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => analyticsApi.reports(accessToken).then(setReports).catch(() => setReports([]));

  useEffect(() => {
    void load();
  }, [accessToken]);

  return (
    <div className="space-y-4" data-testid="reports-panel">
      <h2 className="movvo-title text-lg">Report builder</h2>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            setMsg(null);
            try {
              await analyticsApi.createReport(accessToken, {
                name,
                source: 'revenue',
                fields: ['date', 'gross_revenue', 'net_revenue', 'profit'],
                shared: true,
              });
              setMsg('Relatório salvo');
              await load();
            } catch (err) {
              setMsg(err instanceof Error ? err.message : String(err));
            }
          });
        }}
      >
        <label className="text-sm text-[var(--muted)]">
          Nome
          <input
            className="movvo-input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={pending}>
          Salvar
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const job = await analyticsApi.createExport(accessToken, {
                format: 'csv',
                source: 'revenue',
              });
              setMsg(`Export ${job.format}: ${job.status} (${job.rowCount ?? 0} linhas)`);
            })
          }
        >
          Exportar CSV
        </Button>
      </form>
      {msg && <p className="text-sm text-[var(--muted)]">{msg}</p>}
      <ul className="movvo-list text-sm">
        {reports.map((r) => (
          <li key={r.id} className="movvo-list-item">
            {r.name} · {r.source} · {r.fields.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AiInsightsPanel({ accessToken }: { accessToken: string }) {
  const [question, setQuestion] = useState('Qual unidade teve maior inadimplência?');
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3" data-testid="ai-insights-panel">
      <h2 className="movvo-title text-lg">IA BI</h2>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const res = await analyticsApi.aiInsights(accessToken, question);
            setAnswer(res.answer);
          });
        }}
      >
        <input
          className="movvo-input min-w-[240px] flex-1"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          Perguntar
        </Button>
      </form>
      {answer && <p className="text-sm leading-relaxed text-[var(--text)]">{answer}</p>}
    </div>
  );
}
