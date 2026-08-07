'use client';

import { useEffect, useState } from 'react';
import type { AccessLiveEvent } from '@athena/shared';
import { acessoApi } from '../services/acessoApi';

export function LiveAccessMonitor({ accessToken }: { accessToken: string }) {
  const [events, setEvents] = useState<AccessLiveEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await acessoApi.live(accessToken, 40);
        if (!cancelled) {
          setEvents(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar monitor');
      }
    }
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [accessToken]);

  return (
    <div className="space-y-3" data-testid="live-access-monitor">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {events.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum evento recente.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[10px] border border-[var(--border)] bg-[var(--card)]">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{e.studentName || e.studentId || '—'}</p>
                <p className="text-xs text-[var(--muted)]">
                  {e.method || '—'}
                  {e.partner ? ` · ${e.partner}` : ''}
                  {e.result === 'denied' && e.reasonLabel ? ` · ${e.reasonLabel}` : ''}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={
                    e.result === 'allowed'
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }
                >
                  {e.result === 'allowed' ? 'Liberado' : 'Negado'}
                </span>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(e.createdAt).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
