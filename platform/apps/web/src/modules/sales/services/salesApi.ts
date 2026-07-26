import type {
  Contract,
  Enrollment,
  Lead,
  LeadActivity,
  LeadSource,
  PipelineColumn,
  Plan,
  SalesDashboard,
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

export const salesApi = {
  dashboard: (t: string) => apiFetch<SalesDashboard>('/sales/dashboard', t),
  leads: (t: string) => apiFetch<Lead[]>('/sales/leads', t),
  createLead: (t: string, body: Record<string, unknown>) =>
    apiFetch<Lead>('/sales/leads', t, { method: 'POST', body: JSON.stringify(body) }),
  moveStage: (t: string, id: string, stageId: string) =>
    apiFetch<Lead>(`/sales/leads/${id}/stage`, t, {
      method: 'PATCH',
      body: JSON.stringify({ stageId }),
    }),
  activities: (t: string, id: string) =>
    apiFetch<LeadActivity[]>(`/sales/leads/${id}/activities`, t),
  addActivity: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<LeadActivity>(`/sales/leads/${id}/activities`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  pipeline: (t: string) => apiFetch<PipelineColumn[]>('/sales/pipeline', t),
  sources: (t: string) => apiFetch<LeadSource[]>('/sales/sources', t),
  plans: (t: string) => apiFetch<Plan[]>('/sales/plans', t),
  createPlan: (t: string, body: Record<string, unknown>) =>
    apiFetch<Plan>('/sales/plans', t, { method: 'POST', body: JSON.stringify(body) }),
  enrollments: (t: string) => apiFetch<Enrollment[]>('/sales/enrollments', t),
  createEnrollment: (t: string, body: Record<string, unknown>) =>
    apiFetch<Enrollment>('/sales/enrollments', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  contracts: (t: string) => apiFetch<Contract[]>('/sales/contracts', t),
  createContract: (t: string, body: Record<string, unknown>) =>
    apiFetch<Contract>('/sales/contracts', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  signContract: (t: string, id: string) =>
    apiFetch<Contract>(`/sales/contracts/${id}/sign`, t, { method: 'POST', body: '{}' }),
};
