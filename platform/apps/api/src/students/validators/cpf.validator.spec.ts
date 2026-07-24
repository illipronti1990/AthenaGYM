import { isValidCpf, normalizeCpf } from '@athenas/shared';
import { assertValidCpf } from './cpf.validator';

describe('CPF helpers', () => {
  it('normalizes digits', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });

  it('validates known valid CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejects invalid CPF', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
  });

  it('assertValidCpf throws on invalid', () => {
    expect(() => assertValidCpf('000.000.000-00')).toThrow('CPF inválido');
  });

  it('assertValidCpf accepts empty as null', () => {
    expect(assertValidCpf('')).toBeNull();
    expect(assertValidCpf(undefined)).toBeNull();
  });
});
