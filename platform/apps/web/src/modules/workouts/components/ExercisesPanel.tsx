'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Exercise } from '@athenas/shared';
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
        <label className="text-sm">
          Nome
          <input
            className="mt-1 block rounded border border-zinc-300 px-2 py-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Grupo
          <input
            className="mt-1 block rounded border border-zinc-300 px-2 py-1.5"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="rounded bg-[#A3001B] px-3 py-1.5 text-sm font-semibold text-white">
          Adicionar
        </button>
      </form>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 text-sm">
        {items.map((ex) => (
          <li key={ex.id} className="flex justify-between py-2">
            <span>
              {ex.name}{' '}
              <span className="text-zinc-500">
                · {ex.muscleGroup}
                {ex.isGlobal ? ' · global' : ''}
              </span>
            </span>
            <span className="text-zinc-500">{ex.difficulty}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
