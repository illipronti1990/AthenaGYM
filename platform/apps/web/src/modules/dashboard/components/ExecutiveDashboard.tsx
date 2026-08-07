'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CommandDashboard, DashboardChartPeriod, DashboardLayoutItem } from '@movvo/shared';
import {
  Button,
  ErrorState,
  Page,
  PageHeader,
  PageContent,
  pageQualityAttrs,
} from '@movvo/ui';
import { Settings2 } from 'lucide-react';
import { useBranding } from '@/components/BrandingProvider';
import { dashboardApi } from '../services/dashboardApi';
import { useToast } from '@/components/ui/Toast';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { CACHE_TTL } from '@/lib/queryKeys';
import { useUiPreferences } from '@/hooks/useUiPreferences';
import { greetingEmoji } from '../utils/format';
import { QuickActions } from './QuickActions';
import { KpiCard } from './KpiCard';
import { DaySummaryCard } from './DaySummaryCard';
import { AlertsWidget } from './AlertsWidget';
import { FinanceSnapshotWidget } from './FinanceSnapshotWidget';
import { CommercialSnapshotWidget } from './CommercialSnapshotWidget';
import { AgendaWidget } from './AgendaWidget';
import { BirthdayWidget } from './BirthdayWidget';
import { DuesWidget } from './DuesWidget';
import { GoalWidget } from './GoalWidget';
import { RankingWidget } from './RankingWidget';
import { ActivityTimeline } from './ActivityTimeline';
import { DashboardGrid, type DashboardTile } from './DashboardGrid';
import { FALLBACK_DASHBOARD_LAYOUT } from '../utils/layout';

const RevenueChart = dynamic(() => import('./RevenueChart').then((m) => m.RevenueChart), {
  ssr: false,
  loading: () => <div className="movvo-card h-48 animate-pulse" />,
});
const CheckinChart = dynamic(() => import('./CheckinChart').then((m) => m.CheckinChart), {
  ssr: false,
  loading: () => <div className="movvo-card h-48 animate-pulse" />,
});
const DashboardCustomizer = dynamic(
  () => import('./DashboardCustomizer').then((m) => m.DashboardCustomizer),
  { ssr: false },
);

function normalizeDashboard(raw: CommandDashboard, firstName: string): CommandDashboard {
  const greeting = raw.daySummary?.greeting || `Olá, ${firstName}`;
  return {
    ...raw,
    daySummary: raw.daySummary ?? {
      greeting,
      items: [],
      forecastRevenue: 0,
    },
    alerts: raw.alerts ?? [],
    financeSnapshot: raw.financeSnapshot ?? { inflows: 0, outflows: 0, balance: 0 },
    commercialSnapshot: raw.commercialSnapshot ?? {
      newStudents: 0,
      cancellations: 0,
      conversionRate: 0,
    },
    kpis: raw.kpis ?? [],
    revenueChart: raw.revenueChart ?? [],
    checkinChart: raw.checkinChart ?? [],
    agenda: raw.agenda ?? [],
    activities: raw.activities ?? [],
    dues: raw.dues ?? { dueToday: 0, overdue: 0, receivedMonth: 0 },
    birthdays: raw.birthdays ?? [],
    goals: raw.goals ?? [],
    ranking: raw.ranking ?? [],
    layout: raw.layout?.length ? raw.layout : FALLBACK_DASHBOARD_LAYOUT,
    greetingHint: raw.greetingHint ?? `${greeting} · Centro de comando da academia`,
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  };
}

