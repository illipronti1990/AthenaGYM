'use client';

import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/config/navigation';
import { polishApi } from '@/modules/polish/services/polishApi';

export function Footer() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [dbOnline, setDbOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    async function ping() {
      try {
        const health = await polishApi.health();
        if (!alive) return;
        setApiOnline(health.checks?.api?.status === 'ok' || health.status === 'ok');
        setDbOnline(health.checks?.database?.status === 'ok');
      } catch {
        if (!alive) return;
        setApiOnline(false);
        setDbOnline(false);
      }
    }
    void ping();
    const id = setInterval(() => void ping(), 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <footer className="athena-footer" data-testid="app-footer">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold tracking-wide text-[var(--gold)]">ATHENA ERP</span>
        <span className="athena-caption">Versão {APP_VERSION}</span>
        <StatusDot label="API" online={apiOnline} />
        <StatusDot label="Banco" online={dbOnline} />
      </div>
      <p className="athena-caption">© {new Date().getFullYear()}</p>
    </footer>
  );
}

function StatusDot({ label, online }: { label: string; online: boolean | null }) {
  const color =
    online === null ? 'var(--muted)' : online ? 'var(--success)' : 'var(--danger)';
  const text = online === null ? '…' : online ? 'Online' : 'Offline';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label} {text}
    </span>
  );
}
