'use client';

import type { DashboardActivity } from '@athena/shared';
import { EmptyState } from '@athena/ui';
import { Activity } from 'lucide-react';

export function ActivityTimeline({ items }: { items: DashboardActivity[] }) {
  return (
    <div className="athena-card h-full" data-testid="activity-timeline">
      <h3 className="athena-h3 mb-3 inline-flex items-center gap-2 text-[var(--gold)]">
        <Activity size={18} /> Últimas movimentações
      </h3>
      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Cadastre o primeiro aluno ou registre um pagamento."
        />
      ) : (
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {items.map((item) => {
            const time = new Date(item.at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <li key={item.id} className="flex gap-3 text-sm">
                <span className="w-12 shrink-0 font-medium text-[var(--muted)]">{time}</span>
                <div className="min-w-0">
                  <p className="truncate text-[var(--text)]">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-[var(--muted)]">{item.subtitle}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
