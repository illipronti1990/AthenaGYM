'use client';

import Link from 'next/link';
import type { DashboardActivity, DashboardActivityKind } from '@movvo/shared';
import { Avatar, EmptyState } from '@movvo/ui';
import {
  Activity,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  UserPlus,
  UserRound,
} from 'lucide-react';

const kindMeta: Record<
  DashboardActivityKind,
  { icon: typeof Activity; color: string; label: string }
> = {
  checkin: { icon: ClipboardCheck, color: 'text-[var(--primary)]', label: 'Check-in' },
  payment: { icon: CreditCard, color: 'text-[var(--success)]', label: 'Pagamento' },
  enrollment: { icon: UserPlus, color: 'text-sky-400', label: 'Matrícula' },
  student: { icon: UserRound, color: 'text-[var(--gold)]', label: 'Aluno' },
  assessment: { icon: ClipboardList, color: 'text-orange-400', label: 'Avaliação' },
  workout: { icon: Dumbbell, color: 'text-violet-400', label: 'Treino' },
  other: { icon: Activity, color: 'text-[var(--muted)]', label: 'Atividade' },
};

export function ActivityTimeline({ items }: { items: DashboardActivity[] }) {
  return (
    <div className="movvo-card h-full" data-testid="activity-timeline">
      <h3 className="movvo-h3 mb-3 inline-flex items-center gap-2 text-[var(--gold)]">
        <Activity size={18} /> Últimas movimentações
      </h3>
      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Cadastre o primeiro aluno ou registre um pagamento."
          action={
            <Link href="/app/alunos/novo" className="movvo-btn movvo-btn-primary movvo-btn-sm">
              Novo Aluno
            </Link>
          }
        />
      ) : (
        <ul className="max-h-72 divide-y divide-[var(--border)] overflow-y-auto pr-1">
          {items.map((item) => {
            const time = new Date(item.at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const kind = item.kind || 'other';
            const meta = kindMeta[kind];
            const Icon = meta.icon;
            const name = item.actorName || item.subtitle || 'Sistema';
            const row = (
              <div className="flex items-center gap-3 py-3 transition duration-200 hover:bg-[var(--surface)]/50">
                <span className="w-12 shrink-0 text-sm font-semibold text-[var(--muted)]">{time}</span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] ${meta.color}`}
                >
                  {item.photoUrl ? (
                    <Avatar src={item.photoUrl} name={name} size={36} />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--text)]">{item.title}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {name} · {meta.label}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="block cursor-pointer no-underline">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
