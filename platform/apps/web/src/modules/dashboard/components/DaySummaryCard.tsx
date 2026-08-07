'use client';

import Link from 'next/link';
import type { DashboardDaySummary } from '@movvo/shared';
import { formatKpi } from '../utils/format';

export function DaySummaryCard({ summary }: { summary: DashboardDaySummary }) {
  const hasItems = summary.items.length > 0 || summary.forecastRevenue > 0;

  return (
    <div
      className="movvo-card border-[var(--gold)]/30 bg-gradient-to-br from-[var(--card)] to-[var(--surface)]"
      data-testid="day-summary"
    >
      <p className="movvo-h2 text-[var(--gold)]">{summary.greeting} 👋</p>
      {hasItems ? (
        <>
          <p className="mt-2 text-sm text-[var(--muted)]">Hoje você possui:</p>
          <ul className="mt-3 space-y-2">
            {summary.items.map((item) => {
              const row = (
                <span className="text-sm text-[var(--text)]">
                  <span className="font-semibold text-[var(--gold)]">{item.value}</span> {item.label}
                </span>
              );
              return (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                  {item.href ? (
                    <Link href={item.href} className="hover:underline">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
            {summary.forecastRevenue > 0 ? (
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                <Link href="/app/finance/receivables" className="text-sm hover:underline">
                  Receita prevista:{' '}
                  <span className="font-semibold text-[var(--success)]">
                    {formatKpi(summary.forecastRevenue, 'currency')}
                  </span>
                </Link>
              </li>
            ) : null}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Nenhum compromisso crítico para hoje. Bom trabalho!
        </p>
      )}
    </div>
  );
}
