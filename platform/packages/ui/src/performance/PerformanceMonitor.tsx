'use client';

import { useEffect, useRef } from 'react';

export type PerfMetric = {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
};

type Props = {
  enabled?: boolean;
  onMetric?: (metric: PerfMetric) => void;
  /** POST endpoint for RUM samples (e.g. `/api/v1/observability/rum`). */
  rumEndpoint?: string;
  /** Flush buffer every N metrics (default 5). */
  rumFlushEvery?: number;
};

function rate(name: string, value: number): PerfMetric['rating'] {
  if (name === 'LCP') return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  if (name === 'INP' || name === 'FID')
    return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
  if (name === 'CLS') return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  if (name === 'TTFB') return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  if (name === 'FCP') return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
  return undefined;
}

/** Lightweight RUM: navigation timing + paint metrics (no third-party SDK). */
export function PerformanceMonitor({
  enabled = true,
  onMetric,
  rumEndpoint,
  rumFlushEvery = 5,
}: Props) {
  const bufferRef = useRef<PerfMetric[]>([]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return;
    }

    const flush = () => {
      if (!rumEndpoint || bufferRef.current.length === 0) return;
      const samples = bufferRef.current.splice(0, bufferRef.current.length).map((m) => ({
        name: m.name,
        value: m.value,
        rating: m.rating,
      }));
      void fetch(rumEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ samples, url: window.location.href }),
        keepalive: true,
      }).catch(() => {
        /* ignore network errors for RUM */
      });
    };

    const emit = (name: string, value: number) => {
      const metric: PerfMetric = { name, value, rating: rate(name, value) };
      onMetric?.(metric);
      try {
        const w = window as Window & { __MOVVO_PERF__?: PerfMetric[] };
        w.__MOVVO_PERF__ = w.__MOVVO_PERF__ || [];
        w.__MOVVO_PERF__.push(metric);
      } catch {
        /* ignore */
      }
      if (rumEndpoint) {
        bufferRef.current.push(metric);
        if (bufferRef.current.length >= rumFlushEvery) flush();
      }
    };

    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          emit('LCP', entry.startTime);
        }
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          emit('FCP', entry.startTime);
        }
        if (entry.entryType === 'layout-shift' && !(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          emit('CLS', (entry as PerformanceEntry & { value?: number }).value || 0);
        }
        if (entry.entryType === 'event' || entry.entryType === 'first-input') {
          const d = (entry as PerformanceEntry & { duration?: number; processingStart?: number })
            .processingStart
            ? (entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime
            : entry.duration;
          emit(entry.entryType === 'first-input' ? 'FID' : 'INP', d);
        }
      }
    });

    try {
      po.observe({ type: 'largest-contentful-paint', buffered: true } as PerformanceObserverInit);
      po.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit);
      po.observe({ type: 'first-input', buffered: true } as PerformanceObserverInit);
      po.observe({ type: 'paint', buffered: true } as PerformanceObserverInit);
    } catch {
      /* unsupported entry types */
    }

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) emit('TTFB', nav.responseStart);

    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });

    return () => {
      flush();
      po.disconnect();
      window.removeEventListener('pagehide', onHide);
    };
  }, [enabled, onMetric, rumEndpoint, rumFlushEvery]);

  return null;
}
