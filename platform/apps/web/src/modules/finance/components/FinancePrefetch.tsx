'use client';

import { useMemo } from 'react';
import { FINANCE_PREFETCH, usePrefetchRoutes } from '@/lib/prefetch';

export function FinancePrefetch() {
  const routes = useMemo(() => [...FINANCE_PREFETCH], []);
  usePrefetchRoutes(routes);
  return null;
}
