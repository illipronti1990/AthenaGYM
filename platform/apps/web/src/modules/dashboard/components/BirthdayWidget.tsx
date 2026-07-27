'use client';

import Link from 'next/link';
import type { DashboardBirthday } from '@athena/shared';
import { Avatar, EmptyState } from '@athena/ui';
import { Cake } from 'lucide-react';

export function BirthdayWidget({ items }: { items: DashboardBirthday[] }) {
  return (
    <div className="athena-card h-full" data-testid="birthday-widget">
      <h3 className="athena-h3 mb-3 inline-flex items-center gap-2 text-orange-400">
        <Cake size={18} /> Aniversariantes
      </h3>
      {items.length === 0 ? (
        <EmptyState
          title="Sem aniversários próximos"
          description="Nos próximos 14 dias. Complete a data de nascimento dos alunos."
          action={
            <Link href="/app/alunos" className="athena-btn athena-btn-secondary athena-btn-sm">
              Ver Alunos
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((b) => (
            <li key={b.id}>
              <Link
                href={b.href || '/app/alunos'}
                className="flex items-center gap-3 rounded-[12px] border border-[var(--border)] px-3 py-2 transition hover:border-orange-400/50"
              >
                <Avatar src={b.photoUrl} name={b.fullName} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.fullName}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {b.age != null ? `${b.age} anos · ` : ''}
                    {b.daysUntil === 0 ? 'Hoje' : `em ${b.daysUntil} dia(s)`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
