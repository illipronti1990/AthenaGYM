const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv')) return (await res.text()) as T;
  return res.json() as Promise<T>;
}

export const saasApi = {
  tenants: (t: string) => apiFetch<Array<Record<string, unknown>>>('/platform/tenants', t),
  createTenant: (t: string, body: Record<string, unknown>) =>
    apiFetch('/platform/tenants', t, { method: 'POST', body: JSON.stringify(body) }),
  updateTenant: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch(`/platform/tenants/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  suspendTenant: (t: string, id: string) =>
    apiFetch(`/platform/tenants/${id}/suspend`, t, { method: 'POST', body: '{}' }),
  activateTenant: (t: string, id: string) =>
    apiFetch(`/platform/tenants/${id}/activate`, t, { method: 'POST', body: '{}' }),
  domains: (t: string, id: string) =>
    apiFetch<Array<Record<string, unknown>>>(`/platform/tenants/${id}/domains`, t),
  addDomain: (t: string, id: string, hostname: string) =>
    apiFetch(`/platform/tenants/${id}/domains`, t, {
      method: 'POST',
      body: JSON.stringify({ hostname }),
    }),
  verifyDomain: (t: string, domainId: string) =>
    apiFetch(`/platform/tenants/domains/${domainId}/verify`, t, { method: 'POST', body: '{}' }),
  entitlements: (t: string, id: string) =>
    apiFetch(`/platform/tenants/${id}/entitlements`, t),
  setFeature: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch(`/platform/tenants/${id}/features`, t, { method: 'POST', body: JSON.stringify(body) }),
  plans: (t: string) => apiFetch<Array<Record<string, unknown>>>('/saas-billing/plans', t),
  upsertPlan: (t: string, body: Record<string, unknown>) =>
    apiFetch('/saas-billing/plans', t, { method: 'POST', body: JSON.stringify(body) }),
  subscription: (t: string, companyId?: string) =>
    apiFetch(
      `/saas-billing/subscription${companyId ? `?companyId=${companyId}` : ''}`,
      t,
    ),
  subscribe: (t: string, body: Record<string, unknown>) =>
    apiFetch('/saas-billing/subscribe', t, { method: 'POST', body: JSON.stringify(body) }),
  changePlan: (t: string, body: Record<string, unknown>) =>
    apiFetch('/saas-billing/change-plan', t, { method: 'POST', body: JSON.stringify(body) }),
  cancel: (t: string, body: Record<string, unknown>) =>
    apiFetch('/saas-billing/cancel', t, { method: 'POST', body: JSON.stringify(body) }),
  renew: (t: string, body: Record<string, unknown>) =>
    apiFetch('/saas-billing/renew', t, { method: 'POST', body: JSON.stringify(body) }),
  invoices: (t: string, companyId?: string) =>
    apiFetch(`/saas-billing/invoices${companyId ? `?companyId=${companyId}` : ''}`, t),
  payments: (t: string, companyId?: string) =>
    apiFetch(`/saas-billing/payments${companyId ? `?companyId=${companyId}` : ''}`, t),
  limits: (t: string, companyId?: string) =>
    apiFetch(`/saas-billing/limits${companyId ? `?companyId=${companyId}` : ''}`, t),
  dashboard: (t: string) => apiFetch<Record<string, unknown>>('/saas-billing/dashboard', t),
  report: (t: string, kind: string) => apiFetch<string>(`/saas-billing/reports/${kind}`, t),
  tickets: (t: string) => apiFetch('/saas-billing/tickets', t),
  createTicket: (t: string, body: Record<string, unknown>) =>
    apiFetch('/saas-billing/tickets', t, { method: 'POST', body: JSON.stringify(body) }),
  clients: (t: string) => apiFetch('/platform/clients', t),
  createClient: (t: string, body: Record<string, unknown>) =>
    apiFetch('/platform/clients', t, { method: 'POST', body: JSON.stringify(body) }),
  rotateClient: (t: string, id: string) =>
    apiFetch(`/platform/clients/${id}/rotate`, t, { method: 'POST', body: '{}' }),
  revokeClient: (t: string, id: string) =>
    apiFetch(`/platform/clients/${id}/revoke`, t, { method: 'POST', body: '{}' }),
  webhooks: (t: string) => apiFetch('/platform/webhooks', t),
  createWebhook: (t: string, body: Record<string, unknown>) =>
    apiFetch('/platform/webhooks', t, { method: 'POST', body: JSON.stringify(body) }),
  patchWebhook: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch(`/platform/webhooks/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  deliveries: (t: string) => apiFetch('/platform/webhooks/deliveries', t),
  replayDelivery: (t: string, id: string) =>
    apiFetch(`/platform/webhooks/deliveries/${id}/replay`, t, { method: 'POST', body: '{}' }),
  plugins: (t: string) => apiFetch('/marketplace/plugins', t),
  installations: (t: string) => apiFetch('/marketplace/installations', t),
};
