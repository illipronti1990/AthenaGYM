'use client';

import type { Schedule } from '@athena/shared';
import { operationsApi } from '@/modules/operations/services/operationsApi';

export function WeekGrid({ accessToken, date, items, onRefresh }: { accessToken: string; date: Date; items: Schedule[]; onRefresh: () => void }) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const days = Array.from({ length: 7 }, (_, index) => new Date(start.getTime() + index * 86400000));
  async function copyWeek() {
    await operationsApi.copyWeek(accessToken, {
      sourceWeekStart: start.toISOString(),
      targetWeekStart: new Date(start.getTime() + 7 * 86400000).toISOString(),
    });
    onRefresh();
  }
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Semana de {start.toLocaleDateString('pt-BR')}</h3><button className="athena-btn athena-btn-secondary" onClick={copyWeek}>Copiar semana</button></div>
    <div className="grid gap-2 md:grid-cols-7">{days.map((day) => {
      const dayItems = items.filter((item) => new Date(item.startAt).toDateString() === day.toDateString());
      return <section key={day.toISOString()} className="min-h-32 rounded border border-[var(--border)] p-2">
        <h4 className="mb-2 text-xs font-semibold text-[var(--muted)]">{day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</h4>
        <div className="space-y-2">{dayItems.map((item) => <div key={item.id} className="rounded bg-[var(--surface-raised)] p-2 text-xs">{new Date(item.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {item.title}</div>)}</div>
      </section>;
    })}</div>
  </div>;
}
