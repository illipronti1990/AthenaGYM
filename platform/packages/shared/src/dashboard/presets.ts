import type { DashboardLayoutItem, DashboardRolePreset, DashboardWidgetId } from './types';
import { DEFAULT_DASHBOARD_LAYOUT, ROLE_DASHBOARD_WIDGETS } from './types';

export function resolveDashboardPreset(roles: string[]): DashboardRolePreset {
  const lower = roles.map((r) => r.toLowerCase());
  if (lower.some((r) => r.includes('super_admin') || r === 'admin' || r.includes('gerente') || r === 'manager')) {
    return 'admin';
  }
  if (lower.some((r) => r.includes('finance') || r.includes('financeiro'))) return 'finance';
  if (lower.some((r) => r.includes('reception') || r.includes('recep'))) return 'reception';
  if (lower.some((r) => r.includes('trainer') || r.includes('professor') || r.includes('personal'))) {
    return 'trainer';
  }
  return 'default';
}

/** Prefer saved layout; otherwise seed visibility from role preset. */
export function layoutForPreset(
  preset: DashboardRolePreset,
  saved?: DashboardLayoutItem[] | null,
): DashboardLayoutItem[] {
  if (saved && saved.length > 0) {
    return saved;
  }
  const allowed = new Set(ROLE_DASHBOARD_WIDGETS[preset]);
  return DEFAULT_DASHBOARD_LAYOUT.map((item, order) => ({
    ...item,
    order,
    visible: allowed.has(item.id as DashboardWidgetId),
  }));
}

export function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}
