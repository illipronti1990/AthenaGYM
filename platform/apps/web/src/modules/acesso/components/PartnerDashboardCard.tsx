'use client';

import { useEffect, useState } from 'react';
import { Button } from '@movvo/ui';
import { useToast } from '@/components/ui/Toast';
import { integracoesApi } from '../services/acessoApi';

type Dash = Awaited<ReturnType<typeof integracoesApi.dashboard>>;

export function PartnerDashboardCard({
  accessToken,
  provider,
}: {
  accessToken: string;
  provider: 'wellhub' | 'totalpass';
}) {
  const { push } = useToast();
  const [dash, setDash] = useState<Dash | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setDash(await integracoesApi.dashboard(accessToken, provider));
  }

  useEffect(() => {
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, provider]);

  async function syncMembers() {
    setBusy(true);
    try {
      const r = await integracoesApi.syncMembers(accessToken, provider);
      push(`Sync membros: ${r.synced}`);
      await refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha no sync', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function syncCheckins() {
    setBusy(true);
    try {
      const r = await integracoesApi.syncCheckins(accessToken, provider);
      push(`Sync check-ins: ${r.imported}`);
      await refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha no sync', 'error');
    } finally {
      setBusy(false);
    }
  }

  const title = provider === 'wellhub' ? 'Wellhub' : 'TotalPass';

  return (
    <div
      className="space-y-4 rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-5"
      data-testid={`partner-dash-${provider}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="movvo-title text-xl">{title}</h2>
          <p className="text-xs text-[var(--muted)]">
            {dash?.status || '…'}
            {dash?.lastSyncAt
              ? ` · sync ${new Date(dash.lastSyncAt).toLocaleString('pt-BR')}`
              : ''}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Check-ins hoje" value={dash?.checkinsToday ?? '—'} />
        <Metric label="Pendências" value={dash?.pendingApprovals ?? '—'} />
        <Metric
          label="Receita prev. (stub)"
          value={
            dash
              ? dash.estimatedRevenueStub.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'
          }
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void syncMembers()}>
          Sync membros
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void syncCheckins()}
        >
          Sync check-ins
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
