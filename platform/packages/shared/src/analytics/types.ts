export type KpiItem = {
  code: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  deltaPct: number | null;
};

export type ExecutiveDashboard = {
  revenue: number;
  revenueDeltaPct: number;
  revenueDay: number;
  revenueMonth: number;
  revenueYear: number;
  mrr: number;
  avgTicket: number;
  profit: number;
  profitDeltaPct: number;
  churn: number;
  churnDeltaPct: number;
  delinquency: number;
  cashAvailable: number;
  conversion: number;
  conversionDeltaPct: number;
  checkins: number;
  checkinsDeltaPct: number;
  newStudents: number;
  cancellations: number;
  frequency: number;
  occupancy: number;
  updatedAt: string;
};

export type AnalyticsDashboard = {
  executive: ExecutiveDashboard;
  kpis: KpiItem[];
  byCategory: Record<string, KpiItem[]>;
};

export type PredictionItem = {
  id: string;
  entityType: string;
  entityId: string;
  predictionType: string;
  score: number;
  label: string | null;
  recommendation: string | null;
  features: Record<string, unknown>;
  createdAt: string;
};

export type ReportDefinition = {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  source: string;
  fields: string[];
  filters: Record<string, unknown>;
  groupBy: string[];
  shared: boolean;
  createdAt: string;
};

export type ExportJob = {
  id: string;
  companyId: string;
  reportId: string | null;
  format: string;
  status: string;
  fileUrl: string | null;
  rowCount: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type ReportSchedule = {
  id: string;
  reportId: string;
  cron: string;
  channel: string;
  format: string;
  active: boolean;
  lastRunAt: string | null;
};

export type BiInsight = {
  severity: 'info' | 'warning' | 'critical';
  code: string;
  title: string;
  recommendation: string;
  evidence: Record<string, unknown>;
};

export type BiInsightsResponse = {
  provider: string;
  llm: string;
  question: string | null;
  insights: BiInsight[];
  sources: string[];
};

export type HeatmapCell = {
  key: string;
  label: string;
  value: number;
};

export type HeatmapResponse = {
  type: string;
  available: boolean;
  reason?: string;
  cells: HeatmapCell[];
};

export type CompareResponse = {
  metric: string;
  period: string;
  current: number;
  previous: number;
  deltaPct: number;
  series?: Array<{ label: string; current: number; previous: number }>;
  note?: string;
};

export type BenchmarkItem = {
  id: string;
  label: string;
  value: number;
  rank: number;
};

export type BenchmarkResponse = {
  dimension: string;
  items: BenchmarkItem[];
};

export type BiGoal = {
  id: string;
  companyId: string;
  unitId: string | null;
  metric: string;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  label: string | null;
  active: boolean;
  currentValue: number;
  progressPct: number;
  createdAt: string;
};

export type BiAlert = {
  id: string;
  companyId: string;
  code: string;
  severity: string;
  title: string;
  message: string;
  recommendation: string | null;
  evidence: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type BiConnector = {
  id: string;
  companyId: string;
  provider: string;
  status: string;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
};

export type ForecastResult = {
  type: string;
  value: number;
  confidence: number;
  unit: string;
  label: string;
  method: string;
};

export type CommercialInsight = {
  campaignId: string;
  name: string;
  roiPct: number | null;
  score: number;
  stars: number;
  recommendation: string;
  note?: string;
};

export type AthenaAiChatResponse = {
  provider: string;
  llm: string;
  answer: string;
  sources: string[];
  persona?: 'admin' | 'professor' | 'aluno';
  data?: Record<string, unknown>;
};
