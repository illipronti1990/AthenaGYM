'use client';

import Link from 'next/link';
import type { DashboardRankingRow } from '@movvo/shared';
import { EmptyState } from '@movvo/ui';
import { Trophy } from 'lucide-react';

export function RankingWidget({ rows }: { rows: DashboardRankingRow[] }) {
  return (
    <div className="movvo-card h-full" data-testid="ranking-widget">
      <h3 className="movvo-h3 mb-3 inline-flex items-center gap-2 text-[var(--gold)]">
        <Trophy size={18} /> Ranking de professores
      </h3>
      {rows.length === 0 ? (
        <EmptyState
          title="Sem ranking ainda"
          description="Publique treinos e avaliações para gerar o ranking."
          action={
            <Link href="/app/workouts" className="movvo-btn movvo-btn-primary movvo-btn-sm">
              Ir para Treinos
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="movvo-table">
            <thead>
              <tr>
                <th>Professor</th>
                <th>Alunos*</th>
                <th>Avaliações</th>
                <th>Treinos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.trainerId}>
                  <td>{r.name}</td>
                  <td>{r.students}</td>
                  <td>{r.assessments}</td>
                  <td>{r.workouts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-[var(--muted)]">* treinos publicados no mês</p>
        </div>
      )}
    </div>
  );
}
