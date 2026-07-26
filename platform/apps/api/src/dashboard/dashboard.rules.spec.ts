import { DEFAULT_DASHBOARD_LAYOUT } from '@athena/shared';
import { greetingForHour, goalProgress, normalizeLayout } from './dashboard.rules';

describe('dashboard.rules', () => {
  it('normalizes empty layout to defaults', () => {
    const layout = normalizeLayout([]);
    expect(layout.map((i) => i.id)).toEqual(DEFAULT_DASHBOARD_LAYOUT.map((i) => i.id));
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
});
