'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type NetworkCtx = {
  online: boolean;
  apiHealthy: boolean;
  reconnecting: boolean;
  countdown: number;
};

const Ctx = createContext<NetworkCtx | null>(null);

export function NetworkStatusProvider({
  children,
  healthCheckUrl,
  intervalMs = 15_000,
}: {
  children: ReactNode;
  /** Optional lightweight health endpoint (e.g. /api/v1/health) */
  healthCheckUrl?: string;
  intervalMs?: number;
}) {
  const [online, setOnline] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  useEffect(() => {
    if (!healthCheckUrl) return;
    const url = healthCheckUrl;

    let cancelled = false;
    let failures = 0;

    async function ping() {
      if (!navigator.onLine) {
        setApiHealthy(false);
        return;
      }
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          method: 'GET',
          mode: 'cors',
        });
        if (cancelled) return;
        if (res.ok) {
          failures = 0;
          setApiHealthy(true);
        } else {
          failures += 1;
          if (failures >= 2) setApiHealthy(false);
        }
      } catch {
        if (cancelled) return;
        failures += 1;
        if (failures >= 2) setApiHealthy(false);
      }
    }

    void ping();
    const id = window.setInterval(() => void ping(), intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [healthCheckUrl, intervalMs]);

  useEffect(() => {
    const down = !online || !apiHealthy;
    if (!down) {
      setReconnecting(false);
      setCountdown(0);
      return;
    }

    setReconnecting(true);
    let n = 3;
    setCountdown(n);
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        n = 3;
        if (navigator.onLine && healthCheckUrl) {
          void fetch(healthCheckUrl, { cache: 'no-store' })
            .then((r) => setApiHealthy(r.ok))
            .catch(() => setApiHealthy(false));
        }
      }
      setCountdown(n);
    }, 1000);

    return () => window.clearInterval(id);
  }, [online, apiHealthy, healthCheckUrl]);

  const value = useMemo(
    () => ({ online, apiHealthy, reconnecting, countdown }),
    [online, apiHealthy, reconnecting, countdown],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNetworkStatus() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return { online: true, apiHealthy: true, reconnecting: false, countdown: 0 };
  }
  return ctx;
}
