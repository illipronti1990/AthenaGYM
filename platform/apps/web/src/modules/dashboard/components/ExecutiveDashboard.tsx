'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DashboardChartPeriod, DashboardLayoutItem } from '@athena/shared';
import { Button, ErrorState, Page, PageHeader, PageContent } from '@athena/ui';
import { Settings2 } from 'lucide-react';
import { dashboardApi } from '../services/dashboardApi';
import { useToast } from '@/components/ui/Toast';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { greetingEmoji } from '../utils/format';
import { QuickActions } from './QuickActions';
import { KpiCard } from './KpiCard';
import { RevenueChart } from './RevenueChart';
import { CheckinChart } from './CheckinChart';
import { AgendaWidget } from './AgendaWidget';
import { ActivityTimeline } from './ActivityTimeline';
import { BirthdayWidget } from './BirthdayWidget';
import { DuesWidget } from './DuesWidget';
import { GoalWidget } from './GoalWidget';
import { RankingWidget } from './RankingWidget';
import { DashboardCustomizer } from './DashboardCustomizer';
import { DashboardGrid, type DashboardTile } from './DashboardGrid';

export function ExecutiveDashboard({
  accessToken,
  userName,
}: {
  accessToken: string;
  userName?: string | null;
}) {
  const { push } = useToast();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<DashboardChartPeriod>('30d');
  const [customOpen, setCustomOpen] = useState(false);
  const [draftLayout, setDraftLayout] = useState<DashboardLayoutItem[] | null>(null);

  const firstName = (userName || 'gestor').split(' ')[0];

  const query = useQuery({
    queryKey: ['executive-dashboard', period, firstName],
    queryFn: () => dashboardApi.executive(accessToken, period, firstName),
    refetchInterval: 30_000,
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
    onError: (e: Error) => push(e.message || 'Falha ao salvar layout', 'error'),
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

  return (
    <Page data-testid="executive-dashboard">
      <PageHeader
        title={`${data?.greetingHint?.split('·')[0]?.trim() || `Olá, ${firstName}`} ${greetingEmoji()}`}
        description={`${dateLabel} · ${data?.greetingHint?.split('·')[1]?.trim() || 'Centro de comando da academia'}`}
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
  );
}
