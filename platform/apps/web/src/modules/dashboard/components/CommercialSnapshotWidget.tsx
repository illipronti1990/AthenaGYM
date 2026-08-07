'use client';

import Link from 'next/link';
import type { DashboardCommercialSnapshot } from '@movvo/shared';
import { EmptyState } from '@movvo/ui';
import { Users } from 'lucide-react';

export function CommercialSnapshotWidget({
  snapshot,
}: {
  snapshot: DashboardCommercialSnapshot;
}) {
  const empty = snapshot.newStudents === 0 && snapshot.cancellations === 0;

  return (
    <div
      className="movvo-card movvo-card-hover h-full cursor-pointer transition duration-200"
      data-testid="commercial-snapshot"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="movvo-h3 inline-flex items-center gap-2 text-sky-400">
          <Users size={18} /> Comercial
        </h3>
        <Link href="/app/alunos" className="text-xs text-[var(--gold)]">
          Abrir
        </Link>
      </div>
      {empty ? (
        <EmptyState
          title="Nenhum aluno novo neste mês"
          description="Cadastre leads e acompanhe a conversão."
          action={
            <Link href="/app/alunos/novo" className="movvo-btn movvo-btn-primary movvo-btn-sm">
              Novo Aluno
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[var(--muted)]">Novos alunos</p>
            <p className="mt-1 movvo-h2 text-sky-400">{snapshot.newStudents}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Cancelamentos</p>
            <p className="mt-1 movvo-h2 text-orange-400">{snapshot.cancellations}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Conversão</p>
            <p className="mt-1 movvo-h2 text-[var(--success)]">{snapshot.conversionRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
