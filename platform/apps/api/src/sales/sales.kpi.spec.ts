import { calcConversionRate } from '@movvo/shared';

describe('sales KPIs', () => {
  it('calcConversionRate', () => {
    expect(calcConversionRate(0, 0)).toBe(0);
    expect(calcConversionRate(1, 4)).toBe(25);
    expect(calcConversionRate(11, 52)).toBe(21.2);
  });
});
