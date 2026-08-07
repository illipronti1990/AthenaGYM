import type {
  AnalyticsDashboard,
  AthenaAiChatResponse,
  BenchmarkResponse,
  BiAlert,
  BiConnector,
  BiGoal,
  BiInsightsResponse,
  CommercialInsight,
  CompareResponse,
  ExecutiveDashboard,
  ExportJob,
  ForecastResult,
  HeatmapResponse,
  KpiItem,
  PredictionItem,
  ReportDefinition,
} from '@movvo/shared';

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

export const biApi = {
  dashboard: (t: string) => apiFetch<AnalyticsDashboard>('/analytics/dashboard', t),
  executive: (t: string) => apiFetch<ExecutiveDashboard>('/executive', t),
  kpis: (t: string, category?: string) =>
    apiFetch<KpiItem[]>(`/analytics/kpis${category ? `?category=${category}` : ''}`, t),
  churn: (t: string) => apiFetch<PredictionItem[]>('/analytics/churn', t),
  forecasts: (t: string) => apiFetch<ForecastResult[]>('/analytics/forecasts', t),
  runPredictions: (t: string, type = 'churn') =>
    apiFetch<PredictionItem[]>('/analytics/predictions/run', t, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  syncWarehouse: (t: string) =>
    apiFetch<{ ok: boolean; facts: string[] }>('/analytics/warehouse/sync', t, { method: 'POST' }),
  heatmaps: (t: string, type = 'hours') =>
    apiFetch<HeatmapResponse>(`/analytics/heatmaps?type=${type}`, t),
  compare: (t: string, metric = 'revenue', period = 'month') =>
    apiFetch<CompareResponse>(`/analytics/compare?metric=${metric}&period=${period}`, t),
  benchmark: (t: string, dimension = 'teacher') =>
    apiFetch<BenchmarkResponse>(`/analytics/benchmark?dimension=${dimension}`, t),
  commercial: (t: string) => apiFetch<CommercialInsight[]>('/analytics/commercial', t),
  insights: (t: string, question?: string) =>
    apiFetch<BiInsightsResponse>('/ai/insights', t, {
      method: 'POST',
      body: JSON.stringify(question ? { question } : {}),
    }),
  chat: (
    t: string,
    question: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ) =>
    apiFetch<AthenaAiChatResponse>('/analytics/ai/chat', t, {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    }),
  goals: (t: string) => apiFetch<BiGoal[]>('/analytics/goals', t),
  createGoal: (t: string, body: Record<string, unknown>) =>
    apiFetch<BiGoal>('/analytics/goals', t, { method: 'POST', body: JSON.stringify(body) }),
  alerts: (t: string) => apiFetch<BiAlert[]>('/analytics/alerts', t),
  refreshAlerts: (t: string) =>
    apiFetch<BiAlert[]>('/analytics/alerts/refresh', t, { method: 'POST' }),
  markAlertRead: (t: string, id: string) =>
    apiFetch<BiAlert>(`/analytics/alerts/${id}/read`, t, { method: 'PATCH' }),
  connectors: (t: string) => apiFetch<BiConnector[]>('/analytics/connectors', t),
  reports: (t: string) => apiFetch<ReportDefinition[]>('/reports', t),
  exports: (t: string) => apiFetch<ExportJob[]>('/exports', t),
  createExport: (t: string, body: Record<string, unknown>) =>
    apiFetch<ExportJob>('/exports', t, { method: 'POST', body: JSON.stringify(body) }),
};
