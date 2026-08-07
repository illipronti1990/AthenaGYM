'use client';

import { useEffect, useState } from 'react';
import type { ProgressSummary, Workout } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { EvolutionCharts } from '../evolucao/EvolutionCharts';

export function MinhaEvolucao({
  accessToken,
  studentId,
}: {
  accessToken: string;
  studentId: string;
}) {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      workoutsApi.progress(accessToken, studentId),
      workoutsApi.workouts(accessToken, studentId),
    ])
      .then(([p, w]) => {
        setProgress(p);
        setWorkouts(w);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken, studentId]);

  return (
    <div className="space-y-6" data-testid="minha-evolucao">
      <div className="grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded border border-[var(--border)] p-3">
          <div className="text-xs text-[var(--muted)]">Treino ativo</div>
          <div className="font-medium">
            {progress?.activeWorkout?.name || 'Nenhum'}
          </div>
        </div>
        <div className="rounded border border-[var(--border)] p-3">
          <div className="text-xs text-[var(--muted)]">Próxima avaliação</div>
          <div className="font-medium">{progress?.nextAssessmentDue || '—'}</div>
        </div>
        <div className="rounded border border-[var(--border)] p-3">
          <div className="text-xs text-[var(--muted)]">Último check-in</div>
          <div className="font-medium">
            {progress?.lastCheckinAt
              ? new Date(progress.lastCheckinAt).toLocaleString('pt-BR')
              : '—'}
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Meus treinos</h3>
        <ul className="divide-y divide-[var(--border)] text-sm">
          {workouts.slice(0, 8).map((w) => (
            <li key={w.id} className="flex justify-between py-2">
              <span>
                {w.name} · {w.status}
              </span>
              <span className="text-[var(--muted)]">{w.splitType}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Evolução</h3>
        <EvolutionCharts accessToken={accessToken} fixedStudentId={studentId} />
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
