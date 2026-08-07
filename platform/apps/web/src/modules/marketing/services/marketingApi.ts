const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export type DemoRequestPayload = {
  fullName: string;
  academyName: string;
  city: string;
  state?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  studentCount: number;
  primaryInterest?: string;
  planInterest?: string;
  message?: string;
  consentLgpd: boolean;
  website?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
};

export type DemoRequestResponse = {
  ok: boolean;
  id?: string;
  message?: string;
};

async function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
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

export const marketingApi = {
  async submitDemoRequest(body: DemoRequestPayload): Promise<DemoRequestResponse> {
    const res = await fetch(`${API_URL}/marketing/demo-requests`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: body.fullName,
        academyName: body.academyName,
        city: body.city,
        state: body.state,
        email: body.email,
        phone: body.whatsapp || body.phone,
        whatsapp: body.whatsapp || body.phone,
        studentCount: body.studentCount,
        primaryInterest: body.primaryInterest,
        planInterest: body.planInterest,
        message: body.message || '',
        consentLgpd: body.consentLgpd,
        website: body.website || '',
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        referrer: body.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      }),
    });
    const text = await res.text();
    let data: DemoRequestResponse = { ok: res.ok };
    try {
      data = { ...JSON.parse(text), ok: res.ok };
    } catch {
      data = { ok: res.ok, message: text || `Erro ${res.status}` };
    }
    if (!res.ok) throw new Error(data.message || `Falha ao enviar (${res.status})`);
    return data;
  },

  listLeads: (token: string, status?: string) =>
    authFetch<Record<string, unknown>[]>(
      `/marketing/demo-requests${status ? `?status=${encodeURIComponent(status)}` : ''}`,
      token,
    ),

  getLead: (token: string, id: string) =>
    authFetch<Record<string, unknown>>(`/marketing/demo-requests/${id}`, token),

  updateLead: (token: string, id: string, body: Record<string, unknown>) =>
    authFetch<Record<string, unknown>>(`/marketing/demo-requests/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  analytics: (token: string) =>
    authFetch<{
      totalLeads: number;
      byStatus: Record<string, number>;
      byUtm: Record<string, number>;
      demosScheduled: number;
    }>('/marketing/analytics/summary', token),

  listOnboarding: (token: string) =>
    authFetch<Record<string, unknown>[]>('/marketing/onboarding', token),

  upsertOnboarding: (token: string, body: Record<string, unknown>) =>
    authFetch<Record<string, unknown>>('/marketing/onboarding', token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
