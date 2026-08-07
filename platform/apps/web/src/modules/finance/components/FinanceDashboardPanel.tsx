'use client';

import { useEffect, useState } from 'react';
import type { FinanceDashboard } from '@movvo/shared';
import { Card, chartColors, SkeletonCard } from '@movvo/ui';
import { financeApi } from '../services/financeApi';
import { FinancialHealthCard } from './FinancialHealthCard';
import { useToast } from '@/components/ui/Toast';
import { ContextualActions } from '@/components/ux/ContextualActions';

const EMPTY_HEALTH = {
  score: 0,
  revenue: 'atencao',
  delinquency: 'atencao',
  cashflow: 'atencao',
  expenses: 'atencao',
};

function brl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FinanceDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<FinanceDashboard | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await financeApi.dashboard(accessToken));
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha dashboard', 'error');
        setData({
          monthRevenue: 0,
          received: 0,
          toReceive: 0,
          delinquencyRate: 0,
          cashflowBalance: 0,
          profit: 0,
          expenses: 0,
          averageTicket: 0,
          mrr: 0,
          receivedToday: 0,
          cashSessionBalance: 0,
          health: EMPTY_HEALTH,
        });
      }
    })();
  }, [accessToken, push]);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Receita do mês', value: brl(data.monthRevenue), color: chartColors.revenue },
    { label: 'Recebido', value: brl(data.received), color: chartColors.workouts },
    { label: 'A receber', value: brl(data.toReceive), color: chartColors.checkins },
    { label: 'Inadimplência', value: `${data.delinquencyRate}%`, color: chartColors.finance },
    { label: 'Fluxo de caixa', value: brl(data.cashflowBalance), color: chartColors.revenue },
    { label: 'Lucro', value: brl(data.profit ?? 0), color: chartColors.workouts },
    { label: 'Despesas', value: brl(data.expenses ?? 0), color: chartColors.finance },
    { label: 'MRR', value: brl(data.mrr ?? 0), color: chartColors.revenue },
    { label: 'Ticket médio', value: brl(data.averageTicket ?? 0), color: chartColors.checkins },
    { label: 'Recebido hoje', value: brl(data.receivedToday ?? 0), color: chartColors.workouts },
  ];

  return (
    <div className="space-y-4" data-testid="finance-dashboard">
      {data.health ? <FinancialHealthCard health={data.health} /> : null}

      {data.delinquencyRate > 0 || data.toReceive > 0 ? (
        <ContextualActions
          title="Sugestão operacional"
          actions={[
            {
              id: 'delinquency-report',
              label: 'Ver inadimplência',
              href: '/app/financeiro/inadimplencia',
              variant: 'primary',
            },
            {
              id: 'open-receivables',
              label: 'Ver recebimentos pendentes',
              href: '/app/financeiro/receber',
            },
          ]}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label} hover>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: c.color }}>
              {c.value}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
