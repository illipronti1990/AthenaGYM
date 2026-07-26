'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Exercise, Workout } from '@athena/shared';
import { workoutsApi } from '../services/workoutsApi';

export function WorkoutsPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('Treino A');
  const [selected, setSelected] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems(await workoutsApi.workouts(accessToken));
    setExercises(await workoutsApi.exercises(accessToken));
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    try {
      const w = await workoutsApi.createWorkout(accessToken, {
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
      setMsg(`Treino criado: ${w.id}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function publish(id: string) {
    try {
      await workoutsApi.publishWorkout(accessToken, id);
      setMsg('Treino publicado');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function duplicate(id: string) {
    try {
      await workoutsApi.duplicateWorkout(accessToken, id);
      setMsg('Treino duplicado');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function complete(id: string) {
    try {
      await workoutsApi.completeSession(accessToken, id);
      setMsg('Execução registrada');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function aiSuggest() {
    setError(null);
    try {
      const r = await workoutsApi.aiSuggest(accessToken, {
        studentId,
        objective: 'hipertrofia',
        weeklyFrequency: 4,
        createDraft: true,
      });
      setMsg(`Sugestão IA ${r.suggestionId}${r.draft ? ` → draft ${r.draft.id}` : ''}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="text-sm text-[var(--muted)]">
            Student ID
            <input
              className="mt-1 block w-72 athena-input font-mono text-xs"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </label>
          <label className="text-sm text-[var(--muted)]">
            Nome
            <input
              className="mt-1 block w-48 athena-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Exercícios</p>
          <ul className="grid max-h-48 gap-1 overflow-auto sm:grid-cols-2">
            {exercises.map((ex) => (
              <li key={ex.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(ex.id)}
                    onChange={() => toggle(ex.id)}
                  />
                  {ex.name}{' '}
                  <span className="text-xs text-[var(--muted)]">({ex.muscleGroup})</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="athena-btn athena-btn-primary">
            Criar treino
          </button>
          <button
            type="button"
            disabled={!studentId}
            onClick={aiSuggest}
            className="athena-btn athena-btn-ghost"
          >
            Sugestão IA
          </button>
        </div>
      </form>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="divide-y divide-[var(--border)]">
        {items.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium">{w.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {w.status} · v{w.version} · {w.studentId.slice(0, 8)}…
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {w.status === 'draft' ? (
                <button type="button" onClick={() => publish(w.id)} className="athena-btn athena-btn-ghost">
                  Publicar
                </button>
              ) : null}
              <button type="button" onClick={() => duplicate(w.id)} className="athena-btn athena-btn-ghost">
                Duplicar
              </button>
              <button type="button" onClick={() => complete(w.id)} className="athena-btn athena-btn-ghost">
                Concluir sessão
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
