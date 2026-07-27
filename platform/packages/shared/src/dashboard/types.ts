export type DashboardWidgetId =
  | 'daySummary'
  | 'alerts'
  | 'kpis'
  | 'revenueChart'
  | 'checkinChart'
  | 'agenda'
  | 'activities'
  | 'dues'
  | 'birthdays'
  | 'goals'
  | 'ranking'
  | 'quickActions'
  | 'financeSnapshot'
  | 'commercialSnapshot';

export interface DashboardLayoutItem {
  id: DashboardWidgetId;
  visible: boolean;
  order: number;
  collapsed?: boolean;
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  delta?: number;
  deltaLabel?: string;
  href?: string;
  tone: 'gold' | 'red' | 'green' | 'blue' | 'orange' | 'muted';
}

export interface DashboardChartPoint {
  label: string;
  revenue?: number;
  expense?: number;
  profit?: number;
  goal?: number;
  value?: number;
}

export interface DashboardAgendaItem {
  id: string;
  startAt: string;
  title: string;
  type: string;
  href?: string;
}

export type DashboardActivityKind =
  | 'checkin'
  | 'payment'
  | 'enrollment'
  | 'student'
  | 'assessment'
  | 'workout'
  | 'other';

export interface DashboardActivity {
  id: string;
  at: string;
  title: string;
  subtitle?: string | null;
  href?: string;
  kind?: DashboardActivityKind;
  actorName?: string | null;
  photoUrl?: string | null;
}

export interface DashboardBirthday {
  id: string;
  fullName: string;
  birthDate: string;
  age: number | null;
  daysUntil: number;
  photoUrl?: string | null;
  href?: string;
}

export interface DashboardDuesSummary {
  dueToday: number;
  overdue: number;
  receivedMonth: number;
}

export interface DashboardGoal {
  id: string;
  label: string;
  current: number;
  target: number;
  format: 'currency' | 'number' | 'percent';
}

export interface DashboardRankingRow {
  trainerId: string;
  name: string;
  students: number;
  assessments: number;
  checkins: number;
  workouts: number;
}

export interface DashboardDaySummaryItem {
  id: string;
  label: string;
  value: number | string;
  href?: string;
  tone?: 'default' | 'warn' | 'success' | 'info';
}

export interface DashboardDaySummary {
  greeting: string;
  items: DashboardDaySummaryItem[];
  forecastRevenue: number;
}

export type DashboardAlertSeverity = 'critical' | 'warning' | 'info';

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  href?: string;
}

export interface DashboardFinanceSnapshot {
  inflows: number;
  outflows: number;
  balance: number;
}

export interface DashboardCommercialSnapshot {
  newStudents: number;
  cancellations: number;
  conversionRate: number;
}

/** PX-3 / G-2 command-center dashboard payload */
export interface CommandDashboard {
  greetingHint: string;
  daySummary: DashboardDaySummary;
  alerts: DashboardAlert[];
  kpis: DashboardKpi[];
  revenueChart: DashboardChartPoint[];
  checkinChart: DashboardChartPoint[];
  agenda: DashboardAgendaItem[];
  activities: DashboardActivity[];
  dues: DashboardDuesSummary;
  birthdays: DashboardBirthday[];
  goals: DashboardGoal[];
  ranking: DashboardRankingRow[];
  financeSnapshot: DashboardFinanceSnapshot;
  commercialSnapshot: DashboardCommercialSnapshot;
  layout: DashboardLayoutItem[];
  generatedAt: string;
}

/** @deprecated alias — use CommandDashboard */
export type OpsExecutiveDashboard = CommandDashboard;

export type DashboardChartPeriod = '7d' | '30d' | '90d' | '12m';

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { id: 'daySummary', visible: true, order: 0 },
  { id: 'alerts', visible: true, order: 1 },
  { id: 'quickActions', visible: true, order: 2 },
  { id: 'kpis', visible: true, order: 3 },
  { id: 'financeSnapshot', visible: true, order: 4 },
  { id: 'commercialSnapshot', visible: true, order: 5 },
  { id: 'revenueChart', visible: true, order: 6 },
  { id: 'checkinChart', visible: true, order: 7 },
  { id: 'agenda', visible: true, order: 8 },
  { id: 'activities', visible: true, order: 9 },
  { id: 'dues', visible: true, order: 10 },
  { id: 'birthdays', visible: true, order: 11 },
  { id: 'goals', visible: true, order: 12 },
  { id: 'ranking', visible: true, order: 13 },
];

export type DashboardRolePreset = 'admin' | 'reception' | 'trainer' | 'finance' | 'default';

export const ROLE_DASHBOARD_WIDGETS: Record<DashboardRolePreset, DashboardWidgetId[]> = {
  admin: [
    'daySummary',
    'alerts',
    'quickActions',
    'kpis',
    'financeSnapshot',
    'commercialSnapshot',
    'revenueChart',
    'goals',
    'dues',
    'agenda',
    'activities',
    'birthdays',
    'checkinChart',
    'ranking',
  ],
  finance: [
    'daySummary',
    'alerts',
    'kpis',
    'financeSnapshot',
    'dues',
    'revenueChart',
    'goals',
    'activities',
    'quickActions',
  ],
  reception: [
    'daySummary',
    'alerts',
    'quickActions',
    'kpis',
    'agenda',
    'checkinChart',
    'birthdays',
    'commercialSnapshot',
    'activities',
  ],
  trainer: [
    'daySummary',
    'alerts',
    'agenda',
    'kpis',
    'goals',
    'ranking',
    'activities',
    'birthdays',
    'checkinChart',
  ],
  default: DEFAULT_DASHBOARD_LAYOUT.map((i) => i.id),
};
