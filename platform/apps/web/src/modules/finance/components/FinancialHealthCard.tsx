'use client';

import type { FinancialHealthScore } from '@athena/shared';
import { Card } from '@athena/ui';

const LEVEL_LABELS: Record<string, string> = {
  excelente: 'Excelente',
  positivo: 'Positivo',
  atencao: 'Atenção',
  critico: 'Crítico',
  controladas: 'Controladas',
};

const LEVEL_COLOR: Record<string, string> = {
  excelente: 'var(--success, #16a34a)',
  positivo: 'var(--gold)',
  atencao: 'var(--warning, #d97706)',
  critico: 'var(--danger, #dc2626)',
  controladas: 'var(--muted)',
};

function LevelChip({ label, level }: { label: string; level: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: LEVEL_COLOR[level] || 'var(--fg)' }}>
        {LEVEL_LABELS[level] || level}
      </p>
    </div>
  );
}

export function FinancialHealthCard({ health }: { health: FinancialHealthScore }) {
  const scoreColor =
    health.score >= 80
      ? LEVEL_COLOR.excelente
      : health.score >= 60
        ? LEVEL_COLOR.positivo
        : health.score >= 40
          ? LEVEL_COLOR.atencao
          : LEVEL_COLOR.critico;

  return (
    <Card hover data-testid="financial-health-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Saúde financeira</p>
          <p className="mt-1 text-4xl font-bold" style={{ color: scoreColor }}>
            {Math.round(health.score)}
            <span className="ml-1 text-base font-medium text-[var(--muted)]">/ 100</span>
          </p>
        </div>
        <div className="grid min-w-[240px] flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          <LevelChip label="Receita" level={String(health.revenue)} />
          <LevelChip label="Inadimplência" level={String(health.delinquency)} />
          <LevelChip label="Fluxo" level={String(health.cashflow)} />
          <LevelChip label="Despesas" level={String(health.expenses)} />
        </div>
      </div>
    </Card>
  );
}
