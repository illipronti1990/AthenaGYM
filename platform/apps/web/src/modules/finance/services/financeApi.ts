import type {
  CashflowPoint,
  CashflowSummary,
  CashSession,
  CashSessionReport,
  CostCenter,
  DelinquencyReport,
  DreReport,
  DueAlertItem,
  FinanceDashboard,
  FinanceSubscription,
  FinancialAccount,
  Payable,
  PaymentMethod,
  PaymentTransaction,
  Receivable,
} from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${path} failed (${res.status}): ${text || res.statusText}`);
  }
  // Nest returns empty body for `null`/`undefined` — avoid `res.json()` crash
  if (!text.trim()) return null as T;
  return JSON.parse(text) as T;
}

function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export type ReceivePaymentBody = {
  amount?: number;
  paymentMethodId?: string;
  interest?: number;
  fine?: number;
  nsu?: string;
  authorizationCode?: string;
  cardBrand?: string;
  installments?: number;
};

export type ReceivableFilters = {
  studentId?: string;
  status?: string;
  displayStatus?: string;
  from?: string;
  to?: string;
  q?: string;
};

export type CashflowSummaryParams = {
  range?: 'today' | 'week' | 'month' | 'year' | 'custom';
  from?: string;
  to?: string;
};

export const financeApi = {
  dashboard: (t: string) => apiFetch<FinanceDashboard>('/finance/dashboard', t),

  receivables: (t: string, filters?: ReceivableFilters | string) => {
    if (typeof filters === 'string') {
      return apiFetch<Receivable[]>(
        `/finance/receivables${filters ? `?studentId=${encodeURIComponent(filters)}` : ''}`,
        t,
      );
    }
    return apiFetch<Receivable[]>(`/finance/receivables${qs(filters || {})}`, t);
  },

  createReceivable: (t: string, body: Record<string, unknown>) =>
    apiFetch<Receivable>('/finance/receivables', t, { method: 'POST', body: JSON.stringify(body) }),

  receive: (t: string, id: string, body: ReceivePaymentBody = {}) =>
    apiFetch<Receivable>(`/finance/receivables/${id}/receive`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  cancel: (t: string, id: string) =>
    apiFetch<Receivable>(`/finance/receivables/${id}/cancel`, t, { method: 'POST', body: '{}' }),

  refund: (t: string, id: string) =>
    apiFetch<Receivable>(`/finance/receivables/${id}/refund`, t, { method: 'POST', body: '{}' }),

  pix: (t: string, receivableId: string) =>
    apiFetch<PaymentTransaction>('/finance/pix', t, {
      method: 'POST',
      body: JSON.stringify({ receivableId, gateway: 'stub' }),
    }),

  dueAlerts: (t: string, days = '30,15,7,3,1') =>
    apiFetch<DueAlertItem[]>(`/finance/receivables/due-alerts${qs({ days })}`, t),

  delinquency: (t: string) => apiFetch<DelinquencyReport>('/finance/delinquency', t),

  payables: (t: string) => apiFetch<Payable[]>('/finance/payables', t),

  createPayable: (t: string, body: Record<string, unknown>) =>
    apiFetch<Payable>('/finance/payables', t, { method: 'POST', body: JSON.stringify(body) }),

  updatePayable: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Payable>(`/finance/payables/${id}`, t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  payPayable: (t: string, id: string) =>
    apiFetch<Payable>(`/finance/payables/${id}/pay`, t, { method: 'POST', body: '{}' }),

  cancelPayable: (t: string, id: string) =>
    apiFetch<Payable>(`/finance/payables/${id}/cancel`, t, { method: 'POST', body: '{}' }),

  subscriptions: (t: string, studentId?: string) =>
    apiFetch<FinanceSubscription[]>(
      `/finance/subscriptions${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`,
      t,
    ),

  createSubscription: (t: string, body: Record<string, unknown>) =>
    apiFetch<FinanceSubscription>('/finance/subscriptions', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  renewDue: (t: string) =>
    apiFetch<{ renewed: number }>('/finance/subscriptions/renew-due', t, {
      method: 'POST',
      body: '{}',
    }),

  cashflowSummary: (t: string, params?: CashflowSummaryParams) =>
    apiFetch<CashflowSummary>(`/finance/cashflow/summary${qs(params || {})}`, t),

  cashflow: (t: string) => apiFetch<CashflowPoint[]>('/finance/cashflow', t),

  deleteCashflowDay: (t: string, date: string) =>
    apiFetch<{ ok: boolean; deleted: number }>(
      `/finance/cashflow/${encodeURIComponent(date)}`,
      t,
      { method: 'DELETE' },
    ),

  currentSession: async (t: string, unitId?: string) => {
    const data = await apiFetch<CashSession | { session: CashSession | null } | null>(
      `/finance/sessions/current${qs({ unitId })}`,
      t,
    );
    if (!data) return null;
    if (typeof data === 'object' && 'session' in data) return data.session;
    return data as CashSession;
  },

  openSession: (t: string, body: { openingAmount: number; unitId?: string }) =>
    apiFetch<CashSession>('/finance/sessions/open', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sangria: async (t: string, sessionId: string, body: { amount: number; notes?: string }) => {
    const data = await apiFetch<CashSession | { session: CashSession }>(
      `/finance/sessions/${sessionId}/sangria`,
      t,
      { method: 'POST', body: JSON.stringify(body) },
    );
    return data && typeof data === 'object' && 'session' in data ? data.session : (data as CashSession);
  },

  supply: async (t: string, sessionId: string, body: { amount: number; notes?: string }) => {
    const data = await apiFetch<CashSession | { session: CashSession }>(
      `/finance/sessions/${sessionId}/supply`,
      t,
      { method: 'POST', body: JSON.stringify(body) },
    );
    return data && typeof data === 'object' && 'session' in data ? data.session : (data as CashSession);
  },

  closeSession: (t: string, sessionId: string, body: { countedAmount: number; notes?: string }) =>
    apiFetch<CashSession>(`/finance/sessions/${sessionId}/close`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  sessionReport: (t: string, sessionId: string) =>
    apiFetch<CashSessionReport>(`/finance/sessions/${sessionId}/report`, t),

  dre: (t: string) => apiFetch<DreReport>('/finance/dre', t),

  accounts: (t: string) => apiFetch<FinancialAccount[]>('/finance/accounts', t),

  createAccount: (t: string, body: Record<string, unknown>) =>
    apiFetch<FinancialAccount>('/finance/accounts', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAccount: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<FinancialAccount>(`/finance/accounts/${id}`, t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  costCenters: (t: string) => apiFetch<CostCenter[]>('/finance/cost-centers', t),

  createCostCenter: (t: string, body: Record<string, unknown>) =>
    apiFetch<CostCenter>('/finance/cost-centers', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  paymentMethods: (t: string) => apiFetch<PaymentMethod[]>('/finance/payment-methods', t),

  importReconciliation: (t: string, body: Record<string, unknown>) =>
    apiFetch<{ statementId: string; imported: number; matched: number }>(
      '/finance/reconciliation/import',
      t,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
