import type {
  CashflowPoint,
  CostCenter,
  DreReport,
  FinanceDashboard,
  FinanceSubscription,
  FinancialAccount,
  Payable,
  PaymentTransaction,
  Receivable,
} from '@athenas/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const financeApi = {
  dashboard: (t: string) => apiFetch<FinanceDashboard>('/finance/dashboard', t),
  receivables: (t: string) => apiFetch<Receivable[]>('/finance/receivables', t),
  createReceivable: (t: string, body: Record<string, unknown>) =>
    apiFetch<Receivable>('/finance/receivables', t, { method: 'POST', body: JSON.stringify(body) }),
  receive: (t: string, id: string) =>
    apiFetch<Receivable>(`/finance/receivables/${id}/receive`, t, { method: 'POST', body: '{}' }),
  cancel: (t: string, id: string) =>
    apiFetch<Receivable>(`/finance/receivables/${id}/cancel`, t, { method: 'POST', body: '{}' }),
  refund: (t: string, id: string) =>
    apiFetch<Receivable>(`/finance/receivables/${id}/refund`, t, { method: 'POST', body: '{}' }),
  pix: (t: string, receivableId: string) =>
    apiFetch<PaymentTransaction>('/finance/pix', t, {
      method: 'POST',
      body: JSON.stringify({ receivableId, gateway: 'stub' }),
    }),
  payables: (t: string) => apiFetch<Payable[]>('/finance/payables', t),
  createPayable: (t: string, body: Record<string, unknown>) =>
    apiFetch<Payable>('/finance/payables', t, { method: 'POST', body: JSON.stringify(body) }),
  payPayable: (t: string, id: string) =>
    apiFetch<Payable>(`/finance/payables/${id}/pay`, t, { method: 'POST', body: '{}' }),
  subscriptions: (t: string) => apiFetch<FinanceSubscription[]>('/finance/subscriptions', t),
  cashflow: (t: string) => apiFetch<CashflowPoint[]>('/finance/cashflow', t),
  dre: (t: string) => apiFetch<DreReport>('/finance/dre', t),
  accounts: (t: string) => apiFetch<FinancialAccount[]>('/finance/accounts', t),
  costCenters: (t: string) => apiFetch<CostCenter[]>('/finance/cost-centers', t),
  importReconciliation: (t: string, body: Record<string, unknown>) =>
    apiFetch<{ statementId: string; imported: number; matched: number }>(
      '/finance/reconciliation/import',
      t,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
