'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button, Card } from '@athena/ui';
import { biApi } from '@/modules/bi/services/biApi';

type Risk = {
  studentId: string;
  studentName: string;
  score: number;
  chancePct?: number;
  label: string;
  reasons: string[];
  nextBestActions: Array<{ label?: string }>;
};

export function ChurnBiClient({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Risk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const load = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${API}/crm/risk`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`crm/risk ${res.status}`);
    setItems((await res.json()) as Risk[]);
  };

  useEffect(() => {
    load().catch((e: Error) => setError(e.message));
  }, [accessToken]);

  return (
    <div className="space-y-3" data-testid="bi-churn">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              await biApi.runPredictions(accessToken, 'churn');
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          })
        }
      >
        Recalcular risco
      </Button>
      {error && <p className="text-sm text-[var(--primary-hover)]">{error}</p>}
      {items.map((r) => (
        <Card key={r.studentId}>
          <p className="font-medium">
            {r.studentName || r.studentId.slice(0, 8)} — Chance {r.chancePct ?? Math.round(r.score * 100)}%
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{(r.reasons || []).join(' · ')}</p>
          <ul className="mt-2 text-sm">
            {(r.nextBestActions || []).map((a, i) => (
              <li key={i}>→ {a.label}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
