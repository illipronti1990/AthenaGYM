import {
  averageTicket,
  churnRate,
  conversionRate,
  deltaPercent,
  predictChurn,
  predictLeadConversion,
  toCsv,
} from '@athenas/sdk-bi';

describe('analytics BI rules', () => {
  it('computes KPI helpers', () => {
    expect(averageTicket(1000, 10)).toBe(100);
    expect(conversionRate(42, 100)).toBe(42);
    expect(churnRate(23, 1000)).toBe(2.3);
    expect(deltaPercent(118, 100)).toBe(18);
  });

  it('predicts critical churn', () => {
    const pred = predictChurn({
      daysSinceLastCheckin: 28,
      missedWorkouts30d: 9,
      overdueInvoices: 2,
      complaints90d: 1,
      planMonthsRemaining: 1,
    });
    expect(pred.score).toBeGreaterThanOrEqual(0.8);
    expect(pred.label).toBe('critical');
    expect(pred.recommendation).toMatch(/contato/i);
  });

  it('predicts lead conversion', () => {
    const score = predictLeadConversion({
      daysInPipeline: 5,
      touchpoints: 4,
      hasTrialClass: true,
      sourceQuality: 0.8,
    });
    expect(score).toBeGreaterThan(0.5);
  });

  it('builds csv export', () => {
    const csv = toCsv(
      [
        { date: '2026-07-01', checkins: 10 },
        { date: '2026-07-02', checkins: 12 },
      ],
      ['date', 'checkins'],
    );
    expect(csv.split('\n')).toHaveLength(3);
    expect(csv).toContain('date,checkins');
  });
});
