export type DashboardWidgetId =
  | 'kpis'
  | 'revenueChart'
  | 'checkinChart'
  | 'agenda'
  | 'activities'
  | 'dues'
  | 'birthdays'
  | 'goals'
  | 'ranking'
  | 'quickActions';

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

export interface DashboardActivity {
  id: string;
  at: string;
  title: string;
  subtitle?: string | null;
  href?: string;
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

/** PX-3 command-center dashboard payload (distinct from analytics ExecutiveDashboard). */
export interface CommandDashboard {
  greetingHint: string;
  kpis: DashboardKpi[];
  revenueChart: DashboardChartPoint[];
  checkinChart: DashboardChartPoint[];
  agenda: DashboardAgendaItem[];
  activities: DashboardActivity[];
  dues: DashboardDuesSummary;
  birthdays: DashboardBirthday[];
  goals: DashboardGoal[];
  ranking: DashboardRankingRow[];
  layout: DashboardLayoutItem[];
  generatedAt: string;
}

/** @deprecated alias — use CommandDashboard */
export type OpsExecutiveDashboard = CommandDashboard;

export type DashboardChartPeriod = '7d' | '30d' | '90d' | '12m';

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  { id: 'quickActions', visible: true, order: 0 },
  { id: 'kpis', visible: true, order: 1 },
  { id: 'revenueChart', visible: true, order: 2 },
  { id: 'checkinChart', visible: true, order: 3 },
  { id: 'agenda', visible: true, order: 4 },
  { id: 'activities', visible: true, order: 5 },
  { id: 'dues', visible: true, order: 6 },
  { id: 'birthdays', visible: true, order: 7 },
  { id: 'goals', visible: true, order: 8 },
  { id: 'ranking', visible: true, order: 9 },
];
