import {
  averageTicket,
  buildInsights,
  campaignRoi,
  campaignStars,
  churnRate,
  conversionRate,
  deltaPercent,
  forecastSeries,
  predictChurn,
  predictLeadConversion,
  toCsv,
} from '@athena/sdk-bi';

describe('analytics BI rules', () => {
  it('computes KPI helpers', () => {
    expect(averageTicket(1000, 10)).toBe(100);
    expect(conversionRate(42, 100)).toBe(42);
    expect(churnRate(23, 1000)).toBe(2.3);
    expect(deltaPercent(118, 100)).toBe(18);
  });

  it('predicts critical churn with reasons', () => {
    const pred = predictChurn({
      daysSinceLastCheckin: 28,
      missedWorkouts30d: 9,
      overdueInvoices: 2,
      complaints90d: 1,
      planMonthsRemaining: 1,
      workoutFreshnessDays: 50,
      checkins30d: 1,
    });
    expect(pred.score).toBeGreaterThanOrEqual(0.8);
    expect(pred.label).toBe('critical');
    expect(pred.recommendation).toMatch(/contato/i);
    expect(pred.reasons.length).toBeGreaterThan(0);
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

  it('forecasts from series', () => {
    const f = forecastSeries([10, 12, 14, 16], 1);
    expect(f.value).toBeGreaterThan(0);
    expect(f.confidence).toBeGreaterThan(40);
  });

  it('builds actionable insights', () => {
    const insights = buildInsights({
      delinquencyDeltaPct: 12,
      occupancyPct: 98,
      cancellationsDeltaPct: 5,
      premiumFrequencyDeltaPct: -18,
      cashAvailable: 1000,
      revenueDeltaPct: 2,
    });
    expect(insights.some((i) => i.code === 'delinquency_up')).toBe(true);
    expect(insights.some((i) => i.code === 'peak_occupancy')).toBe(true);
  });

  it('computes campaign ROI stars', () => {
    expect(campaignRoi(415, 100)).toBe(315);
    expect(campaignStars(315, 0.9)).toBe(5);
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
