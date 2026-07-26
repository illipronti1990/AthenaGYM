'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Exercise } from '@athena/shared';
import { workoutsApi } from '../services/workoutsApi';

export function ExercisesPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('pernas');
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await workoutsApi.exercises(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await workoutsApi.createExercise(accessToken, { name, muscleGroup });
      setName('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-[var(--muted)]">
          Nome
          <input
            className="mt-1 block athena-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Grupo
          <input
            className="mt-1 block athena-input"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="athena-btn athena-btn-primary">
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
                · {ex.muscleGroup}
                {ex.isGlobal ? ' · global' : ''}
              </span>
            </span>
            <span className="text-[var(--muted)]">{ex.difficulty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
