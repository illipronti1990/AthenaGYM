'use client';

import { useEffect, useState } from 'react';
import { Card, chartColors } from '@athena/ui';
import type { CrmDashboardView } from '../../services/crmApi';
import { crmApi } from '../../services/crmApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { BirthdayWidget } from './BirthdayWidget';
import { ChurnRiskCard } from '../risk/ChurnRiskCard';

export function CrmDashboard({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<CrmDashboardView | null>(null);

  useEffect(() => {
    crmApi
      .dashboard(accessToken)
      .then(setData)
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Falha ao carregar dashboard CRM', 'error');
        setData({
          openLeads: 0,
          newLeadsToday: 0,
          totalReferrals: 0,
          pendingReferrals: 0,
          npsScore: 0,
          totalNpsResponses: 0,
          activeSegments: 0,
          activeAutomations: 0,
          activeLeads: 0,
          conversionRate: 0,
          churnRisk: 0,
          birthdaysThisWeek: 0,
          loyaltyMembers: 0,
        });
      });
  }, [accessToken, push]);

  if (!data) return <TableSkeleton rows={4} />;

  const kpis = [
    { label: 'Leads ativos', value: data.activeLeads ?? data.openLeads, color: chartColors.revenue },
    { label: 'Conversão', value: `${data.conversionRate ?? 0}%`, color: chartColors.workouts },
    { label: 'Risco de churn', value: data.churnRisk ?? 0, color: chartColors.finance },
    { label: 'NPS', value: data.npsScore, color: chartColors.checkins },
    { label: 'Indicações', value: data.pendingReferrals, color: chartColors.revenue },
  ];

  return (
    <div className="space-y-6" data-testid="crm-dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} hover>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{k.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: k.color }}>
              {k.value}
            </p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <BirthdayWidget accessToken={accessToken} />
        <ChurnRiskCard accessToken={accessToken} preview />
      </div>
    </div>
  );
}
