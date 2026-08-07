'use client';

import { useEffect, useState } from 'react';
import type { WorkoutTemplate } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { AlunoSelect } from '@/modules/alunos/components/AlunoSelect';

export function TemplatesPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<WorkoutTemplate[]>([]);
  const [studentId, setStudentId] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    workoutsApi
      .templates(accessToken)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function apply(id: string) {
    setError(null);
    if (!studentId) {
      setError('Selecione um aluno');
      return;
    }
    try {
      const w = await workoutsApi.applyTemplate(accessToken, id, { studentId, publish: false });
      setMsg(`Treino criado a partir do template: ${w.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  async function duplicate(id: string) {
    try {
      await workoutsApi.duplicateTemplate(accessToken, id);
      setItems(await workoutsApi.templates(accessToken));
      setMsg('Template duplicado');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    }
  }

  return (
    <div className="space-y-4" data-testid="templates-panel">
      <AlunoSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
      <ul className="divide-y divide-[var(--border)] text-sm">
        {items.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <strong>{t.name}</strong>
              <div className="text-[var(--muted)]">
                {t.category || '—'} · {t.difficulty}
                {t.objective ? ` · ${t.objective}` : ''}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="movvo-btn" onClick={() => apply(t.id)}>
                Aplicar ao aluno
              </button>
              <button type="button" className="movvo-btn movvo-btn-ghost" onClick={() => duplicate(t.id)}>
                Duplicar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
