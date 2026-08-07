'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Exercise } from '@movvo/shared';
import { MUSCLE_CATEGORIES } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';
import { capitalizeLabel } from '@/modules/workouts/components/MuscleGroupMultiSelect';
import {
  DIFFICULTY_OPTIONS,
  difficultyLabel,
  type DifficultyValue,
} from '@/modules/workouts/utils/difficultyLabels';
import { useConfirm } from '@/components/ux/ConfirmProvider';

export function ExerciseLibrary({ accessToken }: { accessToken: string }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<Exercise[]>([]);
  const [q, setQ] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [name, setName] = useState('');
  const [createDifficulty, setCreateDifficulty] = useState<DifficultyValue>('beginner');
  const [createGroup, setCreateGroup] = useState('peito');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    setItems(
      await workoutsApi.exercises(accessToken, {
        q: q || undefined,
        muscleGroup: muscleGroup || undefined,
        difficulty: difficulty || undefined,
      }),
    );
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, muscleGroup, difficulty]);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    try {
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await workoutsApi.createExercise(accessToken, {
        name,
        muscleGroup: createGroup,
        categories: [createGroup],
        difficulty: createDifficulty,
      });
      setName('');
      setMsg('Exercício criado');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function onDelete(id: string) {
    const ok = await confirm({
      title: 'Excluir exercício?',
      message: 'Essa ação não poderá ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await workoutsApi.deleteExercise(accessToken, id);
      setMsg('Exercício excluído');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-6" data-testid="exercise-library">
      <form onSubmit={onSearch} className="flex flex-wrap gap-3">
        <input
          className="movvo-input"
          placeholder="Buscar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="exercise-filter-q"
        />
        <select
          className="movvo-input"
          value={muscleGroup}
          onChange={(e) => setMuscleGroup(e.target.value)}
          data-testid="exercise-filter-muscle"
        >
          <option value="">Grupo</option>
          {MUSCLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {capitalizeLabel(c)}
            </option>
          ))}
        </select>
        <select
          className="movvo-input"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="">Nível</option>
          {DIFFICULTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="submit" className="movvo-btn">
          Filtrar
        </button>
      </form>

      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-[var(--muted)]">
          Nome
          <input
            className="mt-1 block movvo-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            data-testid="exercise-name"
          />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Grupo
          <select
            className="mt-1 block movvo-input"
            value={createGroup}
            onChange={(e) => setCreateGroup(e.target.value)}
          >
            {MUSCLE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {capitalizeLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[var(--muted)]">
          Nível
          <select
            className="mt-1 block movvo-input"
            value={createDifficulty}
            onChange={(e) => setCreateDifficulty(e.target.value as DifficultyValue)}
          >
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="movvo-btn movvo-btn-primary" data-testid="exercise-submit">
          Adicionar
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}

      <ul className="divide-y divide-[var(--border)] text-sm">
        {items.map((ex) => (
          <li key={ex.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              <strong>{ex.name}</strong> · {capitalizeLabel(ex.muscleGroup)} ·{' '}
              {difficultyLabel(ex.difficulty as DifficultyValue)}
              {ex.objective ? ` · ${ex.objective}` : ''}
            </span>
            <button type="button" className="movvo-btn movvo-btn-ghost text-xs" onClick={() => onDelete(ex.id)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
