'use client';

import { useEffect, useState } from 'react';
import type { FinanceDashboard } from '@athenas/shared';
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
    },
    {
      label: 'Recebido',
      value: data.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    {
      label: 'A receber',
      value: data.toReceive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
    { label: 'Inadimplência', value: `${data.delinquencyRate}%` },
    {
      label: 'Fluxo de caixa',
      value: data.cashflowBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-testid="finance-dashboard">
      {cards.map((c) => (
        <div key={c.label} className="rounded border border-zinc-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{c.label}</p>
          <p className="mt-2 text-2xl font-bold text-[#A3001B]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
