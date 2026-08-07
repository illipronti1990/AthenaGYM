'use client';

import { useEffect, useState } from 'react';
import type { SystemHealth } from '@movvo/shared';
import { polishApi } from '@/modules/polish/services/polishApi';
import { TableSkeleton } from '@/components/ui/Skeleton';

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-[var(--primary-hover)]'}`}
    />
  );
}

export function HealthPanel() {
  const [data, setData] = useState<SystemHealth | null>(null);

  useEffect(() => {
    void polishApi.health().then(setData).catch(() =>
      setData({
        status: 'down',
        service: 'movvo-platform-api',
        version: '?',
        timestamp: new Date().toISOString(),
        checks: {
          api: { status: 'down' },
          database: { status: 'down' },
          supabase: { status: 'down' },
          storage: { status: 'down' },
          worker: { status: 'unknown' },
        },
      }),
    );
  }, []);

  if (!data) return <TableSkeleton rows={5} />;

  const rows = [
    { label: 'API', status: data.checks.api.status },
    { label: 'Banco', status: data.checks.database.status },
    { label: 'Supabase', status: data.checks.supabase.status },
    { label: 'Storage', status: data.checks.storage.status },
    { label: 'Workers', status: data.checks.worker.status },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Status geral:{' '}
        <strong className="text-[var(--gold)]">{data.status}</strong> · v{data.version}
      </p>
      <ul className="movvo-list">
        {rows.map((r) => (
          <li key={r.label} className="movvo-list-item text-sm">
            <span className="text-[var(--text)]">{r.label}</span>
            <span className="flex items-center gap-2 text-[var(--muted)]">
              <Dot ok={r.status === 'ok'} />
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
