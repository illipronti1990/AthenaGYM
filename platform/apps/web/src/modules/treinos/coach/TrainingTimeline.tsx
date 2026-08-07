'use client';

import { useEffect, useState } from 'react';
import type { TrainingTimelineItem } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';

export function TrainingTimeline({
  accessToken,
  fixedStudentId,
}: {
  accessToken: string;
  fixedStudentId?: string;
}) {
  const [studentId, setStudentId] = useState(fixedStudentId || '');
  const [items, setItems] = useState<TrainingTimelineItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fixedStudentId) setStudentId(fixedStudentId);
  }, [fixedStudentId]);

  useEffect(() => {
    if (!studentId) return;
    workoutsApi
      .trainingTimeline(accessToken, studentId)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken, studentId]);

  return (
    <div className="space-y-4" data-testid="training-timeline">
      {!fixedStudentId ? (
        <AlunoSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ol className="space-y-3 border-l border-[var(--border)] pl-4 text-sm">
        {items.map((it) => (
          <li key={it.id}>
            <div className="text-xs text-[var(--muted)]">
              {new Date(it.at).toLocaleString('pt-BR')} · {it.kind}
            </div>
            <div className="font-medium">{it.title}</div>
            {it.detail ? <div className="text-[var(--muted)]">{it.detail}</div> : null}
          </li>
        ))}
        {!items.length ? <li className="text-[var(--muted)]">Sem eventos</li> : null}
      </ol>
    </div>
  );
}
