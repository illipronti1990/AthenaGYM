'use client';

import Link from 'next/link';
import type { DashboardAgendaItem } from '@movvo/shared';
import { EmptyState } from '@movvo/ui';
import { Calendar } from 'lucide-react';

export function AgendaWidget({ items }: { items: DashboardAgendaItem[] }) {
  return (
    <div className="movvo-card h-full" data-testid="agenda-widget">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="movvo-h3 inline-flex items-center gap-2 text-sky-400">
          <Calendar size={18} /> Agenda de hoje
        </h3>
        <Link href="/app/acesso/agenda" className="text-xs text-[var(--gold)]">
          Ver tudo
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="Agenda livre hoje"
          description="Nenhum compromisso agendado. Crie o primeiro evento."
          action={
            <Link href="/app/acesso/agenda" className="movvo-btn movvo-btn-primary movvo-btn-sm">
              Nova Agenda
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const time = new Date(item.startAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <li key={item.id}>
                <Link
                  href={item.href || '/app/acesso/agenda'}
                  className="flex items-center gap-3 rounded-[12px] border border-[var(--border)] px-3 py-2 transition hover:border-sky-500/50"
                >
                  <span className="font-semibold text-sky-400">{time}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
