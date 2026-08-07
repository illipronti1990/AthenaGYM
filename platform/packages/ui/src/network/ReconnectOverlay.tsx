'use client';

import { useNetworkStatus } from './NetworkStatus';

export function ReconnectOverlay() {
  const { online, apiHealthy, reconnecting, countdown } = useNetworkStatus();
  if (!reconnecting || (online && apiHealthy)) return null;

  return (
    <div
      className="movvo-reconnect"
      role="alert"
      aria-live="assertive"
      data-testid="reconnect-overlay"
    >
      <div className="movvo-reconnect-card">
        <p className="movvo-h3">Reconectando…</p>
        <p className="movvo-muted mt-1 text-sm">
          {!online ? 'Sem conexão com a internet.' : 'A API está temporariamente indisponível.'}
        </p>
        <p className="movvo-reconnect-count" aria-label={`Nova tentativa em ${countdown} segundos`}>
          {countdown}
        </p>
      </div>
    </div>
  );
}
