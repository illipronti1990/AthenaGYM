'use client';

import { useEffect, useState } from 'react';
import type { PresenceSnapshot } from '@movvo/shared';
import { acessoApi } from '../services/acessoApi';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function PresenceBoard({ accessToken }: { accessToken: string }) {
  const [snap, setSnap] = useState<PresenceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await acessoApi.presence(accessToken);
        if (!cancelled) {
          setSnap(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha na presença');
      }
    }
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!snap) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  return (
    <div className="space-y-6" data-testid="presence-board">
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Presentes" value={String(snap.presentCount)} />
        <Kpi label="Check-ins hoje" value={String(snap.checkinsToday)} />
        <Kpi label="Pico" value={String(snap.peakToday)} />
        <Kpi label="Tempo médio" value={formatDuration(snap.avgDurationSec)} />
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-[10px] border border-[var(--border)] bg-[var(--card)]">
        {snap.present.map((p) => (
          <li key={p.studentId} className="flex justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{p.fullName}</p>
              <p className="text-xs text-[var(--muted)]">
                {p.method}
                {p.partner ? ` · ${p.partner}` : ' · próprio'}
              </p>
            </div>
            <span className="text-[var(--muted)]">{formatDuration(p.durationSec)}</span>
          </li>
        ))}
        {snap.present.length === 0 ? (
          <li className="px-4 py-6 text-sm text-[var(--muted)]">Ninguém na academia agora.</li>
        ) : null}
      </ul>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="movvo-title mt-1 text-2xl">{value}</p>
    </div>
  );
}
