'use client';

import { useEffect, useState } from 'react';
import { marketingApi } from '@/modules/marketing/services/marketingApi';

export function CommercialAnalyticsPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<{
    totalLeads: number;
    byStatus: Record<string, number>;
    byUtm: Record<string, number>;
    demosScheduled: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    marketingApi
      .analytics(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, [accessToken]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-[var(--muted)]">Carregando…</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2" data-testid="commercial-analytics">
      <div className="rounded-xl border border-[var(--border)] p-4">
        <p className="text-sm text-[var(--muted)]">Total de leads</p>
        <p className="text-3xl font-semibold">{data.totalLeads}</p>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4">
        <p className="text-sm text-[var(--muted)]">Demonstrações agendadas</p>
        <p className="text-3xl font-semibold">{data.demosScheduled}</p>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-semibold mb-2">Por status</h3>
        <ul className="text-sm space-y-1">
          {Object.entries(data.byStatus).map(([k, v]) => (
            <li key={k} className="flex justify-between"><span>{k}</span><strong>{v}</strong></li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4">
        <h3 className="font-semibold mb-2">Origem (UTM)</h3>
        <ul className="text-sm space-y-1">
          {Object.entries(data.byUtm).map(([k, v]) => (
            <li key={k} className="flex justify-between"><span>{k}</span><strong>{v}</strong></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
