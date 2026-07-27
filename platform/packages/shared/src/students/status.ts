import type { StudentStatus } from '../types';

/** Status exibido na UI (CRM) — derivado do status DB + contexto financeiro */
export type StudentDisplayStatus =
  | 'active'
  | 'pending'
  | 'expiring'
  | 'delinquent'
  | 'cancelled'
  | 'trial';

export const STUDENT_DISPLAY_STATUS_LABELS: Record<StudentDisplayStatus, string> = {
  active: 'Ativo',
  pending: 'Pendente',
  expiring: 'Plano vencendo',
  delinquent: 'Inadimplente',
  cancelled: 'Cancelado',
  trial: 'Experimental',
};

const EXPIRING_DAYS = 7;

export function resolveStudentDisplayStatus(
  status: string,
  nextDueDate?: string | null,
  now = new Date(),
): StudentDisplayStatus {
  if (status === 'cancelled' || status === 'archived') return 'cancelled';
  if (status === 'delinquent' || status === 'blocked') return 'delinquent';
  if (status === 'lead') return 'trial';
  if (status === 'pre_registration') return 'pending';

  if (status === 'active' && nextDueDate) {
    const due = new Date(`${nextDueDate.slice(0, 10)}T12:00:00`);
    const days = (due.getTime() - now.getTime()) / 86400000;
    if (days >= 0 && days <= EXPIRING_DAYS) return 'expiring';
  }

  if (status === 'active') return 'active';
  return 'pending';
}

export function displayStatusFromDbStatus(status: StudentStatus | string): StudentDisplayStatus {
  return resolveStudentDisplayStatus(status);
}
