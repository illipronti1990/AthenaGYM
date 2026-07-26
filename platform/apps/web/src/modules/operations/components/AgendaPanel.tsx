'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { Schedule } from '@athena/shared';
import { operationsApi } from '../services/operationsApi';

const UNIT_ID = '22222222-2222-2222-2222-222222222222';

export function AgendaPanel({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<Schedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('Aula Coletiva');
  const [type, setType] = useState('class');
  const [loading, setLoading] = useState(false);

  async function reload() {
    const list = await operationsApi.schedules(accessToken);
    setItems(list);
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'erro'));
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const start = new Date();
      start.setMinutes(start.getMinutes() + 30);
      const end = new Date(start.getTime() + 60 * 60_000);
      await operationsApi.createSchedule(accessToken, {
        unitId: UNIT_ID,
        title,
        type,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        maxCapacity: 20,
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-[var(--muted)]">
          Título
          <input
            className="mt-1 block w-56 athena-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Tipo
          <select
            className="mt-1 block athena-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="class">Aula coletiva</option>
            <option value="assessment">Avaliação</option>
            <option value="personal">Personal</option>
            <option value="nutrition">Nutrição</option>
            <option value="event">Evento</option>
            <option value="maintenance">Manutenção</option>
            <option value="reservation">Reserva</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="athena-btn athena-btn-primary disabled:opacity-60"
        >
          {loading ? 'Salvando…' : 'Nova agenda'}
        </button>
      </form>
      {error ? <p className="text-sm text-[var(--primary-hover)]">{error}</p> : null}
      <ul className="divide-y divide-[var(--border)]">
        {items.map((s) => (
          <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
            <div>
              <p className="font-medium text-[var(--text)]">{s.title}</p>
              <p className="text-xs text-[var(--muted)]">
                {s.type} · {new Date(s.startAt).toLocaleString('pt-BR')} →{' '}
                {new Date(s.endAt).toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {s.reservedCount ?? 0}/{s.maxCapacity}
              {(s.waitlistCount ?? 0) > 0 ? ` · fila ${s.waitlistCount}` : ''}
            </p>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="py-6 text-sm text-[var(--muted)]">Nenhum item na agenda.</li>
        ) : null}
      </ul>
    </div>
  );
}
