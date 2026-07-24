import type { StudentStatus } from '../types';

export const STUDENT_STATUSES: StudentStatus[] = [
  'lead',
  'pre_registration',
  'active',
  'delinquent',
  'blocked',
  'cancelled',
  'archived',
];

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  lead: 'Lead',
  pre_registration: 'Pré Cadastro',
  active: 'Ativo',
  delinquent: 'Inadimplente',
  blocked: 'Bloqueado',
  cancelled: 'Cancelado',
  archived: 'Arquivado',
};

/** Digits only */
export function normalizeCpf(cpf: string | null | undefined): string {
  return String(cpf || '').replace(/\D/g, '');
}

/** Brazilian CPF checksum validation */
export function isValidCpf(cpf: string | null | undefined): boolean {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

export function formatCpf(cpf: string | null | undefined): string {
  const d = normalizeCpf(cpf);
  if (d.length !== 11) return cpf || '';
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
