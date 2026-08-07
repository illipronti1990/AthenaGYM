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
  return res.json() as Promise<T>;
}

export const securityApi = {
  dashboard: (t: string) => apiFetch<Record<string, unknown>>('/security/dashboard', t),
  sessions: (t: string) =>
    apiFetch<{ items: Array<Record<string, unknown>> }>('/security/sessions', t),
  revokeSession: (t: string, id: string) =>
    apiFetch(`/security/sessions/${id}`, t, { method: 'DELETE' }),
  revokeAll: (t: string) =>
    apiFetch('/security/sessions/revoke-all', t, { method: 'POST', body: '{}' }),
  mfaStatus: (t: string) => apiFetch<Record<string, unknown>>('/security/mfa', t),
  enrollTotp: (t: string) =>
    apiFetch<Record<string, unknown>>('/security/mfa/totp/enroll', t, {
      method: 'POST',
      body: '{}',
    }),
  verifyTotp: (t: string, code: string) =>
    apiFetch('/security/mfa/totp/verify', t, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  disableTotp: (t: string) =>
    apiFetch('/security/mfa/totp/disable', t, { method: 'POST', body: '{}' }),
  sendEmailOtp: (t: string) =>
    apiFetch<Record<string, unknown>>('/security/mfa/email/send', t, {
      method: 'POST',
      body: '{}',
    }),
  verifyEmailOtp: (t: string, code: string) =>
    apiFetch('/security/mfa/email/verify', t, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  consents: (t: string) =>
    apiFetch<{ items: Array<Record<string, unknown>> }>('/security/lgpd/consents', t),
  upsertConsent: (t: string, body: Record<string, unknown>) =>
    apiFetch('/security/lgpd/consents', t, { method: 'POST', body: JSON.stringify(body) }),
  lgpdRequests: (t: string) =>
    apiFetch<{ items: Array<Record<string, unknown>> }>('/security/lgpd/requests', t),
  exportData: (t: string, subjectUserId?: string) =>
    apiFetch('/security/lgpd/export', t, {
      method: 'POST',
      body: JSON.stringify({ subjectUserId }),
    }),
  anonymize: (t: string, subjectUserId: string) =>
    apiFetch('/security/lgpd/anonymize', t, {
      method: 'POST',
      body: JSON.stringify({ subjectUserId }),
    }),
  erase: (t: string, subjectUserId: string) =>
    apiFetch('/security/lgpd/erase', t, {
      method: 'POST',
      body: JSON.stringify({ subjectUserId }),
    }),
  retention: (t: string) =>
    apiFetch<{ items: Array<Record<string, unknown>> }>('/security/retention', t),
  upsertRetention: (t: string, body: Record<string, unknown>) =>
    apiFetch('/security/retention', t, { method: 'PUT', body: JSON.stringify(body) }),
  backups: (t: string) =>
    apiFetch<{ items: Array<Record<string, unknown>> }>('/security/backups', t),
  startBackup: (t: string) =>
    apiFetch('/security/backups', t, {
      method: 'POST',
      body: JSON.stringify({ backupType: 'tenant_export' }),
    }),
  audit: (t: string, qs = '') =>
    apiFetch<{ items: Array<Record<string, unknown>>; total: number }>(
      `/audit${qs ? `?${qs}` : ''}`,
      t,
    ),
};
