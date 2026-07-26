import type { MeResponse, Role, UserListItem, Profile } from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(
  path: string,
  accessToken: string | null,
  init?: RequestInit & { companyId?: string; unitId?: string },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (init?.companyId) headers['X-Company-Id'] = init.companyId;
  if (init?.unitId) headers['X-Unit-Id'] = init.unitId;
  if (init?.body && !headers['Content-Type']) {
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
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiGetMe(accessToken: string): Promise<MeResponse> {
  return apiFetch('/auth/me', accessToken);
}

export async function apiHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Health failed (${res.status})`);
  return res.json();
}

export async function apiResetPassword(email: string) {
  return apiFetch<{ ok: boolean }>('/auth/reset-password', null, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiAcceptInvite(body: {
  token: string;
  password: string;
  fullName?: string;
  phone?: string;
}) {
  return apiFetch<{ ok: boolean }>('/auth/accept', null, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiChangePassword(accessToken: string, newPassword: string) {
  return apiFetch<{ ok: boolean }>('/auth/change-password', accessToken, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

export async function apiUpdateProfile(
  accessToken: string,
  body: Partial<{
    fullName: string;
    phone: string;
    avatarUrl: string;
    locale: string;
    timezone: string;
    defaultUnitId: string;
    theme: 'light' | 'dark' | 'system';
    preferences: Record<string, unknown>;
  }>,
) {
  return apiFetch<Profile>('/auth/profile', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiListUsers(accessToken: string, companyId?: string) {
  return apiFetch<UserListItem[]>('/users', accessToken, { companyId });
}

export async function apiInviteUser(
  accessToken: string,
  body: {
    email: string;
    fullName?: string;
    phone?: string;
    roleId: string;
    unitId?: string;
    companyId?: string;
  },
) {
  return apiFetch<{
    token: string;
    acceptPath: string;
    userId?: string;
    temporaryPassword?: string;
    status?: string;
  }>('/auth/invite', accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
    companyId: body.companyId,
  });
}

export async function apiListRoles(accessToken: string) {
  return apiFetch<Role[]>('/roles', accessToken);
}

export async function apiListPermissions(accessToken: string) {
  return apiFetch<Array<{ id: string; code: string; description: string | null }>>(
    '/permissions',
    accessToken,
  );
}
