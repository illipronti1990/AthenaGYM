'use client';

import Link from 'next/link';
import type { DashboardKpi } from '@movvo/shared';
import { AnimatedNumber } from './AnimatedNumber';
import { formatKpi } from '../utils/format';

const toneBorder: Record<DashboardKpi['tone'], string> = {
  gold: 'border-[var(--gold)]/40 hover:border-[var(--gold)]',
  red: 'border-[var(--primary)]/40 hover:border-[var(--primary)]',
  green: 'border-[var(--success)]/40 hover:border-[var(--success)]',
  blue: 'border-sky-500/40 hover:border-sky-400',
  orange: 'border-orange-500/40 hover:border-orange-400',
  muted: 'border-[var(--border)] hover:border-[var(--muted)]',
};

export function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const content = (
    <div
      className={`movvo-card movvo-card-hover flex min-h-[120px] cursor-pointer flex-col justify-between transition duration-200 ${toneBorder[kpi.tone]}`}
      title={kpi.deltaLabel || kpi.label}
      data-testid={`kpi-${kpi.id}`}
    >
      <p className="text-sm text-[var(--muted)]">{kpi.label}</p>
      <p className="movvo-h2 mt-2">
        <AnimatedNumber value={kpi.value} format={(n) => formatKpi(n, kpi.format)} />
      </p>
      {kpi.delta != null || kpi.deltaLabel ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          {kpi.delta != null ? (
            <span className={kpi.delta >= 0 ? 'text-[var(--success)]' : 'text-[var(--primary-hover)]'}>
              {kpi.delta >= 0 ? '▲' : '▼'} {Math.abs(kpi.delta)}%
            </span>
          ) : null}{' '}
          {kpi.deltaLabel}
        </p>
      ) : (
        <span className="mt-2 text-xs text-transparent">—</span>
      )}
    </div>
  );

  if (kpi.href) {
    return (
      <Link href={kpi.href} className="block no-underline">
        {content}
      </Link>
    );
  }
  return content;
}
