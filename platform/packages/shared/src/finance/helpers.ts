export type ReceivableStatus =
  | 'open'
  | 'partial'
  | 'paid'
  | 'cancelled'
  | 'overdue'
  | 'refunded'
  | 'pix_generated';

/** Display / filter statuses including computed due_today */
export type ReceivableDisplayStatus =
  | ReceivableStatus
  | 'due_today';

export const RECEIVABLE_STATUS_LABELS: Record<string, string> = {
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
  return RECEIVABLE_STATUS_LABELS[status] || status;
}

export function resolveReceivableDisplayStatus(
  status: string,
  dueDate: string,
  today = new Date().toISOString().slice(0, 10),
): ReceivableDisplayStatus {
  if (status === 'paid' || status === 'cancelled' || status === 'refunded' || status === 'partial') {
    return status as ReceivableDisplayStatus;
  }
  if (status === 'overdue' || (['open', 'pix_generated'].includes(status) && dueDate < today)) {
    return 'overdue';
  }
  if (['open', 'pix_generated'].includes(status) && dueDate === today) {
    return 'due_today';
  }
  return (status as ReceivableDisplayStatus) || 'open';
}

export type PayableStatus = 'open' | 'paid' | 'cancelled';
export type PayableCategory =
  | 'agua'
  | 'luz'
  | 'internet'
  | 'salarios'
  | 'marketing'
  | 'equipamentos'
  | 'manutencao'
  | 'limpeza'
  | 'impostos'
  | 'outros';

export const PAYABLE_CATEGORY_LABELS: Record<PayableCategory, string> = {
  agua: 'Água',
  luz: 'Luz',
  internet: 'Internet',
  salarios: 'Salários',
  marketing: 'Marketing',
  equipamentos: 'Equipamentos',
  manutencao: 'Manutenção',
  limpeza: 'Limpeza',
  impostos: 'Impostos',
  outros: 'Outros',
};

export const PAYABLE_CATEGORIES = Object.keys(PAYABLE_CATEGORY_LABELS) as PayableCategory[];

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';
export type SubscriptionRecurrence = 'monthly' | 'weekly' | 'quarterly' | 'yearly';
export type PaymentGateway = 'stub' | 'asaas' | 'mercadopago' | 'stripe' | 'pagseguro' | 'pagarme' | 'iugu';
export type PaymentTxStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type CashDirection = 'in' | 'out';
export type OutboxStatus = 'pending' | 'processing' | 'done' | 'failed';
export type CashSessionStatus = 'open' | 'closed';
export type CashSessionMovementType = 'sale' | 'sangria' | 'supply' | 'adjustment';

export type FinancialHealthLevel = 'excelente' | 'positivo' | 'atencao' | 'critico' | 'controladas';

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
  category: string | null;
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
  contactName?: string | null;
  address?: string | null;
  notes?: string | null;
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
  enrollmentId: string | null;
  planId: string | null;
  trainerId: string | null;
  contractId: string | null;
  subscriptionId: string | null;
  costCenterId: string | null;
  paymentMethodId: string | null;
  cashSessionId: string | null;
  cashierUserId: string | null;
  description: string;
  amount: number;
  discount: number;
  addition: number;
  interest: number;
  fine: number;
  amountPaid: number;
  dueDate: string;
  paidAt: string | null;
  status: ReceivableStatus | string;
  displayStatus?: ReceivableDisplayStatus | string;
  competenceMonth: string | null;
  notes: string | null;
  createdAt: string;
  studentName?: string | null;
  studentPhone?: string | null;
  planName?: string | null;
}

export interface Payable {
  id: string;
  companyId: string;
  unitId: string | null;
  supplierId: string | null;
  costCenterId: string | null;
  description: string;
  amount: number;
  category: PayableCategory | string;
  competenceMonth: string | null;
  installmentLabel: string | null;
  notes: string | null;
  attachmentUrl: string | null;
  dueDate: string;
  paidAt: string | null;
  status: PayableStatus | string;
  createdAt: string;
  supplierName?: string | null;
}

export interface PaymentTransaction {
  id: string;
  companyId: string;
  receivableId: string | null;
  subscriptionId: string | null;
  paymentMethodId: string | null;
  cashSessionId: string | null;
  gateway: PaymentGateway | string;
  externalId: string | null;
  idempotencyKey: string;
  status: PaymentTxStatus | string;
  amount: number;
  paidAt: string | null;
  qrCode: string | null;
  copyPaste: string | null;
  nsu: string | null;
  authorizationCode: string | null;
  cardBrand: string | null;
  installments: number;
  createdAt: string;
}

