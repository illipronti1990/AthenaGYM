import type { DashboardLayoutItem } from '@movvo/shared';

/** Local fallback — evita importar o barrel CJS de @movvo/shared no client. */
export const FALLBACK_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { id: 'daySummary', visible: true, order: 0 },
  { id: 'alerts', visible: true, order: 1 },
  { id: 'quickActions', visible: true, order: 2 },
  { id: 'kpis', visible: true, order: 3 },
  { id: 'financeSnapshot', visible: true, order: 4 },
  { id: 'commercialSnapshot', visible: true, order: 5 },
  { id: 'revenueChart', visible: true, order: 6 },
  { id: 'checkinChart', visible: true, order: 7 },
  { id: 'agenda', visible: true, order: 8 },
  { id: 'activities', visible: true, order: 9 },
  { id: 'dues', visible: true, order: 10 },
  { id: 'birthdays', visible: true, order: 11 },
  { id: 'goals', visible: true, order: 12 },
  { id: 'ranking', visible: true, order: 13 },
];
