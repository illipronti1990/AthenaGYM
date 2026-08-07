import type {
  AudienceSegment,
  AutomationFlow,
  CrmDashboard as SharedCrmDashboard,
  CrmKpis,
  LoyaltyAccount,
  LoyaltyEarnRule,
  LoyaltyReward,
  MessageTemplate,
  NpsDashboard,
  Referral,
} from '@movvo/shared';

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
    throw new Error(`${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export type CrmDashboardView = SharedCrmDashboard & {
  conversionRate?: number;
  churnRisk?: number;
  loyaltyMembers?: number;
  birthdaysThisWeek?: number;
  activeLeads?: number;
};

export type Birthday = {
  studentId: string;
  fullName: string;
  birthDate?: string;
  date?: string;
};

export type RecoveryStudent = {
  studentId: string;
  fullName: string;
  studentName?: string;
  lastCheckin?: string | null;
  lastAccessAt?: string | null;
  daysSince?: number;
  reason?: string;
  cancelReason?: string | null;
  status?: string;
  source?: 'cancelled' | 'inactive' | 'low_checkin';
};

export type RecoveryPayload = {
  cancelledEnrollments?: Array<{
    enrollmentId: string;
    studentId: string;
    studentName: string;
    cancelledAt: string;
    cancelReason: string | null;
  }>;
  inactiveStudents?: Array<{
    studentId: string;
    studentName: string;
    phone?: string | null;
    whatsapp?: string | null;
    lastAccessAt?: string | null;
  }>;
  lowCheckinStudents?: Array<{
    studentId: string;
    studentName: string;
    lastCheckinAt?: string | null;
  }>;
  since30?: string;
};

export type ChurnRisk = {
  studentId: string;
  fullName?: string;
  studentName?: string;
  score?: number;
  riskScore?: number;
  reasons?: string[];
  nextBestActions?: Array<{ action?: string; type?: string; label?: string; priority?: number } | string>;
  nextBestAction?: string;
};

export type NpsDashboardView = NpsDashboard & {
  score?: number;
  responses?: Array<{
    id?: string;
    score: number;
    comment?: string | null;
    createdAt?: string;
  }>;
};

function daysBetween(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return undefined;
  return Math.max(0, Math.ceil(ms / 86400000));
}

function normalizeRecovery(payload: RecoveryPayload | RecoveryStudent[]): RecoveryStudent[] {
  if (Array.isArray(payload)) return payload;
  const rows: RecoveryStudent[] = [];
  for (const e of payload.cancelledEnrollments || []) {
    rows.push({
      studentId: e.studentId,
      fullName: e.studentName,
      studentName: e.studentName,
      reason: e.cancelReason || 'Cancelamento',
      cancelReason: e.cancelReason,
      daysSince: daysBetween(e.cancelledAt),
      status: 'cancelled',
      source: 'cancelled',
    });
  }
  for (const s of payload.inactiveStudents || []) {
    rows.push({
      studentId: s.studentId,
      fullName: s.studentName,
      studentName: s.studentName,
      lastAccessAt: s.lastAccessAt,
      lastCheckin: s.lastAccessAt,
      daysSince: daysBetween(s.lastAccessAt),
      reason: 'Inativo',
      status: 'inactive',
      source: 'inactive',
    });
  }
  for (const s of payload.lowCheckinStudents || []) {
    rows.push({
      studentId: s.studentId,
      fullName: s.studentName,
      studentName: s.studentName,
      lastCheckin: s.lastCheckinAt,
      daysSince: daysBetween(s.lastCheckinAt),
      reason: 'Baixa frequência',
      status: 'low_checkin',
      source: 'low_checkin',
    });
  }
  return rows;
}

function normalizeBirthdays(raw: Array<Record<string, unknown>>): Birthday[] {
  return raw.map((r) => {
    const birthDate = String(r.birth_date ?? r.birthDate ?? r.date ?? '');
    return {
      studentId: String(r.id ?? r.studentId ?? ''),
      fullName: String(r.full_name ?? r.fullName ?? 'Aluno'),
      birthDate: birthDate || undefined,
      date: birthDate || undefined,
    };
  });
}

export const crmApi = {
  dashboard: async (t: string): Promise<CrmDashboardView> => {
    const [dash, kpis, risk, birthdaysRaw] = await Promise.all([
      apiFetch<SharedCrmDashboard>('/crm/dashboard', t),
      apiFetch<CrmKpis>('/crm/kpis', t).catch(() => null),
      apiFetch<ChurnRisk[]>('/crm/risk', t).catch(() => []),
      apiFetch<Array<Record<string, unknown>>>('/crm/birthdays', t).catch(() => []),
    ]);
    const birthdays = normalizeBirthdays(Array.isArray(birthdaysRaw) ? birthdaysRaw : []);
    return {
      ...dash,
      activeLeads: dash.openLeads,
      conversionRate: kpis?.conversionRate ?? 0,
      churnRisk: Array.isArray(risk) ? risk.length : 0,
      birthdaysThisWeek: birthdays.length,
      loyaltyMembers: 0,
      npsScore: dash.npsScore,
    };
  },
  kpis: (t: string) => apiFetch<CrmKpis>('/crm/kpis', t),
  birthdays: async (t: string): Promise<Birthday[]> => {
    const raw = await apiFetch<Array<Record<string, unknown>>>('/crm/birthdays', t);
    return normalizeBirthdays(Array.isArray(raw) ? raw : []);
  },
  recovery: async (t: string): Promise<RecoveryStudent[]> => {
    const raw = await apiFetch<RecoveryPayload | RecoveryStudent[]>('/crm/recovery', t);
    return normalizeRecovery(raw);
  },
  riskList: (t: string) => apiFetch<ChurnRisk[]>('/crm/risk', t),
  refreshRisk: (t: string) =>
    apiFetch<unknown>('/crm/risk/refresh', t, { method: 'POST', body: '{}' }),

  npsDashboard: (t: string) => apiFetch<NpsDashboardView>('/nps/dashboard', t),
  submitNps: (t: string, body: Record<string, unknown>) =>
    apiFetch<unknown>('/portal/nps', t, { method: 'POST', body: JSON.stringify(body) }),

  referrals: (t: string) => apiFetch<Referral[]>('/referrals', t),
  submitReferral: (t: string, body: Record<string, unknown>) =>
    apiFetch<Referral>('/portal/referrals', t, { method: 'POST', body: JSON.stringify(body) }),
  rewardReferral: (t: string, id: string, body: Record<string, unknown> = {}) =>
    apiFetch<Referral>(`/referrals/${id}/reward`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  segments: (t: string) => apiFetch<AudienceSegment[]>('/segments', t),
  createSegment: (t: string, body: Record<string, unknown>) =>
    apiFetch<AudienceSegment>('/segments', t, { method: 'POST', body: JSON.stringify(body) }),
  resolveSegment: (t: string, id: string) =>
    apiFetch<{ count: number; studentIds: string[] }>(`/segments/${id}/resolve`, t, {
      method: 'POST',
      body: '{}',
    }),

  templates: (t: string) => apiFetch<MessageTemplate[]>('/templates', t),
  createTemplate: (t: string, body: Record<string, unknown>) =>
    apiFetch<MessageTemplate>('/templates', t, { method: 'POST', body: JSON.stringify(body) }),
  sendTemplate: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<unknown>(`/templates/${id}/send`, t, { method: 'POST', body: JSON.stringify(body) }),

  loyaltyAccount: (t: string, studentId: string) =>
    apiFetch<LoyaltyAccount>(`/loyalty?studentId=${studentId}`, t),
  loyaltyEarn: (t: string, body: Record<string, unknown>) =>
    apiFetch<LoyaltyAccount>('/loyalty/earn', t, { method: 'POST', body: JSON.stringify(body) }),
  loyaltyRedeem: (t: string, body: Record<string, unknown>) =>
    apiFetch<unknown>('/loyalty/redeem', t, { method: 'POST', body: JSON.stringify(body) }),
  loyaltyRewards: (t: string) => apiFetch<LoyaltyReward[]>('/loyalty/rewards', t),
  loyaltyEarnRules: (t: string) => apiFetch<LoyaltyEarnRule[]>('/loyalty/earn-rules', t),

  automations: (t: string) => apiFetch<AutomationFlow[]>('/automations', t),
  runAutomation: (t: string, id: string) =>
    apiFetch<unknown>(`/automations/${id}/run`, t, { method: 'POST', body: '{}' }),

  convertLead: (t: string, id: string, body: Record<string, unknown> = {}) =>
    apiFetch<{ studentId: string; lead: unknown }>(`/sales/leads/${id}/convert`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
