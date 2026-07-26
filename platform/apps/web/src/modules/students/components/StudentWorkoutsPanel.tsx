'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Exercise, Workout } from '@athena/shared';
import { Button, Card } from '@athena/ui';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
  completed: 'Concluído',
};

export function StudentWorkoutsPanel({
  accessToken,
  studentId,
}: {
  accessToken: string;
  studentId: string;
}) {
  const { push } = useToast();
  const [items, setItems] = useState<Workout[] | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('Treino A');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [workouts, exs] = await Promise.all([
        workoutsApi.workouts(accessToken, studentId),
        workoutsApi.exercises(accessToken).catch(() => [] as Exercise[]),
      ]);
      setItems(workouts);
      setExercises(exs);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar treinos', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, studentId]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await workoutsApi.createWorkout(accessToken, {
        studentId,
        name,
        objective: 'hipertrofia',
        exercises: selected.map((exerciseId, i) => ({
          exerciseId,
          sortOrder: i + 1,
          sets: 3,
          repetitions: '10',
          restSeconds: 60,
        })),
        publish: false,
      });
      push('Treino criado');
      setSelected([]);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Erro ao criar treino', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function run(action: () => Promise<unknown>, ok: string) {
    try {
      await action();
      push(ok);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha na ação', 'error');
    }
  }

  if (!items) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-6" data-testid="student-workouts-panel">
      <Card>
        <h3 className="athena-title mb-3 text-lg">Novo treino</h3>
        <form onSubmit={onCreate} className="space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="athena-input max-w-xs"
            placeholder="Nome do treino"
          />
          {exercises.length > 0 ? (
            <div>
              <p className="mb-2 text-sm text-[var(--muted)]">Exercícios</p>
              <ul className="grid max-h-48 gap-1 overflow-auto sm:grid-cols-2">
                {exercises.map((ex) => (
                  <li key={ex.id}>
                    <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                      <input
                        type="checkbox"
                        checked={selected.includes(ex.id)}
                        onChange={() => toggle(ex.id)}
                      />
                      {ex.name}
                      <span className="text-xs text-[var(--muted)]">({ex.muscleGroup})</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Nenhum exercício no catálogo — o treino será criado sem exercícios.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando…' : 'Criar treino'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                void run(
                  () =>
                    workoutsApi.aiSuggest(accessToken, {
                      studentId,
                      objective: 'hipertrofia',
                      weeklyFrequency: 4,
                      createDraft: true,
                    }),
                  'Sugestão de treino gerada',
                )
              }
            >
              Sugestão IA
            </Button>
          </div>
        </form>
      </Card>

      <section>
        <h3 className="athena-title mb-3 text-lg">Treinos do aluno</h3>
        {items.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum treino cadastrado.</p>
        ) : (
          <ul className="athena-list" data-testid="student-workouts-list">
            {items.map((w) => (
              <li key={w.id} className="athena-list-item flex-wrap">
                <span>
                  {w.name} · {STATUS_LABEL[String(w.status)] || w.status} · v{w.version}
                  {w.exercises?.length ? ` · ${w.exercises.length} exercício(s)` : ''}
                </span>
                <span className="flex flex-wrap gap-1">
                  {w.status === 'draft' ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-2 !py-1 text-xs"
                      onClick={() =>
                        void run(() => workoutsApi.publishWorkout(accessToken, w.id), 'Treino publicado')
                      }
                    >
                      Publicar
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-1 text-xs"
                    onClick={() =>
                      void run(() => workoutsApi.duplicateWorkout(accessToken, w.id), 'Treino duplicado')
                    }
                  >
                    Duplicar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!px-2 !py-1 text-xs"
                    onClick={() =>
                      void run(
                        () => workoutsApi.completeSession(accessToken, w.id),
                        'Sessão registrada',
                      )
                    }
                  >
                    Concluir sessão
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
