export type ReceivableStatus =
  | 'open'
  | 'paid'
  | 'cancelled'
  | 'overdue'
  | 'refunded'
  | 'pix_generated';

export const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
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
export type PayableStatus = 'open' | 'paid' | 'cancelled';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';
export type SubscriptionRecurrence = 'monthly' | 'quarterly' | 'yearly';
export type PaymentGateway = 'stub' | 'asaas' | 'mercadopago' | 'stripe' | 'pagseguro' | 'pagarme' | 'iugu';
export type PaymentTxStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type CashDirection = 'in' | 'out';
export type OutboxStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface FinancialAccount {
  id: string;
  companyId: string;
  unitId: string | null;
  bankName: string;
  agency: string | null;
  account: string | null;
  pixKey: string | null;
  status: string;
}

export interface CostCenter {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  companyId: string | null;
  name: string;
  slug: string;
  isSystem: boolean;
  active: boolean;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
}

export interface FinanceSubscription {
  id: string;
  companyId: string;
  unitId: string | null;
  studentId: string;
  planId: string;
  enrollmentId: string | null;
  contractId: string | null;
  gateway: PaymentGateway | string;
  recurrence: SubscriptionRecurrence | string;
  nextDueDate: string | null;
  amount: number;
  status: SubscriptionStatus | string;
  createdAt: string;
}

export interface Receivable {
  id: string;
  companyId: string;
  unitId: string | null;
  studentId: string | null;
  contractId: string | null;
  subscriptionId: string | null;
  costCenterId: string | null;
  paymentMethodId: string | null;
  description: string;
  amount: number;
  discount: number;
  interest: number;
  fine: number;
  dueDate: string;
  paidAt: string | null;
  status: ReceivableStatus | string;
  competenceMonth: string | null;
  createdAt: string;
}

export interface Payable {
  id: string;
  companyId: string;
  unitId: string | null;
  supplierId: string | null;
  costCenterId: string | null;
  description: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: PayableStatus | string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  companyId: string;
  receivableId: string | null;
  subscriptionId: string | null;
  gateway: PaymentGateway | string;
  externalId: string | null;
  idempotencyKey: string;
  status: PaymentTxStatus | string;
  amount: number;
  paidAt: string | null;
  qrCode: string | null;
  copyPaste: string | null;
  createdAt: string;
}

export interface CashflowPoint {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
  projectedBalance: number;
}

export interface DreReport {
  from: string;
  to: string;
  grossRevenue: number;
  discounts: number;
  netRevenue: number;
  costs: number;
  expenses: number;
  operatingProfit: number;
  result: number;
}

export interface FinanceDashboard {
  monthRevenue: number;
  received: number;
  toReceive: number;
  delinquencyRate: number;
  cashflowBalance: number;
}

export interface OutboxEvent {
  id: string;
  companyId: string | null;
  aggregateType: string;
  aggregateId: string | null;
  eventType: string;
  payload: Record<string, unknown>;
  status: OutboxStatus | string;
  createdAt: string;
}

/** Net amount after discount + interest + fine */
export function calcReceivableNet(input: {
  amount: number;
  discount?: number;
  interest?: number;
  fine?: number;
}): number {
  const discount = input.discount ?? 0;
  const interest = input.interest ?? 0;
  const fine = input.fine ?? 0;
  return Math.round((input.amount - discount + interest + fine) * 100) / 100;
}

/** Simple daily interest as percent of principal for overdue days */
export function calcInterest(principal: number, dailyRatePct: number, overdueDays: number): number {
  if (overdueDays <= 0 || dailyRatePct <= 0) return 0;
  return Math.round(principal * (dailyRatePct / 100) * overdueDays * 100) / 100;
}

export function calcFine(principal: number, finePct: number): number {
  if (finePct <= 0) return 0;
  return Math.round(principal * (finePct / 100) * 100) / 100;
}

export function splitInstallments(total: number, count: number): number[] {
  if (count <= 0) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rem = cents % count;
  return Array.from({ length: count }, (_, i) => (base + (i < rem ? 1 : 0)) / 100);
}

export function buildCashflow(
  movements: Array<{ date: string; direction: CashDirection | string; amount: number }>,
  openingBalance = 0,
): CashflowPoint[] {
  const byDate = new Map<string, { inflow: number; outflow: number }>();
  for (const m of movements) {
    const cur = byDate.get(m.date) || { inflow: 0, outflow: 0 };
    if (m.direction === 'in') cur.inflow += m.amount;
    else cur.outflow += m.amount;
    byDate.set(m.date, cur);
  }
  const dates = [...byDate.keys()].sort();
  let balance = openingBalance;
  return dates.map((date) => {
    const { inflow, outflow } = byDate.get(date)!;
    balance = Math.round((balance + inflow - outflow) * 100) / 100;
    return {
      date,
      inflow: Math.round(inflow * 100) / 100,
      outflow: Math.round(outflow * 100) / 100,
      balance,
      projectedBalance: balance,
    };
  });
}

export function buildDre(input: {
  from: string;
  to: string;
  grossRevenue: number;
  discounts: number;
  costs: number;
  expenses: number;
}): DreReport {
  const netRevenue = Math.round((input.grossRevenue - input.discounts) * 100) / 100;
  const operatingProfit = Math.round((netRevenue - input.costs - input.expenses) * 100) / 100;
  return {
    from: input.from,
    to: input.to,
    grossRevenue: input.grossRevenue,
    discounts: input.discounts,
    netRevenue,
    costs: input.costs,
    expenses: input.expenses,
    operatingProfit,
    result: operatingProfit,
  };
}

export function calcDelinquencyRate(overdue: number, totalOpen: number): number {
  if (totalOpen <= 0) return 0;
  return Math.round((overdue / totalOpen) * 1000) / 10;
}
