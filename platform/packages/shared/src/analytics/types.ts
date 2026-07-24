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
  profit: number;
  profitDeltaPct: number;
  churn: number;
  churnDeltaPct: number;
  conversion: number;
  conversionDeltaPct: number;
  checkins: number;
  checkinsDeltaPct: number;
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
