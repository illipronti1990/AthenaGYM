'use client';

import { useEffect, useState } from 'react';
import type { Schedule } from '@athenas/shared';
import { operationsApi } from '../services/operationsApi';

export function ClassesPanel({ accessToken }: { accessToken: string }) {
  const [classes, setClasses] = useState<Schedule[]>([]);
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    operationsApi
      .classes(accessToken)
      .then(setClasses)
      .catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function enroll(scheduleId: string) {
    setError(null);
    setMessage(null);
    try {
      const e = await operationsApi.enroll(accessToken, scheduleId, studentId);
      setMessage(`Reserva ${e.status}${e.waitlistPosition ? ` (#${e.waitlistPosition})` : ''}`);
      setClasses(await operationsApi.classes(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  async function cancel(scheduleId: string) {
    setError(null);
    try {
      await operationsApi.cancelEnroll(accessToken, scheduleId, studentId);
      setMessage('Reserva cancelada');
      setClasses(await operationsApi.classes(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Student ID
        <input
          className="mt-1 w-full max-w-md rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="uuid do aluno"
          required
        />
      </label>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <ul className="divide-y divide-zinc-200">
        {classes.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-zinc-500">
                {c.reservedCount}/{c.maxCapacity} · fila {c.waitlistCount ?? 0}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!studentId}
                onClick={() => enroll(c.id)}
                className="rounded border border-zinc-300 px-2 py-1 text-sm hover:border-[#A3001B]"
              >
                Reservar
              </button>
              <button
                type="button"
                disabled={!studentId}
                onClick={() => cancel(c.id)}
                className="rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-600"
              >
                Cancelar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
