import type {
  AccessDevice,
  Checkin,
  ClassEnrollment,
  OperationsDashboard,
  Room,
  Schedule,
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
  return res.json() as Promise<T>;
}

export const operationsApi = {
  occupancy: (t: string) => apiFetch<OperationsDashboard>('/occupancy', t),
  schedules: (t: string) => apiFetch<Schedule[]>('/schedule', t),
  createSchedule: (t: string, body: Record<string, unknown>) =>
    apiFetch<Schedule>('/schedule', t, { method: 'POST', body: JSON.stringify(body) }),
  classes: (t: string) => apiFetch<Schedule[]>('/classes', t),
  enrollments: (t: string, scheduleId: string) =>
    apiFetch<ClassEnrollment[]>(`/classes/${scheduleId}/enrollments`, t),
  enroll: (t: string, scheduleId: string, studentId: string) =>
    apiFetch<ClassEnrollment>(`/classes/${scheduleId}/enroll`, t, {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    }),
  cancelEnroll: (t: string, scheduleId: string, studentId: string) =>
    apiFetch<ClassEnrollment>(`/classes/${scheduleId}/enroll?studentId=${studentId}`, t, {
      method: 'DELETE',
    }),
  checkins: (t: string, studentId?: string) =>
    apiFetch<Checkin[]>(
      studentId ? `/checkins/history?studentId=${studentId}` : '/checkins/history',
      t,
    ),
  createCheckin: (t: string, body: Record<string, unknown>) =>
    apiFetch<Checkin>('/checkins', t, { method: 'POST', body: JSON.stringify(body) }),
  generateQr: (t: string, studentId: string, unitId?: string) =>
    apiFetch<{ token: string; expiresIn: number; expiresAt: string }>('/checkins/qr', t, {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        ...(unitId ? { unitId } : {}),
      }),
    }),
  devices: (t: string) => apiFetch<AccessDevice[]>('/access/devices', t),
  validateAccess: (t: string, body: Record<string, unknown>) =>
    apiFetch<{ allowed: boolean }>('/access/validate', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  openGate: (t: string, deviceId: string, studentId?: string) =>
    apiFetch<{ opened: boolean; message?: string }>('/access/open-gate', t, {
      method: 'POST',
      body: JSON.stringify({ deviceId, studentId }),
    }),
  rooms: (t: string) => apiFetch<Room[]>('/rooms', t),
};
