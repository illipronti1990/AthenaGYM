'use client';

import { useEffect, useState } from 'react';
import type { SalesDashboard } from '@athena/shared';
import { Card, chartColors } from '@athena/ui';
import { salesApi } from '../services/salesApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export function SalesDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<SalesDashboard | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await salesApi.dashboard(accessToken));
      } catch (e) {
        push(e instanceof Error ? e.message : 'Falha dashboard', 'error');
        setData({ newLeads: 0, scheduledVisits: 0, enrollments: 0, conversionRate: 0 });
      }
    })();
  }, [accessToken, push]);

  if (!data) return <TableSkeleton rows={4} />;

  const cards = [
    { label: 'Novos leads (30d)', value: data.newLeads, color: chartColors.revenue },
    { label: 'Visitas agendadas', value: data.scheduledVisits, color: chartColors.workouts },
    { label: 'Matrículas ativas', value: data.enrollments, color: chartColors.checkins },
    { label: 'Conversão', value: `${data.conversionRate}%`, color: chartColors.finance },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="sales-dashboard">
      {cards.map((c) => (
        <Card key={c.label} hover>
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: c.color }}>
            {c.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
