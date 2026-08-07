import {
  receivableStatusLabel as sharedReceivableStatusLabel,
  resolveReceivableDisplayStatus,
} from '@athena/shared';
import type { BadgeTone } from '@athena/ui';

const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
  open: 'A receber',
  partial: 'Parcial',
  due_today: 'Vence hoje',
  overdue: 'Vencido',
  pix_generated: 'Gerado PIX',
  cancelled: 'Cancelado',
  paid: 'Pago',
  refunded: 'Estornado',
};

export function receivableStatusLabel(status: string): string {
  return RECEIVABLE_STATUS_LABELS[status] || sharedReceivableStatusLabel(status) || status;
}

export function isReceivableOpen(status: string) {
  return (
    status === 'open' ||
    status === 'overdue' ||
    status === 'pix_generated' ||
    status === 'partial'
  );
}

export function receivableDisplayStatus(
  status: string,
  dueDate: string,
  displayStatus?: string | null,
): string {
  if (displayStatus) return displayStatus;
  return resolveReceivableDisplayStatus(status, dueDate);
}

export function receivableBadgeTone(displayStatus: string): BadgeTone {
  switch (displayStatus) {
    case 'paid':
      return 'ativo';
    case 'partial':
      return 'gold';
    case 'due_today':
      return 'primary';
    case 'overdue':
      return 'inadimplente';
    case 'cancelled':
    case 'refunded':
      return 'cancelado';
    default:
      return 'novo';
  }
}

export const PAYABLE_STATUS_LABELS: Record<string, string> = {
  open: 'Em aberto',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

export function payableStatusLabel(status: string): string {
  return PAYABLE_STATUS_LABELS[status] || status;
}