export function ExecutiveDashboard({
  accessToken,
  userName,
  unitName,
}: {
  accessToken: string;
  userName?: string | null;
  unitName?: string | null;
}) {
  const { push } = useToast();
  const qc = useQueryClient();
  const { branding } = useBranding();
  const { prefs } = useUiPreferences();
  const [period, setPeriod] = useState<DashboardChartPeriod>('30d');
  const [customOpen, setCustomOpen] = useState(false);
  const [draftLayout, setDraftLayout] = useState<DashboardLayoutItem[] | null>(null);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const firstName = (userName || 'gestor').split(' ')[0];

  const query = useQuery({
    queryKey: ['executive-dashboard', period, firstName],
    queryFn: async () => {
      const payload = await dashboardApi.executive(accessToken, period, firstName);
      return normalizeDashboard(payload, firstName);
    },
    staleTime: CACHE_TTL.kpis,
    refetchInterval: tabVisible ? CACHE_TTL.kpis : false,
  });

  const saveMutation = useMutation({
    mutationFn: (layout: DashboardLayoutItem[]) => dashboardApi.saveLayout(accessToken, layout),
    onSuccess: (layout) => {
      qc.setQueryData(['executive-dashboard', period, firstName], (prev: typeof query.data) =>
        prev ? { ...prev, layout } : prev,
      );
      push('Layout do dashboard salvo');
      setCustomOpen(false);
      setDraftLayout(null);
    },
    onError: (e: Error) => {
      setDraftLayout(null);
      push(e.message || 'Falha ao salvar layout', 'error');
      void query.refetch();
    },
  });

  const data = query.data;
  const layout = draftLayout || data?.layout || [];

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });

  const tiles: DashboardTile[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: 'daySummary',
        span: 'full',
        node: <DaySummaryCard summary={data.daySummary} />,
      },
      {
        id: 'alerts',
        node: <AlertsWidget alerts={data.alerts} />,
      },
      { id: 'quickActions', span: 'full', node: <QuickActions /> },
      {
        id: 'kpis',
        span: 'full',
        node: (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" data-testid="kpi-grid">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        ),
      },
      {
        id: 'financeSnapshot',
        node: <FinanceSnapshotWidget snapshot={data.financeSnapshot} />,
      },
      {
        id: 'commercialSnapshot',
        node: <CommercialSnapshotWidget snapshot={data.commercialSnapshot} />,
      },
      {
        id: 'revenueChart',
        node: <RevenueChart data={data.revenueChart} period={period} onPeriod={setPeriod} />,
      },
      { id: 'checkinChart', node: <CheckinChart data={data.checkinChart} /> },
      { id: 'agenda', node: <AgendaWidget items={data.agenda} /> },
      { id: 'activities', node: <ActivityTimeline items={data.activities} /> },
      { id: 'dues', node: <DuesWidget dues={data.dues} /> },
      { id: 'birthdays', node: <BirthdayWidget items={data.birthdays} /> },
      { id: 'goals', node: <GoalWidget goals={data.goals} /> },
      { id: 'ranking', node: <RankingWidget rows={data.ranking} /> },
    ];
  }, [data, period]);

  function persistLayout(next: DashboardLayoutItem[]) {
    setDraftLayout(next);
    saveMutation.mutate(next);
  }

  if (query.isLoading && !data) {
    return <SkeletonDashboard />;
  }

  if (query.isError && !data) {
    return (
      <Page>
        <PageHeader title="Dashboard" description="Centro de comando da academia." />
        <PageContent>
          <ErrorState
            title="Não foi possível carregar o dashboard"
            description="Verifique a conexão e tente novamente."
            action={
              <Button type="button" onClick={() => void query.refetch()}>
                Tentar novamente
              </Button>
            }
          />
        </PageContent>
      </Page>
    );
  }

  const brandName = branding.displayName || 'Athena Academia';
  const unitLabel = unitName || 'Unidade';

  return (
    <div className={prefs.widgetsCompact ? 'widgets-compact' : undefined}>
    <Page {...pageQualityAttrs()} data-testid="executive-dashboard">
      <PageHeader
        title={brandName}
        icon={
          branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-9 w-auto object-contain" />
          ) : undefined
        }
        description={`${unitLabel} · ${data?.greetingHint?.split('·')[0]?.trim() || `Olá, ${firstName}`} ${greetingEmoji()} · ${dateLabel}`}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setDraftLayout(layout);
              setCustomOpen(true);
            }}
          >
            <Settings2 size={16} /> Personalizar
          </Button>
        }
      />

      <PageContent>
        <DashboardGrid
          layout={layout}
          tiles={tiles}
          onReorder={(next) => persistLayout(next)}
        />
      </PageContent>

      <DashboardCustomizer
        open={customOpen}
        layout={draftLayout || layout}
        onClose={() => {
          setCustomOpen(false);
          setDraftLayout(null);
        }}
        onChange={setDraftLayout}
        onSave={() => {
          if (draftLayout) saveMutation.mutate(draftLayout);
        }}
        saving={saveMutation.isPending}
      />
    </Page>
    </div>
  );
}
