'use client';

import { useEffect, useState } from 'react';
import type { OperationsDashboard } from '@movvo/shared';
import { Card, chartColors } from '@movvo/ui';
import { operationsApi } from '../services/operationsApi';

export function OccupancyDashboardPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<OperationsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const d = await operationsApi.occupancy(accessToken);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      }
    }
    load();
    const id = window.setInterval(load, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando ocupação…</p>;

  const cards = [
    ['Pessoas na academia', data.presentNow, chartColors.checkins],
    ['Entradas hoje', data.entriesToday, chartColors.revenue],
    ['Saídas', data.exitsToday, chartColors.workouts],
    ['Ocupação', `${data.occupancyPct}%`, chartColors.finance],
    ['Aulas em andamento', data.classesInProgress, chartColors.revenue],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, color]) => (
          <Card key={label} hover>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold" style={{ color }}>
              {value}
            </p>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="movvo-title mb-3 text-lg">Mapa de ocupação</h2>
        <Card>
          <ul className="space-y-4">
            {data.areas.map((a) => (
              <li key={a.area}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[var(--text)]">{a.area}</span>
                  <span className="text-[var(--gold)]">{a.occupancyPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, a.occupancyPct)}%`,
                      background: chartColors.checkins,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
