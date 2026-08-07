import type { StudentListItem, StudentListResponse, Student } from '@movvo/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit & { companyId?: string; unitId?: string },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  headers.Authorization = `Bearer ${accessToken}`;
  if (init?.companyId) headers['X-Company-Id'] = init.companyId;
  if (init?.unitId) headers['X-Unit-Id'] = init.unitId;
  if (init?.body && !headers['Content-Type'] && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const rest = { ...(init || {}) } as RequestInit & {
    companyId?: string;
    unitId?: string;
  };
  delete rest.companyId;
  delete rest.unitId;
  const res = await fetch(`${API_URL}${path}`, { ...rest, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return (await res.text()) as T;
  }
  return res.json() as Promise<T>;
}

export async function listAlunos(
  token: string,
  params: Record<string, string | undefined> = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const q = qs.toString();
  return apiFetch<StudentListResponse>(`/alunos${q ? `?${q}` : ''}`, token);
}

export async function getAluno(token: string, id: string) {
  return apiFetch<Student>(`/alunos/${id}`, token);
}

export async function createAluno(token: string, body: Record<string, unknown>) {
  return apiFetch<Student>('/alunos', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAluno(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiFetch<Student>(`/alunos/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteAluno(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/alunos/${id}`, token, {
    method: 'DELETE',
  });
}

export async function changeAlunoStatus(
  token: string,
  id: string,
  status: string,
  reason?: string,
) {
  return apiFetch<Student>(`/alunos/${id}/status`, token, {
    method: 'POST',
    body: JSON.stringify({ status, reason }),
  });
}

export async function getAlunoHistory(token: string, id: string) {
  return apiFetch<
    Array<{
      id: string;
      oldStatus: string | null;
      newStatus: string;
      reason: string | null;
      createdAt: string;
    }>
  >(`/alunos/${id}/history`, token);
}

export async function getAlunoTimeline(token: string, id: string) {
  return apiFetch<
    Array<{
      id: string;
      kind: string;
      title: string;
      description?: string | null;
      occurredAt: string;
    }>
  >(`/alunos/${id}/timeline`, token);
}

export async function getAlunoSummary(token: string, id: string) {
  return apiFetch<{
    weight: number | null;
    height: number | null;
    bmi: number | null;
    lastWorkoutAt: string | null;
    lastCheckinAt: string | null;
    nextDueDate: string | null;
    monthlyFee: number | null;
    openReceivables: number;
  }>(`/alunos/${id}/summary`, token);
}

export async function uploadAlunoPhoto(token: string, id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<Student>(`/alunos/${id}/photo`, token, {
    method: 'POST',
    body: form,
  });
}

export async function uploadAlunoDocument(
  token: string,
  id: string,
  file: File,
  type: string,
) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ id: string; type: string; storagePath: string; fileName: string | null }>(
    `/alunos/${id}/documents?type=${encodeURIComponent(type)}`,
    token,
    {
      method: 'POST',
      body: form,
    },
  );
}

export type { StudentListItem, Student };
