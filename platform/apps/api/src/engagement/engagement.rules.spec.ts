import { LOYALTY_POINTS, loyaltyTier } from '@movvo/sdk-notifications';

describe('engagement loyalty rules', () => {
  it('defines point rules', () => {
    expect(LOYALTY_POINTS.checkin).toBe(10);
    expect(LOYALTY_POINTS.workoutComplete).toBe(20);
    expect(LOYALTY_POINTS.referral).toBe(100);
  });

  it('computes tiers', () => {
    expect(loyaltyTier(0)).toBe('bronze');
    expect(loyaltyTier(500)).toBe('silver');
    expect(loyaltyTier(2000)).toBe('gold');
    expect(loyaltyTier(5000)).toBe('platinum');
  });
});
