import { calcBmi, calcBmr, isWorkoutExpired, leanMassKg, slugify } from '@movvo/exercise-engine';

describe('exercise-engine', () => {
  it('slugifies names', () => {
    expect(slugify('Agachamento Livre')).toBe('agachamento-livre');
  });

  it('calculates BMI and lean mass', () => {
    expect(calcBmi(80, 180)).toBeCloseTo(24.69, 1);
    expect(leanMassKg(80, 20)).toBe(64);
  });

  it('calculates BMR', () => {
    const male = calcBmr(80, 180, 30, 'male');
    expect(male).toBeGreaterThan(1600);
  });

  it('detects expired workout', () => {
    expect(isWorkoutExpired('2020-01-01', new Date('2026-01-01'))).toBe(true);
    expect(isWorkoutExpired(null)).toBe(false);
  });
});
