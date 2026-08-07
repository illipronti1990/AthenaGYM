'use client';

import { useEffect, useState } from 'react';
import type { CompareResponse } from '@movvo/shared';
import { Card } from '@movvo/ui';
import { biApi } from '@/modules/bi/services/biApi';

export function CompareClient({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biApi
      .compare(accessToken, 'revenue', 'month')
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  return (
    <Card data-testid="bi-compare">
      <p className="text-sm text-[var(--muted)]">
        {data.metric} · {data.period}
      </p>
      <p className="mt-2 text-lg">
        Atual: {data.current.toLocaleString('pt-BR')} · Anterior: {data.previous.toLocaleString('pt-BR')}
      </p>
      <p className="mt-1">Delta: {data.deltaPct}%</p>
      {data.note && <p className="mt-2 text-xs text-[var(--muted)]">{data.note}</p>}
    </Card>
  );
}
