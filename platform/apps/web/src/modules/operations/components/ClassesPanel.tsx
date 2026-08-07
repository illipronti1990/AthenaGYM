'use client';

import { useEffect, useState } from 'react';
import type { Schedule } from '@movvo/shared';
import { operationsApi } from '../services/operationsApi';
import { StudentSelect } from './StudentSelect';

export function ClassesPanel({ accessToken }: { accessToken: string }) {
  const [classes, setClasses] = useState<Schedule[]>([]);
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    operationsApi
      .classes(accessToken)
      .then(setClasses)
      .catch((e) =>
        setError(e instanceof Error ? e.message.replace(/^Failed to fetch$/, 'Falha ao carregar aulas') : 'erro'),
      );
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
      <StudentSelect accessToken={accessToken} value={studentId} onChange={setStudentId} />
      {message ? <p className="text-sm text-[var(--gold)]">{message}</p> : null}
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="divide-y divide-[var(--border)]">
        {classes.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-[var(--muted)]">
                {c.reservedCount}/{c.maxCapacity} · fila {c.waitlistCount ?? 0}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!studentId}
                onClick={() => enroll(c.id)}
                className="movvo-btn movvo-btn-secondary"
              >
                Reservar
              </button>
              <button
                type="button"
                disabled={!studentId}
                onClick={() => cancel(c.id)}
                className="movvo-btn movvo-btn-secondary"
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
