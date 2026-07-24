'use client';

import { useEffect, useState, useTransition } from 'react';
import type { ExecutiveDashboard, KpiItem, PredictionItem, ReportDefinition } from '@athenas/shared';
import { analyticsApi } from '../services/analyticsApi';

function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={up ? 'text-emerald-700' : 'text-rose-700'}>
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

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Carregando executivo…</p>;

  const cards = [
    { label: 'Receita', value: money(data.revenue), delta: data.revenueDeltaPct },
    { label: 'Lucro', value: money(data.profit), delta: data.profitDeltaPct },
    { label: 'Churn', value: `${data.churn}%`, delta: data.churnDeltaPct },
    { label: 'Conversão', value: `${data.conversion}%`, delta: data.conversionDeltaPct },
    { label: 'Check-ins', value: data.checkins.toLocaleString('pt-BR'), delta: data.checkinsDeltaPct },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="executive-strip">
      {cards.map((c) => (
        <div key={c.label} className="border-b border-zinc-200 pb-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{c.label}</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{c.value}</p>
          <p className="text-sm">
            <Delta value={c.delta} />
          </p>
        </div>
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

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!kpis.length) return <p className="text-sm text-zinc-500">Carregando KPIs…</p>;

  const categories = [...new Set(kpis.map((k) => k.category))];

  return (
    <div className="space-y-6" data-testid="kpi-grid">
      {categories.map((cat) => (
        <section key={cat}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">{cat}</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {kpis
              .filter((k) => k.category === cat)
              .map((k) => (
                <li key={k.code} className="border-b border-zinc-100 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-zinc-700">{k.name}</span>
                    <span className="font-medium">
                      {k.unit === 'currency'
                        ? money(k.value)
                        : k.unit === 'percent'
                          ? `${k.value}%`
                          : k.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </li>
              ))}
          </ul>
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
        <h2 className="text-lg font-semibold">Predição de churn</h2>
        <button
          type="button"
          disabled={pending}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:border-[#A3001B]"
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
        </button>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {!items.length && <p className="text-sm text-zinc-500">Nenhuma predição ainda. Execute o engine.</p>}
      <ul className="divide-y divide-zinc-100">
        {items.slice(0, 10).map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium">
                {(p.features.name as string) || p.entityId.slice(0, 8)}
              </p>
              <p className="text-sm text-zinc-600">{p.recommendation}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-[#A3001B]">{Math.round(p.score * 100)}%</p>
              <p className="text-xs uppercase text-zinc-500">{p.label}</p>
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
      <h2 className="text-lg font-semibold">Report builder</h2>
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
        <label className="text-sm">
          Nome
          <input
            className="mt-1 block rounded border border-zinc-300 px-2 py-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-[#A3001B] px-3 py-1.5 text-sm text-white"
        >
          Salvar
        </button>
        <button
          type="button"
          disabled={pending}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
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
        </button>
      </form>
      {msg && <p className="text-sm text-zinc-600">{msg}</p>}
      <ul className="text-sm">
        {reports.map((r) => (
          <li key={r.id} className="border-b border-zinc-100 py-2">
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
      <h2 className="text-lg font-semibold">IA BI</h2>
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
          className="min-w-[240px] flex-1 rounded border border-zinc-300 px-2 py-1.5 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-[#A3001B] px-3 py-1.5 text-sm text-white"
        >
          Perguntar
        </button>
      </form>
      {answer && <p className="text-sm leading-relaxed text-zinc-700">{answer}</p>}
    </div>
  );
}
