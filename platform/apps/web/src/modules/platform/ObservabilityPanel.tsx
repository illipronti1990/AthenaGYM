'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card } from '@movvo/ui';
import { PageState } from '@/components/ux/PageState';
import { useToast } from '@/components/ui/Toast';
import {
  observabilityApi,
  type CacheHealthPayload,
  type HealthPayload,
  type ObservabilityStatus,
} from '@/services/observabilityApi';

function StatusPill({ status }: { status?: string }) {
  const s = (status || 'unknown').toLowerCase();
  const color =
    s === 'ok' || s === 'up'
      ? 'text-emerald-600'
      : s === 'degraded' || s === 'unknown'
        ? 'text-amber-600'
        : 'text-red-600';
  return <span className={`font-semibold uppercase ${color}`}>{status || '—'}</span>;
}

function parseMetricsSummary(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const [name, value] = line.trim().split(/\s+/);
    if (name && value != null) out[name] = value;
  }
  return out;
}

export function ObservabilityPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [cache, setCache] = useState<CacheHealthPayload | null>(null);
  const [queues, setQueues] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState<ObservabilityStatus | null>(null);
  const [metrics, setMetrics] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [h, c, q, st, m] = await Promise.all([
        observabilityApi.health().catch(() => null),
        observabilityApi.healthCache().catch(() => null),
        observabilityApi.healthQueues().catch(() => null),
        observabilityApi.status(accessToken).catch(() => null),
        observabilityApi
          .metricsText()
          .then(parseMetricsSummary)
          .catch(() => null),
      ]);
      setHealth(h);
      setCache(c);
      setQueues(q);
      setStatus(st);
      setMetrics(m);
      if (!h && !st) push('Não foi possível carregar observabilidade', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, push]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading && !health && !status) {
    return <PageState state="loading" skeleton="dashboard" />;
  }

  const checks = health?.checks || {};
  const cacheStats = cache?.stats || (status?.cache as CacheHealthPayload['stats']) || {};
  const metricCards = [
    ['HTTP requests', metrics?.movvo_http_requests_total],
    ['HTTP 5xx', metrics?.movvo_http_errors_total],
    ['Latency avg (ms)', metrics?.movvo_http_latency_avg_ms],
    ['Cache hits', metrics?.movvo_cache_hits ?? String(cacheStats.hits ?? '—')],
    ['Cache misses', metrics?.movvo_cache_misses ?? String(cacheStats.misses ?? '—')],
    [
      'Cache hit rate',
      metrics?.movvo_cache_hit_rate ??
        (cacheStats.hitRate != null ? Number(cacheStats.hitRate).toFixed(3) : '—'),
    ],
  ];

  return (
    <div className="space-y-6" data-testid="platform-observability">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted)]">
          Atualizado: {status?.generatedAt || health?.timestamp || '—'}
        </p>
        <Button type="button" variant="secondary" onClick={() => void reload()}>
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">API health</p>
          <p className="mt-1 text-xl">
            <StatusPill status={health?.status} />
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">{health?.version || ''}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Redis / cache</p>
          <p className="mt-1 text-xl">
            <StatusPill status={cache?.status || (status?.redis?.ok ? 'ok' : 'down')} />
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {cache?.latencyMs != null ? `${cache.latencyMs} ms` : status?.redis?.latencyMs != null ? `${status.redis.latencyMs} ms` : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Database</p>
          <p className="mt-1 text-xl">
            <StatusPill
              status={
                String((checks.database as { status?: string } | undefined)?.status) ||
                status?.database?.status
              }
            />
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {status?.database?.latencyMs != null ? `${status.database.latencyMs} ms` : '—'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--muted)]">Worker / filas</p>
          <p className="mt-1 text-xl">
            <StatusPill
              status={
                String(queues?.status) ||
                String((status?.worker as { status?: string } | undefined)?.status) ||
                String((checks.worker as { status?: string } | undefined)?.status)
              }
            />
          </p>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Métricas Prometheus</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metricCards.map(([label, value]) => (
            <Card key={String(label)} className="p-4">
              <p className="text-xs text-[var(--muted)]">{label}</p>
              <p className="mt-1 text-2xl font-semibold">{String(value ?? '—')}</p>
            </Card>
          ))}
        </div>
        <p className="text-xs text-[var(--muted)]">
          Endpoint público:{' '}
          <code className="rounded bg-[var(--surface)] px-1">GET /api/v1/metrics</code>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Status detalhado</h2>
        <Card className="overflow-x-auto p-4">
          <pre className="max-h-80 overflow-auto text-xs text-[var(--muted)]">
            {JSON.stringify(
              {
                health,
                cache,
                queues,
                status,
              },
              null,
              2,
            )}
          </pre>
        </Card>
        {status?.rumSamplesIngested != null ? (
          <p className="text-sm text-[var(--muted)]">
            RUM samples ingeridos (processo): {status.rumSamplesIngested} · Sentry:{' '}
            {status.sentryEnabled ? 'on' : 'off'}
          </p>
        ) : null}
      </section>
    </div>
  );
}
