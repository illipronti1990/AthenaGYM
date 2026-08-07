import {
  isLowStock,
  isRupture,
  productMargin,
  signedStockDelta,
} from '@movvo/shared';

describe('inventory helpers (G-13)', () => {
  it('computes margin', () => {
    expect(productMargin(100, 40)).toBe(60);
    expect(productMargin(0, 10)).toBe(0);
  });

  it('detects low stock and rupture', () => {
    expect(isLowStock(3, 5)).toBe(true);
    expect(isLowStock(0, 5)).toBe(false);
    expect(isRupture(0)).toBe(true);
    expect(isRupture(2)).toBe(false);
  });

  it('signs stock delta for sale reservation', () => {
    expect(signedStockDelta('in', 5)).toBe(5);
    expect(signedStockDelta('out', 5)).toBe(-5);
    expect(signedStockDelta('loss', 2)).toBe(-2);
    expect(signedStockDelta('internal_consume', 1)).toBe(-1);
    expect(signedStockDelta('adjust', -3)).toBe(-3);
  });
});
