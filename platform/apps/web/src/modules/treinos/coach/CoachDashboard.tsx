'use client';

import { useEffect, useState } from 'react';
import type { CoachDashboard } from '@athena/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';

export function CoachDashboardPanel({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<CoachDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workoutsApi
      .coachDashboard(accessToken)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Carregando…</p>;

  return (
    <div className="space-y-6" data-testid="coach-dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Alunos ativos" value={data.activeStudents} />
        <Kpi label="Avaliações pendentes" value={data.pendingAssessments} />
        <Kpi label="Treinos vencidos" value={data.expiredWorkouts} />
        <Kpi label="Evolução média %" value={data.averageEvolutionPct} />
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Agenda do dia</h3>
        <ul className="divide-y divide-[var(--border)] text-sm">
          {(data.agendaToday || []).length ? (
            data.agendaToday.map((a) => (
              <li key={a.id} className="py-2">
                {new Date(a.startAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {a.title} ({a.type})
              </li>
            ))
          ) : (
            <li className="py-2 text-[var(--muted)]">Sem compromissos hoje</li>
          )}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Top professores</h3>
        <ul className="text-sm">
          {(data.topTrainers || []).map((t) => (
            <li key={t.trainerId}>
              {t.fullName}: {t.workoutsPublished} treinos
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[var(--border)] p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
