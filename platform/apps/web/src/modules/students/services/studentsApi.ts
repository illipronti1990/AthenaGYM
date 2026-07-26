import type { StudentListItem, StudentListResponse, Student } from '@athena/shared';

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

export async function listStudents(
  token: string,
  params: Record<string, string | undefined> = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const q = qs.toString();
  return apiFetch<StudentListResponse>(`/students${q ? `?${q}` : ''}`, token);
}

export async function getStudent(token: string, id: string) {
  return apiFetch<Student>(`/students/${id}`, token);
}

export async function createStudent(token: string, body: Record<string, unknown>) {
  return apiFetch<Student>('/students', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateStudent(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return apiFetch<Student>(`/students/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteStudent(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(`/students/${id}`, token, {
    method: 'DELETE',
  });
}

export async function changeStudentStatus(
  token: string,
  id: string,
  status: string,
  reason?: string,
) {
  return apiFetch<Student>(`/students/${id}/status`, token, {
    method: 'POST',
    body: JSON.stringify({ status, reason }),
  });
}

export async function getStudentHistory(token: string, id: string) {
  return apiFetch<
    Array<{
      id: string;
      oldStatus: string | null;
      newStatus: string;
      reason: string | null;
      createdAt: string;
    }>
  >(`/students/${id}/history`, token);
}

export type { StudentListItem, Student };
