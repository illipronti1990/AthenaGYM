import type {
  AccessDevice,
  Checkin,
  ClassEnrollment,
  AgendaDashboard,
  AgendaKpis,
  AgendaSuggestion,
  Modality,
  OperationsDashboard,
  PartnerAccessRequest,
  PartnerIntegration,
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
  if (!res.ok) {
    const text = await res.text();
    let message = `${path} failed (${res.status})`;
    try {
      const parsed = JSON.parse(text) as {
        message?: string | { message?: string; code?: string };
      };
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

export const operationsApi = {
  occupancy: (t: string) => apiFetch<OperationsDashboard>('/occupancy', t),
  schedules: (
    t: string,
    filters?: { from?: string; to?: string; type?: string; teacherId?: string; roomId?: string; modalityId?: string },
  ) => {
    const query = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => value && query.set(key, value));
    const suffix = query.toString() ? `?${query}` : '';
    return apiFetch<Schedule[]>(`/schedule${suffix}`, t);
  },
  createSchedule: (t: string, body: Record<string, unknown>) =>
    apiFetch<Schedule>('/schedule', t, { method: 'POST', body: JSON.stringify(body) }),
  updateSchedule: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Schedule>(`/schedule/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  cancelSchedule: (t: string, id: string) =>
    apiFetch<Schedule>(`/schedule/${id}/cancel`, t, { method: 'POST', body: '{}' }),
  copyWeek: (t: string, body: Record<string, unknown>) =>
    apiFetch<{ copied: number }>('/schedule/copy-week', t, { method: 'POST', body: JSON.stringify(body) }),
  completeClass: (t: string, id: string) =>
    apiFetch<{ schedule: Schedule }>(`/classes/${id}/complete`, t, { method: 'POST', body: '{}' }),
  attendance: (t: string, id: string, items: Array<{ enrollmentId: string; status: 'checked_in' | 'no_show' | 'reserved' }>) =>
    apiFetch<{ updated: number; items: ClassEnrollment[] }>(`/classes/${id}/attendance`, t, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  updateEnrollment: (t: string, scheduleId: string, enrollmentId: string, status: string) =>
    apiFetch<ClassEnrollment>(`/classes/${scheduleId}/enrollments/${enrollmentId}`, t, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  agendaDashboard: (t: string) => apiFetch<AgendaDashboard>('/agenda/dashboard', t),
  agendaKpis: (t: string, from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    const suffix = query.toString() ? `?${query}` : '';
    return apiFetch<AgendaKpis>(`/agenda/kpis${suffix}`, t);
  },
  teacherAgenda: (t: string, from?: string, to?: string) => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return apiFetch<Schedule[]>(`/agenda/teacher${query.toString() ? `?${query}` : ''}`, t);
  },
  agendaSuggestions: (t: string) => apiFetch<AgendaSuggestion[]>('/agenda/suggestions', t),
  modalities: (t: string) => apiFetch<Modality[]>('/modalities', t),
  createModality: (t: string, body: Record<string, unknown>) =>
    apiFetch<Modality>('/modalities', t, { method: 'POST', body: JSON.stringify(body) }),
  updateModality: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Modality>(`/modalities/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
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
  updateRoom: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Room>(`/rooms/${id}`, t, { method: 'PATCH', body: JSON.stringify(body) }),
  portalAgenda: (t: string) =>
    apiFetch<{
      student: { id: string; fullName: string; email: string | null };
      upcoming: Array<{
        schedule: Schedule;
        enrollment: ClassEnrollment;
        canCancel?: boolean;
        cancelBlockedReason?: string | null;
      }>;
      openClasses: Schedule[];
      cancelCutoffMinutes?: number;
    }>('/portal/agenda', t),
  portalEnroll: (t: string, scheduleId: string) =>
    apiFetch<ClassEnrollment>(`/portal/agenda/${scheduleId}/enroll`, t, { method: 'POST', body: '{}' }),
  portalCancelEnroll: (t: string, scheduleId: string) =>
    apiFetch<ClassEnrollment>(`/portal/agenda/${scheduleId}/enroll`, t, { method: 'DELETE' }),
  partnerIntegrations: (t: string) =>
    apiFetch<PartnerIntegration[]>('/partners/integrations', t),
  updatePartnerIntegration: (t: string, body: Record<string, unknown>) =>
    apiFetch<PartnerIntegration>('/partners/integrations', t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  partnerAccessRequests: (t: string, status?: string) =>
    apiFetch<PartnerAccessRequest[]>(
      `/partners/access-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      t,
    ),
  createPartnerAccessRequest: (t: string, body: Record<string, unknown>) =>
    apiFetch<PartnerAccessRequest>('/partners/access-requests', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  approvePartnerAccess: (t: string, id: string) =>
    apiFetch<PartnerAccessRequest>(`/partners/access-requests/${id}/approve`, t, {
      method: 'POST',
      body: '{}',
    }),
  rejectPartnerAccess: (t: string, id: string, reason?: string) =>
    apiFetch<PartnerAccessRequest>(`/partners/access-requests/${id}/reject`, t, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
