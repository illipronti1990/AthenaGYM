const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
  open: 'A receber',
  overdue: 'A receber',
  pix_generated: 'Gerado PIX',
  cancelled: 'Cancelado',
  paid: 'Pago',
  refunded: 'Estornado',
};

export function receivableStatusLabel(status: string): string {
  return RECEIVABLE_STATUS_LABELS[status] || status;
}

export function isReceivableOpen(status: string) {
  return status === 'open' || status === 'overdue' || status === 'pix_generated';
}