export interface CashSession {
  id: string;
  companyId: string;
  unitId: string | null;
  operatorUserId: string;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  expectedAmount: number;
  countedAmount: number | null;
  difference: number | null;
  status: CashSessionStatus | string;
  notes: string | null;
}

export interface CashSessionMovement {
  id: string;
  sessionId: string;
  companyId: string;
  movementType: CashSessionMovementType | string;
  amount: number;
  paymentMethodId: string | null;
  receivableId: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CashSessionReport {
  session: CashSession;
  movements: CashSessionMovement[];
  salesTotal: number;
  sangriaTotal: number;
  supplyTotal: number;
}

export interface CashflowSummary {
  from: string;
  to: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  closingBalance: number;
  points: CashflowPoint[];
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

export interface FinancialHealthScore {
  score: number;
  revenue: FinancialHealthLevel | string;
  delinquency: FinancialHealthLevel | string;
  cashflow: FinancialHealthLevel | string;
  expenses: FinancialHealthLevel | string;
}

export interface FinanceDashboard {
  monthRevenue: number;
  received: number;
  toReceive: number;
  delinquencyRate: number;
  cashflowBalance: number;
  profit: number;
  expenses: number;
  averageTicket: number;
  mrr: number;
  receivedToday: number;
  cashSessionBalance: number;
  health: FinancialHealthScore;
}

export interface DelinquencyItem {
  studentId: string;
  studentName: string;
  phone: string | null;
  email: string | null;
  daysOverdue: number;
  amount: number;
  receivableIds: string[];
}

export interface DelinquencyReport {
  count: number;
  totalAmount: number;
  revenueAtRiskPercent: number;
  items: DelinquencyItem[];
}

export interface DueAlertItem {
  id: string;
  studentId: string | null;
  studentName: string | null;
  description: string;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
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

/** Net amount after discount + addition + interest + fine */
export function calcReceivableNet(input: {
  amount: number;
  discount?: number;
  addition?: number;
  interest?: number;
  fine?: number;
}): number {
  const discount = input.discount ?? 0;
  const addition = input.addition ?? 0;
  const interest = input.interest ?? 0;
  const fine = input.fine ?? 0;
  return Math.round((input.amount - discount + addition + interest + fine) * 100) / 100;
}

export function calcReceivableRemaining(rec: {
  amount: number;
  discount?: number;
  addition?: number;
  interest?: number;
  fine?: number;
  amountPaid?: number;
}): number {
  const net = calcReceivableNet(rec);
  const paid = rec.amountPaid ?? 0;
  return Math.max(0, Math.round((net - paid) * 100) / 100);
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

export function calcFinancialHealth(input: {
  monthRevenue: number;
  delinquencyRate: number;
  cashflowBalance: number;
  expenses: number;
  profit: number;
}): FinancialHealthScore {
  let score = 70;
  let revenue: FinancialHealthLevel = 'positivo';
  let delinquency: FinancialHealthLevel = 'positivo';
  let cashflow: FinancialHealthLevel = 'positivo';
  let expenses: FinancialHealthLevel = 'controladas';

  if (input.monthRevenue >= 20000) {
    revenue = 'excelente';
    score += 15;
  } else if (input.monthRevenue >= 8000) {
    revenue = 'positivo';
    score += 8;
  } else if (input.monthRevenue >= 2000) {
    revenue = 'atencao';
    score -= 5;
  } else {
    revenue = 'critico';
    score -= 15;
  }

  if (input.delinquencyRate <= 5) {
    delinquency = 'excelente';
    score += 10;
  } else if (input.delinquencyRate <= 12) {
    delinquency = 'atencao';
    score -= 5;
  } else {
    delinquency = 'critico';
    score -= 15;
  }

  if (input.cashflowBalance > 0) {
    cashflow = 'positivo';
    score += 8;
  } else if (input.cashflowBalance === 0) {
    cashflow = 'atencao';
    score -= 5;
  } else {
    cashflow = 'critico';
    score -= 12;
  }

  const expenseRatio =
    input.monthRevenue > 0 ? input.expenses / input.monthRevenue : input.expenses > 0 ? 1 : 0;
  if (expenseRatio <= 0.55) {
    expenses = 'controladas';
    score += 7;
  } else if (expenseRatio <= 0.8) {
    expenses = 'atencao';
    score -= 5;
  } else {
    expenses = 'critico';
    score -= 12;
  }

  if (input.profit < 0) score -= 10;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    revenue,
    delinquency,
    cashflow,
    expenses,
  };
}
