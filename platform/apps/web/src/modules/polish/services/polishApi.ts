import type {
  GlobalSearchResult,
  SystemHealth,
  TimelineEvent,
  UserFavorite,
  AuditLogItem,
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

export const polishApi = {
  search: (t: string, q: string, signal?: AbortSignal) =>
    apiFetch<GlobalSearchResult>(`/search?q=${encodeURIComponent(q)}`, t, { signal }),
  favorites: (t: string) => apiFetch<UserFavorite[]>('/favorites', t),
  addFavorite: (t: string, body: { href: string; label: string }) =>
    apiFetch<UserFavorite>('/favorites', t, { method: 'POST', body: JSON.stringify(body) }),
  removeFavorite: (t: string, id: string) =>
    apiFetch<{ ok: boolean }>(`/favorites/${id}`, t, { method: 'DELETE' }),
  timeline: (t: string, entity: string, id: string) =>
    apiFetch<TimelineEvent[]>(`/timeline/${entity}/${id}`, t),
  logs: (t: string, qs = '') =>
    apiFetch<{ items: AuditLogItem[]; total: number }>(`/logs${qs ? `?${qs}` : ''}`, t),
  health: async () => {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`health failed (${res.status})`);
    return res.json() as Promise<SystemHealth>;
  },
  exportUrl: (resource: 'alunos' | 'receivables' | 'checkins', format: 'csv' | 'xlsx' | 'pdf') =>
    `${API_URL}/exports/${resource}?format=${format}`,
};
