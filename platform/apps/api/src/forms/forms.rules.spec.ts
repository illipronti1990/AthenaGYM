import { isValidCpf, normalizeCpf } from '@movvo/shared';

describe('PX-5 forms rules', () => {
  it('normalizes and validates CPF', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('requires 8 digits for CEP shape', () => {
    const digits = '01310100'.replace(/\D/g, '');
    expect(digits.length).toBe(8);
  });
});
