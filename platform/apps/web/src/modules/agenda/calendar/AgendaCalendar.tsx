'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Schedule } from '@movvo/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';
import { WeekGrid } from './WeekGrid';
import { ConflictBanner } from './ConflictBanner';

type View = 'day' | 'week' | 'month' | 'list';
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function AgendaCalendar({ accessToken }: { accessToken: string }) {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(dayStart(new Date()));
  const [items, setItems] = useState<Schedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const from = useMemo(() => new Date(date.getTime() - 6 * 86400000).toISOString(), [date]);
  const to = useMemo(() => new Date(date.getTime() + 14 * 86400000).toISOString(), [date]);

  useEffect(() => {
    const reload = () =>
      operationsApi
        .schedules(accessToken, { from, to })
        .then(setItems)
        .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar agenda'));
    reload();
    const onAgendaChanged = () => reload();
    window.addEventListener('movvo-agenda-changed', onAgendaChanged);
    return () => window.removeEventListener('movvo-agenda-changed', onAgendaChanged);
  }, [accessToken, from, to]);

  const visible = items.filter(
    (item) =>
      item.status !== 'cancelled' &&
      (view !== 'day' || dayStart(new Date(item.startAt)).getTime() === date.getTime()),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['day', 'week', 'month', 'list'] as View[]).map((option) => (
          <button key={option} className={`movvo-chip-nav ${view === option ? 'border-[var(--gold)]' : ''}`} onClick={() => setView(option)}>
            {{ day: 'Dia', week: 'Semana', month: 'Mês', list: 'Lista' }[option]}
          </button>
        ))}
        <button className="movvo-btn movvo-btn-secondary ml-auto" onClick={() => setDate(new Date(date.getTime() + 86400000))}>Próximo →</button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ConflictBanner items={visible} />
      {view === 'week' ? <WeekGrid accessToken={accessToken} date={date} items={visible} onRefresh={() => operationsApi.schedules(accessToken, { from, to }).then(setItems)} /> : (
        <div className="grid gap-2">
          {visible.map((item) => <div key={item.id} className="rounded border border-[var(--border)] p-3" style={{ borderLeftColor: item.color || 'var(--gold)' }}>
            <strong>{new Date(item.startAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</strong> · {item.title}
            <span className="ml-2 text-xs text-[var(--muted)]">{item.status}</span>
          </div>)}
          {!visible.length ? <p className="text-sm text-[var(--muted)]">Nenhum compromisso no período.</p> : null}
        </div>
      )}
    </div>
  );
}
