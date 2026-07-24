'use client';

import { useEffect, useState } from 'react';
import type { OperationsDashboard } from '@athenas/shared';
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

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Carregando ocupação…</p>;

  const cards = [
    ['Pessoas na academia', data.presentNow],
    ['Entradas hoje', data.entriesToday],
    ['Saídas', data.exitsToday],
    ['Ocupação', `${data.occupancyPct}%`],
    ['Aulas em andamento', data.classesInProgress],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="border-b border-zinc-200 pb-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Mapa de ocupação</h2>
        <ul className="space-y-3">
          {data.areas.map((a) => (
            <li key={a.area}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-zinc-800">{a.area}</span>
                <span className="text-zinc-600">{a.occupancyPct}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-100">
                <div
                  className="h-2 bg-[#A3001B] transition-all"
                  style={{ width: `${Math.min(100, a.occupancyPct)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
