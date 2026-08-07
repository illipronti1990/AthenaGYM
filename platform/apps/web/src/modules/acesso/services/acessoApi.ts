import type {
  AccessLiveEvent,
  AccessRules,
  Checkin,
  OperationsKpis,
  PartnerApiLog,
  PartnerHubItem,
  PresenceSnapshot,
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
  if (!res.ok) {
    const text = await res.text();
    let message = `${path} failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as { message?: string | { message?: string }; code?: string };
      if (typeof parsed.message === 'string') message = parsed.message;
      else if (parsed.message && typeof parsed.message === 'object' && parsed.message.message) {
        message = parsed.message.message;
      }
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const acessoApi = {
  rules: (t: string) => apiFetch<AccessRules>('/access/rules', t),
  updateRules: (t: string, body: Record<string, unknown>) =>
    apiFetch<AccessRules>('/access/rules', t, { method: 'PATCH', body: JSON.stringify(body) }),
  live: (t: string, limit = 30) =>
    apiFetch<AccessLiveEvent[]>(`/access/live?limit=${limit}`, t),
  presence: (t: string) => apiFetch<PresenceSnapshot>('/presence', t),
  dashboard: (t: string) => apiFetch<OperationsKpis>('/operations/dashboard', t),
  agenda: (t: string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const q = qs.toString();
    return apiFetch<(Checkin & { studentName?: string | null })[]>(
      `/checkins/agenda${q ? `?${q}` : ''}`,
      t,
    );
  },
  checkinByCpf: (t: string, cpf: string, unitId?: string) =>
    apiFetch<Checkin>('/checkins/by-cpf', t, {
      method: 'POST',
      body: JSON.stringify({ cpf, ...(unitId ? { unitId } : {}) }),
    }),
  checkinByCode: (t: string, code: string, unitId?: string) =>
    apiFetch<Checkin>('/checkins/by-code', t, {
      method: 'POST',
      body: JSON.stringify({ code, ...(unitId ? { unitId } : {}) }),
    }),
};

export const integracoesApi = {
  list: (t: string) => apiFetch<PartnerHubItem[]>('/integrations', t),
  dashboard: (t: string, provider: string) =>
    apiFetch<{
      provider: string;
      checkinsToday: number;
      pendingApprovals: number;
      estimatedRevenueStub: number;
      enabled: boolean;
      lastSyncAt: string | null;
      status: string;
    }>(`/integrations/${provider}/dashboard`, t),
  syncMembers: (t: string, provider: string) =>
    apiFetch<{ synced: number }>(`/integrations/${provider}/sync-members`, t, {
      method: 'POST',
      body: '{}',
    }),
  syncCheckins: (t: string, provider: string) =>
    apiFetch<{ imported: number }>(`/integrations/${provider}/sync-checkins`, t, {
      method: 'POST',
      body: '{}',
    }),
  logs: (t: string, provider?: string) =>
    apiFetch<PartnerApiLog[]>(
      `/integrations/logs${provider ? `?provider=${encodeURIComponent(provider)}` : ''}`,
      t,
    ),
  retryLog: (t: string, id: string) =>
    apiFetch<PartnerApiLog>(`/integrations/logs/${id}/retry`, t, {
      method: 'POST',
      body: '{}',
    }),
};
