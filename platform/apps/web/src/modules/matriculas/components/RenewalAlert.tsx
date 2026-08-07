'use client';

import Link from 'next/link';
import type { RenewalDueItem } from '@movvo/shared';
import { Button } from '@movvo/ui';

export function RenewalAlert({ items }: { items: RenewalDueItem[] }) {
  if (!items.length) return null;
  const urgent = items.filter((i) => i.daysUntilExpiry <= 7).slice(0, 5);
  const list = urgent.length ? urgent : items.slice(0, 5);

  return (
    <div
      className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.08)] p-4"
      data-testid="renewal-alerts"
    >
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--gold)]">
        Renovações próximas
      </h3>
      <ul className="space-y-2">
        {list.map((item) => (
          <li
            key={item.enrollment.id}
            className="flex flex-wrap items-center justify-between gap-2 text-sm"
          >
            <span>
              <strong>{item.studentName}</strong> — {item.planName} vence em{' '}
              <strong>{item.daysUntilExpiry} dia(s)</strong>
            </span>
            <Link href={`/app/matriculas/${item.enrollment.id}/renovar`}>
              <Button size="sm">Renovar</Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
