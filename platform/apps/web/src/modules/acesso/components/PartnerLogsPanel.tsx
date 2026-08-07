'use client';

import { useEffect, useState } from 'react';
import type { PartnerApiLog } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { useToast } from '@/components/ui/Toast';
import { integracoesApi } from '../services/acessoApi';

export function PartnerLogsPanel({
  accessToken,
  provider,
}: {
  accessToken: string;
  provider?: string;
}) {
  const { push } = useToast();
  const [logs, setLogs] = useState<PartnerApiLog[]>([]);

  async function refresh() {
    setLogs(await integracoesApi.logs(accessToken, provider));
  }

  useEffect(() => {
    refresh().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, provider]);

  async function retry(id: string) {
    try {
      await integracoesApi.retryLog(accessToken, id);
      push('Retry enviado');
      await refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha no retry', 'error');
    }
  }

  return (
    <ul
      className="divide-y divide-[var(--border)] rounded-[10px] border border-[var(--border)] bg-[var(--card)]"
      data-testid="partner-logs"
    >
      {logs.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">
              {l.provider} · {l.endpoint}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {l.status}
              {l.error ? ` · ${l.error}` : ''}
              {l.durationMs != null ? ` · ${l.durationMs}ms` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted)]">
              {new Date(l.createdAt).toLocaleString('pt-BR')}
            </span>
            {l.status === 'failed' ? (
              <Button type="button" variant="secondary" onClick={() => void retry(l.id)}>
                Retry
              </Button>
            ) : null}
          </div>
        </li>
      ))}
      {logs.length === 0 ? (
        <li className="px-4 py-6 text-sm text-[var(--muted)]">Nenhum log ainda.</li>
      ) : null}
    </ul>
  );
}
