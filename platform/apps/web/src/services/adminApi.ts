import type {
  Department,
  Employee,
  HrJobTitle,
  Role,
} from '@athena/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function adminFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv')) return (await res.text()) as T;
  return res.json() as Promise<T>;
}

export async function apiAdminDashboard(token: string) {
  return adminFetch<Record<string, number>>('/admin/dashboard', token);
}

export async function apiAdminCalendar(token: string, from?: string, to?: string) {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  const qs = q.toString();
  return adminFetch<Array<{ id: string; type: string; title: string; date: string; href?: string }>>(
    `/admin/calendar${qs ? `?${qs}` : ''}`,
    token,
  );
}

export async function apiAdminSettings(token: string) {
  return adminFetch<{ companyId: string; settings: Record<string, unknown> }>(
    '/admin/settings',
    token,
  );
}

export async function apiAdminSaveSettings(token: string, settings: Record<string, unknown>) {
  return adminFetch('/admin/settings', token, {
    method: 'PATCH',
    body: JSON.stringify({ settings }),
  });
}

export async function apiAdminDepartments(token: string) {
  return adminFetch<Department[]>('/admin/departments', token);
}

export async function apiAdminUpsertDepartment(
  token: string,
  body: { id?: string; name: string; active?: boolean },
) {
  return adminFetch('/admin/departments', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminJobTitles(token: string) {
  return adminFetch<HrJobTitle[]>('/admin/job-titles', token);
}

export async function apiAdminUpsertJobTitle(
  token: string,
  body: { id?: string; name: string; departmentId?: string; active?: boolean },
) {
  return adminFetch('/admin/job-titles', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminEmployees(token: string, status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminFetch<Employee[]>(`/admin/employees${qs}`, token);
}

export async function apiAdminEmployee(token: string, id: string) {
  return adminFetch<Employee>(`/admin/employees/${id}`, token);
}

export async function apiAdminCreateEmployee(token: string, body: Record<string, unknown>) {
  return adminFetch<Employee>('/admin/employees', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminUpdateEmployee(
  token: string,
  id: string,
  body: Record<string, unknown>,
) {
  return adminFetch<Employee>(`/admin/employees/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiAdminDeleteEmployee(token: string, id: string) {
  return adminFetch<{ ok: boolean }>(`/admin/employees/${id}`, token, { method: 'DELETE' });
}

export async function apiAdminSchedules(
  token: string,
  opts?: { from?: string; to?: string; employeeId?: string },
) {
  const q = new URLSearchParams();
  if (opts?.from) q.set('from', opts.from);
  if (opts?.to) q.set('to', opts.to);
  if (opts?.employeeId) q.set('employeeId', opts.employeeId);
  const qs = q.toString();
  return adminFetch<Array<Record<string, unknown>>>(`/admin/schedules${qs ? `?${qs}` : ''}`, token);
}

export async function apiAdminUpsertSchedule(token: string, body: Record<string, unknown>) {
  return adminFetch('/admin/schedules', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminAssets(token: string) {
  return adminFetch<Array<Record<string, unknown>>>('/admin/assets', token);
}

export async function apiAdminUpsertAsset(token: string, body: Record<string, unknown>) {
  return adminFetch('/admin/assets', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminDeleteAsset(token: string, id: string) {
  return adminFetch(`/admin/assets/${id}`, token, { method: 'DELETE' });
}

export async function apiAdminAssetCategories(token: string) {
  return adminFetch<Array<{ id: string; name: string }>>('/admin/asset-categories', token);
}

export async function apiAdminMaintenance(token: string, status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminFetch<Array<Record<string, unknown>>>(`/admin/maintenance${qs}`, token);
}

export async function apiAdminUpsertMaintenance(token: string, body: Record<string, unknown>) {
  return adminFetch('/admin/maintenance', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminDocuments(token: string) {
  return adminFetch<Array<Record<string, unknown>>>('/admin/documents', token);
}

export async function apiAdminUpsertDocument(token: string, body: Record<string, unknown>) {
  return adminFetch('/admin/documents', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminDeleteDocument(token: string, id: string) {
  return adminFetch(`/admin/documents/${id}`, token, { method: 'DELETE' });
}

export async function apiAdminIncidents(token: string) {
  return adminFetch<Array<Record<string, unknown>>>('/admin/incidents', token);
}

export async function apiAdminUpsertIncident(token: string, body: Record<string, unknown>) {
  return adminFetch('/admin/incidents', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminAnnouncements(token: string) {
  return adminFetch<Array<Record<string, unknown>>>('/admin/announcements', token);
}

export async function apiAdminUpsertAnnouncement(token: string, body: Record<string, unknown>) {
  return adminFetch('/admin/announcements', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminReport(token: string, kind: string) {
  return adminFetch<string>(`/admin/reports/${kind}`, token);
}

export async function apiAdminCostCenters(token: string) {
  return adminFetch<
    Array<{
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      active: boolean;
    }>
  >('/finance/cost-centers', token);
}

export async function apiAdminCreateCostCenter(
  token: string,
  body: { name: string; description?: string; category?: string },
) {
  return adminFetch('/finance/cost-centers', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminUpdateCostCenter(
  token: string,
  id: string,
  body: { name?: string; description?: string; category?: string; active?: boolean },
) {
  return adminFetch(`/finance/cost-centers/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function apiAdminDeleteCostCenter(token: string, id: string) {
  return adminFetch(`/finance/cost-centers/${id}`, token, { method: 'DELETE' });
}

export async function apiAdminCreateRole(
  token: string,
  body: { name: string; slug: string; description?: string },
) {
  return adminFetch<Role>('/roles', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function apiAdminSetRolePermissions(
  token: string,
  roleId: string,
  permissionIds: string[],
) {
  return adminFetch<Role>(`/roles/${roleId}/permissions`, token, {
    method: 'POST',
    body: JSON.stringify({ permissionIds }),
  });
}

export async function apiAdminAssignRole(
  token: string,
  body: { profileId: string; roleId: string; unitId?: string },
) {
  return adminFetch('/roles/assign', token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
