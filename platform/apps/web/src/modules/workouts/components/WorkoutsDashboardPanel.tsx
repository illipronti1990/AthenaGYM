'use client';

import { useEffect, useState } from 'react';
import type { WorkoutsDashboard } from '@movvo/shared';
import { Card, chartColors } from '@movvo/ui';
import { workoutsApi } from '../services/workoutsApi';

export function WorkoutsDashboardPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<WorkoutsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workoutsApi
      .dashboard(accessToken)
      .then(setData)
      .catch((e) => {
        const raw = e instanceof Error ? e.message : 'erro';
        setError(
          /^Failed to fetch$/i.test(raw)
            ? 'Não foi possível conectar à API. Verifique se o servidor está online (porta 3001) e recarregue a página.'
            : raw,
        );
      });
  }, [accessToken]);

  if (error) return <p className="text-sm text-[var(--primary-hover)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  const cards = [
    ['Treinos ativos', data.activeWorkouts, chartColors.workouts],
    ['Concluídos hoje', data.completedToday, chartColors.revenue],
    ['Avaliações pendentes', data.pendingAssessments, chartColors.finance],
    ['Alunos sem treino', data.studentsWithoutCurrentWorkout, chartColors.checkins],
    [
      'Evolução média',
      `${data.averageEvolutionPct > 0 ? '+' : ''}${data.averageEvolutionPct}%`,
      chartColors.revenue,
    ],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value, color]) => (
        <Card key={label} hover>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
          <p className="mt-2 text-2xl font-semibold" style={{ color }}>
            {value}
          </p>
        </Card>
      ))}
    </div>
  );
}
