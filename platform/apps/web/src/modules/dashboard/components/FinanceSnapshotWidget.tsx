'use client';

import Link from 'next/link';
import type { DashboardFinanceSnapshot } from '@movvo/shared';
import { EmptyState } from '@movvo/ui';
import { Wallet } from 'lucide-react';
import { formatKpi } from '../utils/format';

export function FinanceSnapshotWidget({ snapshot }: { snapshot: DashboardFinanceSnapshot }) {
  const empty = snapshot.inflows === 0 && snapshot.outflows === 0;

  return (
    <div className="movvo-card movvo-card-hover h-full cursor-pointer transition duration-200" data-testid="finance-snapshot">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="movvo-h3 inline-flex items-center gap-2 text-[var(--gold)]">
          <Wallet size={18} /> Financeiro
        </h3>
        <Link href="/app/finance/cashflow" className="text-xs text-[var(--gold)]">
          Abrir
        </Link>
      </div>
      {empty ? (
        <EmptyState
          title="Nenhum recebimento registrado"
          description="Registre a primeira movimentação do caixa."
          action={
            <Link href="/app/finance/receivables" className="movvo-btn movvo-btn-primary movvo-btn-sm">
              Novo Recebimento
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[var(--muted)]">Entradas</p>
            <p className="mt-1 font-semibold text-[var(--success)]">
              {formatKpi(snapshot.inflows, 'currency')}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Saídas</p>
            <p className="mt-1 font-semibold text-[var(--primary-hover)]">
              {formatKpi(snapshot.outflows, 'currency')}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">Saldo</p>
            <p className="mt-1 font-semibold text-[var(--gold)]">
              {formatKpi(snapshot.balance, 'currency')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
