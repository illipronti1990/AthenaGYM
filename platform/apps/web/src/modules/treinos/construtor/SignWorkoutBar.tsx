'use client';

import { useState } from 'react';
import type { Workout } from '@movvo/shared';
import { workoutsApi } from '@/modules/workouts/services/workoutsApi';

export function SignWorkoutBar({
  accessToken,
  workout,
  onSigned,
}: {
  accessToken: string;
  workout: Workout;
  onSigned: (w: Workout) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signTrainer() {
    setBusy(true);
    setError(null);
    try {
      onSigned(await workoutsApi.signWorkout(accessToken, workout.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusy(false);
    }
  }

  async function signStudent() {
    setBusy(true);
    setError(null);
    try {
      onSigned(await workoutsApi.signWorkoutStudent(accessToken, workout.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded border border-[var(--border)] p-3 text-sm"
      data-testid="sign-workout-bar"
    >
      <span>
        Assinatura professor:{' '}
        {workout.signedTrainerAt
          ? new Date(workout.signedTrainerAt).toLocaleString('pt-BR')
          : 'pendente'}
      </span>
      <span>
        Assinatura aluno:{' '}
        {workout.signedStudentAt
          ? new Date(workout.signedStudentAt).toLocaleString('pt-BR')
          : 'pendente'}
      </span>
      <button
        type="button"
        className="movvo-btn"
        disabled={busy || Boolean(workout.signedTrainerAt)}
        onClick={signTrainer}
        data-testid="sign-trainer"
      >
        Assinar (professor)
      </button>
      <button
        type="button"
        className="movvo-btn movvo-btn-ghost"
        disabled={busy || Boolean(workout.signedStudentAt)}
        onClick={signStudent}
        data-testid="sign-student"
      >
        Ack aluno (stub)
      </button>
      {workout.id ? (
        <a
          className="movvo-btn movvo-btn-ghost"
          href={workoutsApi.printWorkoutUrl(workout.id)}
          target="_blank"
          rel="noreferrer"
        >
          PDF
        </a>
      ) : null}
      {error ? <span className="text-red-600">{error}</span> : null}
    </div>
  );
}
