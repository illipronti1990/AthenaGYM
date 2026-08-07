'use client';

import { useEffect, useState } from 'react';
import { Card } from '@athena/ui';
import type { NpsDashboardView } from '../../services/crmApi';
import { crmApi } from '../../services/crmApi';
import { useToast } from '@/components/ui/Toast';

function scoreTone(score: number): string {
  if (score >= 50) return 'var(--success)';
  if (score >= 0) return 'var(--gold)';
  return 'var(--primary-hover)';
}

function responseLabel(score: number): string {
  if (score >= 9) return 'Promotor';
  if (score >= 7) return 'Neutro';
  return 'Detrator';
}

export function NpsSurvey({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [dash, setDash] = useState<NpsDashboardView | null>(null);

  useEffect(() => {
    crmApi
      .npsDashboard(accessToken)
      .then(setDash)
      .catch((e) => push(e instanceof Error ? e.message : 'Falha ao carregar NPS', 'error'));
  }, [accessToken, push]);

  const score = dash?.npsScore ?? dash?.score ?? null;
  const responses = dash?.responses ?? [];

  return (
    <div className="space-y-6" data-testid="nps-survey">
      {dash && score !== null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Score NPS</p>
            <p className="mt-2 text-4xl font-bold" style={{ color: scoreTone(score) }}>
              {score}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Promotores</p>
            <p className="mt-2 text-2xl font-bold text-[var(--success)]">{dash.promoters}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Detratores</p>
            <p className="mt-2 text-2xl font-bold text-[var(--primary-hover)]">{dash.detractors}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Respostas</p>
            <p className="mt-2 text-2xl font-bold text-[var(--text)]">
              {dash.totalResponses ?? responses.length}
            </p>
            {dash.passives != null && (
              <p className="mt-1 text-xs text-[var(--muted)]">{dash.passives} neutros</p>
            )}
          </Card>
        </div>
      )}

      {responses.length > 0 && (
        <ul className="athena-list text-sm">
          {responses.map((r, idx) => (
            <li key={r.id ?? idx} className="athena-list-item flex-col items-start gap-1">
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-[var(--text)]">
                  Nota {r.score} · {responseLabel(r.score)}
                </span>
                {r.createdAt && (
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              {r.comment && <p className="text-[var(--muted)]">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {dash && (dash.totalResponses ?? 0) === 0 && responses.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--muted)]">
          Nenhuma resposta NPS registrada.
        </p>
      )}
    </div>
  );
}
