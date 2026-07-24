'use client';

import { useEffect, useState } from 'react';
import type { WorkoutsDashboard } from '@athenas/shared';
import { workoutsApi } from '../services/workoutsApi';

export function WorkoutsDashboardPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<WorkoutsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workoutsApi
      .dashboard(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-zinc-500">Carregando…</p>;

  const cards = [
    ['Treinos ativos', data.activeWorkouts],
    ['Concluídos hoje', data.completedToday],
    ['Avaliações pendentes', data.pendingAssessments],
    ['Alunos sem treino', data.studentsWithoutCurrentWorkout],
    ['Evolução média', `${data.averageEvolutionPct > 0 ? '+' : ''}${data.averageEvolutionPct}%`],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([label, value]) => (
        <div key={label} className="border-b border-zinc-200 pb-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
