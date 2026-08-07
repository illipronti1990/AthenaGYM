'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Prefetch related routes when user lands on a hub (PX-7 intelligent prefetch). */
export function usePrefetchRoutes(routes: string[], enabled = true) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = window.setTimeout(() => {
      for (const href of routes) {
        try {
          router.prefetch(href);
        } catch {
          /* ignore */
        }
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [enabled, router, routes]);
}

export const FINANCE_PREFETCH = [
  '/app/financeiro/receber',
  '/app/financeiro/caixa',
  '/app/financeiro/fluxo-caixa',
  '/app/financeiro/pagar',
  '/app/financeiro/inadimplencia',
] as const;
