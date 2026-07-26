import type { CepLookupResult, CpfLookupResult, FormTemplate } from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const formsApi = {
  lookupCep(accessToken: string, cep: string) {
    return apiFetch<CepLookupResult>(`/lookup/cep/${cep.replace(/\D/g, '')}`, accessToken);
  },
  lookupCpf(accessToken: string, cpf: string) {
    return apiFetch<CpfLookupResult>(`/lookup/cpf/${cpf.replace(/\D/g, '')}`, accessToken);
  },
  autosave(
    accessToken: string,
    body: { formKey: string; entityId?: string; payload: Record<string, unknown> },
  ) {
    return apiFetch('/autosave', accessToken, { method: 'POST', body: JSON.stringify(body) });
  },
  getDraft(accessToken: string, formKey: string, entityId?: string) {
    const q = new URLSearchParams({ formKey });
    if (entityId) q.set('entityId', entityId);
    return apiFetch<{ payload?: Record<string, unknown> } | null>(
      `/autosave?${q.toString()}`,
      accessToken,
    );
  },
  templates(accessToken: string, kind?: string) {
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    return apiFetch<FormTemplate[]>(`/templates${q}`, accessToken);
  },
  createTemplate(
    accessToken: string,
    body: { kind: string; name: string; payload: Record<string, unknown> },
  ) {
    return apiFetch('/templates', accessToken, { method: 'POST', body: JSON.stringify(body) });
  },
  upload(accessToken: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return apiFetch('/upload', accessToken, { method: 'POST', body: fd });
  },
  signature(
    accessToken: string,
    body: { dataUrl: string; entityType: string; entityId?: string },
  ) {
    return apiFetch('/signature', accessToken, { method: 'POST', body: JSON.stringify(body) });
  },
};
