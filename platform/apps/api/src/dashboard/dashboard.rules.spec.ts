import { DEFAULT_DASHBOARD_LAYOUT, layoutForPreset, percentDelta } from '@movvo/shared';
import {
  activityKindFromAudit,
  greetingForHour,
  goalProgress,
  normalizeLayout,
} from './dashboard.rules';

describe('dashboard.rules', () => {
  it('normalizes empty layout to defaults including G-2 widgets', () => {
    const layout = normalizeLayout([]);
    expect(layout.map((i) => i.id)).toEqual(DEFAULT_DASHBOARD_LAYOUT.map((i) => i.id));
    expect(layout.some((i) => i.id === 'daySummary')).toBe(true);
    expect(layout.some((i) => i.id === 'alerts')).toBe(true);
  });

  it('dedupes and fills missing widgets', () => {
    const layout = normalizeLayout([
      { id: 'kpis', visible: true, order: 0 },
      { id: 'kpis', visible: false, order: 1 },
      { id: 'unknown', visible: true, order: 2 },
    ]);
    expect(layout.filter((i) => i.id === 'kpis')).toHaveLength(1);
    expect(layout.some((i) => i.id === 'agenda')).toBe(true);
    expect(layout.some((i) => (i as { id: string }).id === 'unknown')).toBe(false);
  });

  it('greets by hour', () => {
    expect(greetingForHour(8, 'Renan')).toContain('Bom dia');
    expect(greetingForHour(15, 'Renan')).toContain('Boa tarde');
    expect(greetingForHour(21, 'Renan')).toContain('Boa noite');
  });

  it('computes goal progress capped at 100', () => {
    expect(goalProgress(82, 100)).toBe(82);
    expect(goalProgress(150, 100)).toBe(100);
    expect(goalProgress(10, 0)).toBe(0);
  });

  it('computes percent delta', () => {
    expect(percentDelta(118, 100)).toBe(18);
    expect(percentDelta(50, 0)).toBe(100);
    expect(percentDelta(0, 0)).toBe(0);
  });

  it('maps audit to activity kind', () => {
    expect(activityKindFromAudit('operations', 'checkin')).toBe('checkin');
    expect(activityKindFromAudit('finance', 'payment')).toBe('payment');
    expect(activityKindFromAudit('sales', 'enroll')).toBe('enrollment');
  });

  it('applies role preset when no saved layout', () => {
    const finance = layoutForPreset('finance', null);
    expect(finance.find((i) => i.id === 'financeSnapshot')?.visible).toBe(true);
    expect(finance.find((i) => i.id === 'ranking')?.visible).toBe(false);

    const trainer = layoutForPreset('trainer', null);
    expect(trainer.find((i) => i.id === 'agenda')?.visible).toBe(true);
    expect(trainer.find((i) => i.id === 'financeSnapshot')?.visible).toBe(false);
  });
});
