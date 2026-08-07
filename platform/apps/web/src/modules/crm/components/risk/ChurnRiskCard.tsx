'use client';

import { useEffect, useState } from 'react';
import { Button, Card } from '@athena/ui';
import type { ChurnRisk } from '../../services/crmApi';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

interface Props {
  accessToken: string;
  preview?: boolean;
}

function riskValue(r: ChurnRisk): number {
  return r.riskScore ?? r.score ?? 0;
}

function riskName(r: ChurnRisk): string {
  return r.fullName || r.studentName || r.studentId.slice(0, 8);
}

export function ChurnRiskCard({ accessToken, preview = false }: Props) {
  const { push } = useToast();
  const [risks, setRisks] = useState<ChurnRisk[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await crmApi.riskList(accessToken);
      const sorted = [...data].sort((a, b) => riskValue(b) - riskValue(a));
      setRisks(preview ? sorted.slice(0, 5) : sorted);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar risco', 'error');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await crmApi.refreshRisk(accessToken);
      await load();
      push('Risco atualizado');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao atualizar risco', 'error');
    } finally {
      setRefreshing(false);
    }
  }

  function riskColor(pct: number): string {
    if (pct >= 70) return 'var(--primary-hover)';
    if (pct >= 40) return 'var(--gold)';
    return 'var(--success)';
  }

  return (
    <Card data-testid="churn-risk-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="athena-title text-sm">Risco de churn</h2>
        {!preview && (
          <Button variant="secondary" onClick={() => void onRefresh()} disabled={refreshing}>
            {refreshing ? 'Atualizando…' : 'Atualizar'}
          </Button>
        )}
      </div>
      {risks.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum aluno em risco identificado.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {risks.map((r) => {
            const raw = riskValue(r);
            const score = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
            return (
              <li key={r.studentId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 truncate text-[var(--text)]">{riskName(r)}</span>
                  <span className="font-semibold" style={{ color: riskColor(score) }}>
                    {score}%
                  </span>
                </div>
                {r.reasons && r.reasons.length > 0 && (
                  <p className="text-xs text-[var(--muted)]">{r.reasons.slice(0, 2).join(' · ')}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
