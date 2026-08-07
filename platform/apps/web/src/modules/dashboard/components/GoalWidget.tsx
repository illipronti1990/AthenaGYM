'use client';

import Link from 'next/link';
import type { DashboardGoal } from '@movvo/shared';
import { EmptyState } from '@movvo/ui';
import { formatKpi } from '../utils/format';

export function GoalWidget({ goals }: { goals: DashboardGoal[] }) {
  if (!goals.length) {
    return (
      <div className="movvo-card h-full" data-testid="goal-widget">
        <h3 className="movvo-h3 mb-4 text-[var(--gold)]">Metas do mês</h3>
        <EmptyState
          title="Nenhuma meta configurada"
          description="Defina metas de receita e matrículas para acompanhar o progresso."
          action={
            <Link href="/app/finance" className="movvo-btn movvo-btn-primary movvo-btn-sm">
              Ver Financeiro
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="movvo-card h-full" data-testid="goal-widget">
      <h3 className="movvo-h3 mb-4 text-[var(--gold)]">Metas do mês</h3>
      <ul className="space-y-4">
        {goals.map((g) => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
          return (
            <li key={g.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{g.label}</span>
                <span className="text-[var(--muted)]">
                  {formatKpi(g.current, g.format)} / {formatKpi(g.target, g.format)} · {pct}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
