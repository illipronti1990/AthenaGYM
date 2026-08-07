'use client';

import { useEffect, useState } from 'react';
import { Card } from '@movvo/ui';
import type { ChurnRisk } from '../../services/crmApi';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

function riskName(r: ChurnRisk): string {
  return r.fullName || r.studentName || r.studentId.slice(0, 8);
}

function actionLabel(action: { action?: string; type?: string; label?: string } | string): string {
  if (typeof action === 'string') return action;
  return action.label || action.action || action.type || 'Ação sugerida';
}

function collectActions(r: ChurnRisk): string[] {
  const fromList = (r.nextBestActions || []).map(actionLabel).filter(Boolean);
  if (fromList.length) return fromList;
  if (r.nextBestAction) return [r.nextBestAction];
  return [];
}

export function NextBestActionList({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [risks, setRisks] = useState<ChurnRisk[]>([]);

  useEffect(() => {
    crmApi
      .riskList(accessToken)
      .then(setRisks)
      .catch((e) => push(e instanceof Error ? e.message : 'Falha ao carregar ações', 'error'));
  }, [accessToken, push]);

  const withActions = risks.filter((r) => collectActions(r).length > 0);

  return (
    <Card data-testid="next-best-action-list">
      <h2 className="movvo-title mb-3 text-sm">Próximas ações sugeridas</h2>
      {withActions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhuma ação sugerida no momento.</p>
      ) : (
        <ul className="space-y-3 text-sm">
          {withActions.map((r) => (
            <li key={r.studentId} className="border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
              <p className="font-medium text-[var(--text)]">{riskName(r)}</p>
              <ul className="mt-1 space-y-1 text-[var(--muted)]">
                {collectActions(r).map((label) => (
                  <li key={label}>• {label}</li>
                ))}
              </ul>
              {r.reasons && r.reasons.length > 0 && (
                <p className="mt-1 text-xs text-[var(--muted)]">{r.reasons.join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
