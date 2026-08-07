import type {
  AuditLogItem,
  GymSettingsResponse,
  OpsDashboard,
} from '@movvo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type BackupResult = {
  path: string;
  downloadUrl: string;
  bytes: number;
  exportedAt: string;
};

export type AuditListResult = {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const settingsApi = {
  get: (t: string) => apiFetch<GymSettingsResponse>('/settings', t),
  patch: (t: string, body: Record<string, unknown>) =>
    apiFetch<GymSettingsResponse>('/settings', t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  uploadLogo: async (t: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<GymSettingsResponse>('/settings/logo', t, {
      method: 'POST',
      body: form,
    });
  },
  /** @deprecated use dashboardApi.executive — kept for temporary compatibility */
  dashboard: (t: string) => apiFetch<OpsDashboard>('/dashboard', t),
  backup: (t: string) =>
    apiFetch<BackupResult>('/backup', t, { method: 'POST', body: '{}' }),
  audit: (t: string, qs = '') =>
    apiFetch<AuditListResult>(`/audit${qs ? `?${qs}` : ''}`, t),
};
