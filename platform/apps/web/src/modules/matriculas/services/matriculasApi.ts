import type {
  Contract,
  Enrollment,
  EnrollmentCompleteResult,
  EnrollmentEvent,
  Plan,
  RenewalDueItem,
} from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const matriculasApi = {
  plans: (t: string) => apiFetch<Plan[]>('/sales/plans', t),
  createPlan: (t: string, body: Record<string, unknown>) =>
    apiFetch<Plan>('/sales/plans', t, { method: 'POST', body: JSON.stringify(body) }),
  updatePlan: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Plan>(`/sales/plans/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePlan: (t: string, id: string) =>
    apiFetch<{ ok: boolean }>(`/sales/plans/${id}`, t, { method: 'DELETE' }),

  enrollments: (t: string) => apiFetch<Enrollment[]>('/sales/enrollments', t),
  getEnrollment: (t: string, id: string) =>
    apiFetch<Enrollment & { events?: EnrollmentEvent[] }>(`/sales/enrollments/${id}`, t),
  events: (t: string, id: string) =>
    apiFetch<EnrollmentEvent[]>(`/sales/enrollments/${id}/events`, t),
  renewalsDue: (t: string, days = '30,15,7,3,1') =>
    apiFetch<RenewalDueItem[]>(`/sales/enrollments/renewals-due?days=${encodeURIComponent(days)}`, t),
  complete: (t: string, body: Record<string, unknown>) =>
    apiFetch<EnrollmentCompleteResult>('/sales/enrollments/complete', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  renew: (t: string, id: string, body: Record<string, unknown> = {}) =>
    apiFetch<Enrollment>(`/sales/enrollments/${id}/renew`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  freeze: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Enrollment>(`/sales/enrollments/${id}/freeze`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  unfreeze: (t: string, id: string) =>
    apiFetch<Enrollment>(`/sales/enrollments/${id}/unfreeze`, t, {
      method: 'POST',
      body: '{}',
    }),
  cancel: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Enrollment>(`/sales/enrollments/${id}/cancel`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  changePlan: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<{ enrollment: Enrollment; proration: number; credit: number }>(
      `/sales/enrollments/${id}/change-plan`,
      t,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  contracts: (t: string) => apiFetch<Contract[]>('/sales/contracts', t),
  signContract: (t: string, id: string, body: Record<string, unknown> = {}) =>
    apiFetch<Contract>(`/sales/contracts/${id}/sign`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
