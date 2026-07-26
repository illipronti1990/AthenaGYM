import { normalizeCpf, isValidCpf } from '@athena/shared';

export { normalizeCpf, isValidCpf };

export function assertValidCpf(cpf: string | null | undefined): string | null {
  if (cpf == null || String(cpf).trim() === '') return null;
  const digits = normalizeCpf(cpf);
  if (!isValidCpf(digits)) {
    throw new Error('CPF inválido');
  }
  return digits;
}
