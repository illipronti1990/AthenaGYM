'use client';

import { useEffect, useState } from 'react';
import type { Checkin } from '@athena/shared';
import { acessoApi } from '../services/acessoApi';

export function AccessAgendaTimeline({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<(Checkin & { studentName?: string | null })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    acessoApi
      .agenda(accessToken)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;

  return (
    <ul className="divide-y divide-[var(--border)] rounded-[10px] border border-[var(--border)] bg-[var(--card)]" data-testid="access-agenda">
      {items.map((i) => (
        <li key={i.id} className="flex justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{i.studentName || i.studentId}</p>
            <p className="text-xs text-[var(--muted)]">
              {i.method}
              {i.partner ? ` · ${i.partner}` : ' · próprio'} · {i.direction}
            </p>
          </div>
          <span className="text-[var(--muted)]">
            {new Date(i.createdAt).toLocaleTimeString('pt-BR')}
          </span>
        </li>
      ))}
      {items.length === 0 ? (
        <li className="px-4 py-6 text-sm text-[var(--muted)]">Sem check-ins no período.</li>
      ) : null}
    </ul>
  );
}
