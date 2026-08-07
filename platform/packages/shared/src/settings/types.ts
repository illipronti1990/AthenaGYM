export interface GymBusinessHours {
  [weekday: string]: { open: string; close: string; closed?: boolean } | undefined;
}

export interface GymSettings {
  id: string;
  companyId: string;
  name: string;
  cnpj: string | null;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  primaryColor: string;
  secondaryColor: string;
  receiptFooter: string | null;
  businessHours: GymBusinessHours;
  interestRate: number;
  fineRate: number;
  maxDiscountPct: number;
  graceDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface GymSettingsFinancialAccountSummary {
  id: string;
  name: string;
  bankName: string | null;
  pixKey: string | null;
  active: boolean;
}

export interface GymSettingsResponse {
  settings: GymSettings;
  accounts: GymSettingsFinancialAccountSummary[];
}

export interface AuditLogItem {
  id: string;
  companyId: string | null;
  userId: string | null;
  module: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  ip: string | null;
  browser: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface OpsDashboardSeriesPoint {
  date: string;
  value: number;
}

export interface OpsDashboardBirthday {
  id: string;
  fullName: string;
  birthDate: string;
  daysUntil: number;
}

export interface OpsDashboard {
  checkinsToday: number;
  newStudentsToday: number;
  receivablesDueSoon: number;
  receivablesOverdue: number;
  cashToday: number;
  agendaToday: number;
  upcomingAssessments: number;
  birthdaysSoon: OpsDashboardBirthday[];
  revenueLast30Days: OpsDashboardSeriesPoint[];
  checkinsByDay: OpsDashboardSeriesPoint[];
  newStudentsByDay: OpsDashboardSeriesPoint[];
  delinquencyRate: number;
  monthlyEvolution: OpsDashboardSeriesPoint[];
}

export interface UserFavorite {
  id: string;
  profileId: string;
  companyId: string;
  href: string;
  label: string;
  sortOrder: number;
  createdAt: string;
}

export interface GlobalSearchHit {
  type:
    | 'student'
    | 'enrollment'
    | 'receivable'
    | 'workout'
    | 'assessment'
    | 'payment'
    | 'plan'
    | 'product'
    | 'trainer'
    | 'class_session'
    | 'setting';
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface GlobalSearchResult {
  query: string;
  hits: GlobalSearchHit[];
}

export interface TimelineEvent {
  id: string;
  module: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  userId: string | null;
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  timestamp: string;
  checks: {
    api: { status: 'ok' | 'down' };
    database: { status: 'ok' | 'down'; latencyMs?: number; error?: string };
    supabase: { status: 'ok' | 'down'; error?: string };
    storage: { status: 'ok' | 'down'; buckets?: number; error?: string };
    worker: { status: 'ok' | 'down' | 'unknown'; error?: string };
    cache?: { status: 'ok' | 'down'; latencyMs?: number; error?: string };
  };
}

