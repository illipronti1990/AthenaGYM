const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(
  path: string,
  accessToken?: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json() as Promise<T>;
  return (await res.text()) as T;
}

export type HealthPayload = {
  status: string;
  service?: string;
  version?: string;
  timestamp?: string;
  checks?: Record<string, Record<string, unknown>>;
};

export type CacheHealthPayload = {
  check?: string;
  status: string;
  latencyMs?: number;
  error?: string;
  stats?: {
    hits?: number;
    misses?: number;
    hitRate?: number;
    disabled?: boolean;
  };
};

export type ObservabilityStatus = {
  generatedAt?: string;
  api?: { status: string };
  database?: { status: string; latencyMs?: number };
  redis?: { ok?: boolean; latencyMs?: number; error?: string };
  cache?: Record<string, unknown>;
  queues?: Record<string, unknown>;
  worker?: Record<string, unknown>;
  rumSamplesIngested?: number;
  sentryEnabled?: boolean;
};

export const observabilityApi = {
  health: () => apiFetch<HealthPayload>('/health'),
  healthCache: () => apiFetch<CacheHealthPayload>('/health/cache'),
  healthQueues: () => apiFetch<Record<string, unknown>>('/health/queues'),
  status: (token: string) => apiFetch<ObservabilityStatus>('/observability/status', token),
  metricsText: async () => {
    const res = await fetch(`${API_URL}/metrics`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`/metrics failed (${res.status})`);
    return res.text();
  },
  postRum: (samples: Array<Record<string, unknown>>, url?: string) =>
    apiFetch<{ ok: boolean; sampled?: boolean }>('/observability/rum', undefined, {
      method: 'POST',
      body: JSON.stringify({ samples, url }),
    }),
};
