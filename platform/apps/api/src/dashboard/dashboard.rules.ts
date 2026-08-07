import {
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardLayoutItem,
  type DashboardWidgetId,
} from '@movvo/shared';
import { percentDelta } from '@movvo/shared';

const VALID = new Set(DEFAULT_DASHBOARD_LAYOUT.map((i) => i.id));

export function normalizeLayout(input: unknown): DashboardLayoutItem[] {
  if (!Array.isArray(input) || input.length === 0) {
    return DEFAULT_DASHBOARD_LAYOUT.map((i) => ({ ...i }));
  }

  const seen = new Set<DashboardWidgetId>();
  const cleaned: DashboardLayoutItem[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const id = (raw as { id?: string }).id as DashboardWidgetId | undefined;
    if (!id || !VALID.has(id) || seen.has(id)) continue;
    seen.add(id);
    cleaned.push({
      id,
      visible: (raw as { visible?: boolean }).visible !== false,
      order: Number((raw as { order?: number }).order) || cleaned.length,
      collapsed: Boolean((raw as { collapsed?: boolean }).collapsed),
    });
  }

  for (const def of DEFAULT_DASHBOARD_LAYOUT) {
    if (!seen.has(def.id)) {
      cleaned.push({ ...def, order: cleaned.length });
    }
  }

  return cleaned
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));
}

export function greetingForHour(hour: number, firstName: string): string {
  const name = firstName?.trim() || 'gestor';
  if (hour >= 5 && hour < 12) return `Bom dia, ${name}`;
  if (hour >= 12 && hour < 18) return `Boa tarde, ${name}`;
  return `Boa noite, ${name}`;
}

export function goalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export { percentDelta };

export function activityKindFromAudit(module: string, action: string): string {
  const m = `${module}.${action}`.toLowerCase();
  if (m.includes('checkin') || m.includes('check-in')) return 'checkin';
  if (m.includes('payment') || m.includes('receivable') || m.includes('finance')) return 'payment';
  if (m.includes('enroll')) return 'enrollment';
  if (m.includes('assessment') || m.includes('avali')) return 'assessment';
  if (m.includes('workout') || m.includes('treino')) return 'workout';
  if (m.includes('student') || m.includes('aluno')) return 'student';
  return 'other';
}
