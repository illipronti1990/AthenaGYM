'use client';

import { useEffect, useState } from 'react';
import type { BenchmarkResponse } from '@movvo/shared';
import { Card } from '@movvo/ui';
import { biApi } from '@/modules/bi/services/biApi';

export function BenchmarkClient({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .benchmark(accessToken, 'teacher')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  return (
    <Card data-testid="bi-benchmark">
      <p className="text-sm text-[var(--muted)]">Dimensão: {data.dimension}</p>
      <ul className="mt-3 space-y-2">
        {data.items.map((i) => (
          <li key={i.id} className="flex justify-between text-sm">
            <span>
              #{i.rank} {i.label}
            </span>
            <span className="font-medium">{i.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
