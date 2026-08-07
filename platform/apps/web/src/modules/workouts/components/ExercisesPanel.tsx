'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Exercise } from '@movvo/shared';
import { workoutsApi } from '../services/workoutsApi';
import { capitalizeLabel, MuscleGroupMultiSelect } from './MuscleGroupMultiSelect';
import {
  DIFFICULTY_OPTIONS,
  difficultyLabel,
  type DifficultyValue,
} from '../utils/difficultyLabels';

function formatGroups(ex: Exercise) {
  const groups = [ex.muscleGroup, ...(ex.secondaryMuscles || [])]
    .filter(Boolean)
    .map(capitalizeLabel);
  return groups.join(', ');
}

export function ExercisesPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [groups, setGroups] = useState<string[]>(['Pernas']);
  const [difficulty, setDifficulty] = useState<DifficultyValue>('beginner');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await workoutsApi.exercises(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (groups.length === 0) {
      setError('Selecione ao menos um grupo muscular');
      return;
    }
    try {
      const [muscleGroup, ...secondaryMuscles] = groups;
      await workoutsApi.createExercise(accessToken, {
        name,
        muscleGroup,
        secondaryMuscles,
        difficulty,
      });
      setName('');
      setGroups(['Pernas']);
      setDifficulty('beginner');
      setError(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap items-start gap-3">
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
        <div className="text-sm text-[var(--muted)]">
          <span>Grupo</span>
          <MuscleGroupMultiSelect value={groups} onChange={setGroups} />
        </div>
        <label className="text-sm text-[var(--muted)]">
          Nível
          <select
            className="mt-1 block movvo-input"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyValue)}
            data-testid="exercise-difficulty"
          >
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="movvo-btn movvo-btn-primary mt-6" data-testid="exercise-submit">
          Adicionar
        </button>
      </form>
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="divide-y divide-[var(--border)] text-sm">
        {items.map((ex) => (
          <li key={ex.id} className="flex justify-between py-2">
            <span>
              {ex.name}{' '}
              <span className="text-[var(--muted)]">
                · {formatGroups(ex)}
                {ex.isGlobal ? ' · global' : ''}
              </span>
            </span>
            <span className="text-[var(--muted)]">{difficultyLabel(ex.difficulty)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
