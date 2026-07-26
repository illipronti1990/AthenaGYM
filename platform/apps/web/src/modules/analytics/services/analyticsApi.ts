import type {
  AnalyticsDashboard,
  ExecutiveDashboard,
  ExportJob,
  KpiItem,
  PredictionItem,
  ReportDefinition,
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
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const analyticsApi = {
  dashboard: (t: string) => apiFetch<AnalyticsDashboard>('/analytics/dashboard', t),
  executive: (t: string) => apiFetch<ExecutiveDashboard>('/executive', t),
  kpis: (t: string) => apiFetch<KpiItem[]>('/analytics/kpis', t),
  churn: (t: string) => apiFetch<PredictionItem[]>('/analytics/churn', t),
  predictions: (t: string) => apiFetch<PredictionItem[]>('/analytics/predictions', t),
  runPredictions: (t: string, type = 'churn') =>
    apiFetch<PredictionItem[]>('/analytics/predictions/run', t, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  reports: (t: string) => apiFetch<ReportDefinition[]>('/reports', t),
  createReport: (t: string, body: Record<string, unknown>) =>
    apiFetch<ReportDefinition>('/reports', t, { method: 'POST', body: JSON.stringify(body) }),
  exports: (t: string) => apiFetch<ExportJob[]>('/exports', t),
  createExport: (t: string, body: Record<string, unknown>) =>
    apiFetch<ExportJob>('/exports', t, { method: 'POST', body: JSON.stringify(body) }),
  aiInsights: (t: string, question: string) =>
    apiFetch<{ answer: string }>('/ai/insights', t, {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
