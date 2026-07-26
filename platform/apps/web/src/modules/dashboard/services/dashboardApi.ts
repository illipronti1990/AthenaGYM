import type {
  CommandDashboard,
  DashboardChartPeriod,
  DashboardLayoutItem,
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
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const dashboardApi = {
  executive: (t: string, period: DashboardChartPeriod = '30d', name?: string) => {
    const qs = new URLSearchParams({ period });
    if (name) qs.set('name', name);
    return apiFetch<CommandDashboard>(`/dashboard?${qs}`, t);
  },
  saveLayout: (t: string, layout: DashboardLayoutItem[]) =>
    apiFetch<DashboardLayoutItem[]>('/dashboard/layout', t, {
      method: 'PATCH',
      body: JSON.stringify({ layout }),
    }),
};
