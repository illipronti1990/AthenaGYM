'use client';

import { useEffect, useState } from 'react';
import type { FinanceDashboard } from '@athena/shared';
import { Card, chartColors } from '@athena/ui';
import { financeApi } from '../services/financeApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

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
        });
      }
    })();
  }, [accessToken, push]);

  if (!data) return <TableSkeleton rows={5} />;

  const cards = [
    {
      label: 'Receita do mês',
      value: data.monthRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      color: chartColors.revenue,
    },
    {
      label: 'Recebido',
      value: data.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      color: chartColors.workouts,
    },
    {
      label: 'A receber',
      value: data.toReceive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      color: chartColors.checkins,
    },
    { label: 'Inadimplência', value: `${data.delinquencyRate}%`, color: chartColors.finance },
    {
      label: 'Fluxo de caixa',
      value: data.cashflowBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      color: chartColors.revenue,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-testid="finance-dashboard">
      {cards.map((c) => (
        <Card key={c.label} hover>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: c.color }}>
            {c.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
