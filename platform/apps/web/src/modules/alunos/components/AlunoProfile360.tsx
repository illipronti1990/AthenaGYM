'use client';

import type { Student360Summary } from '@movvo/shared';
import { formatCurrencyBRL } from '@movvo/ui';
import { Card } from '@movvo/ui';

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

export function AlunoProfile360({
  planName,
  trainerName,
  monthlyFee,
  summary,
}: {
  planName: string | null;
  trainerName: string | null;
  monthlyFee: number | null;
  summary: Student360Summary | null;
}) {
  const fee = summary?.monthlyFee ?? monthlyFee;
  const formatDate = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleDateString('pt-BR') : '—';

  return (
    <Card className="p-4" data-testid="student-profile-360">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Plano" value={planName || '—'} />
        <Metric label="Professor" value={trainerName || '—'} />
        <Metric
          label="Mensalidade"
          value={fee != null ? formatCurrencyBRL(fee) : '—'}
        />
        <Metric label="Próximo vencimento" value={formatDate(summary?.nextDueDate)} />
        <Metric
          label="Peso"
          value={summary?.weight != null ? `${summary.weight} kg` : '—'}
        />
        <Metric
          label="Altura"
          value={summary?.height != null ? `${summary.height} m` : '—'}
        />
        <Metric label="IMC" value={summary?.bmi != null ? String(summary.bmi) : '—'} />
        <Metric label="Último treino" value={formatDate(summary?.lastWorkoutAt)} />
        <Metric label="Último check-in" value={formatDate(summary?.lastCheckinAt)} />
        <Metric
          label="Financeiro em aberto"
          value={summary ? String(summary.openReceivables) : '—'}
        />
      </div>
    </Card>
  );
}
