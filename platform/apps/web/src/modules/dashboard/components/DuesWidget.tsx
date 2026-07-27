'use client';

import Link from 'next/link';
import type { DashboardDuesSummary } from '@athena/shared';
import { EmptyState } from '@athena/ui';
import { ContextualActions } from '@/components/ux/ContextualActions';

export function DuesWidget({ dues }: { dues: DashboardDuesSummary }) {
  const empty = dues.dueToday === 0 && dues.overdue === 0 && dues.receivedMonth === 0;
  const cards = [
    { label: 'Vencendo hoje', value: dues.dueToday, tone: 'text-orange-400' },
    { label: 'Atrasadas', value: dues.overdue, tone: 'text-[var(--primary-hover)]' },
    { label: 'Recebidas', value: dues.receivedMonth, tone: 'text-[var(--success)]' },
  ];
  return (
    <div className="athena-card h-full space-y-3" data-testid="dues-widget">
      <div className="flex items-center justify-between">
        <h3 className="athena-h3 text-[var(--gold)]">Mensalidades</h3>
        <Link href="/app/finance/subscriptions" className="text-xs text-[var(--gold)]">
          Abrir
        </Link>
      </div>
      {empty ? (
        <EmptyState
          title="Nenhum recebimento registrado"
          description="Lance a primeira mensalidade ou recebimento."
          action={
            <Link href="/app/finance/receivables" className="athena-btn athena-btn-primary athena-btn-sm">
              Novo Recebimento
            </Link>
          }
        />
      ) : (
        <>
          {dues.overdue > 0 ? (
            <ContextualActions
              title="Ação recomendada"
              actions={[
                {
                  id: 'delinquency',
                  label: 'Emitir relatório de inadimplência',
                  href: '/app/finance/reports',
                  variant: 'primary',
                },
              ]}
            />
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            {cards.map((c) => (
              <Link
                key={c.label}
                href="/app/finance/receivables"
                className="athena-card-hover cursor-pointer rounded-[12px] border border-[var(--border)] p-3 text-center transition duration-200 no-underline"
              >
                <p className={`athena-h2 ${c.tone}`}>{c.value}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{c.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
