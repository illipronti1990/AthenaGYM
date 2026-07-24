export type KpiCategory = 'finance' | 'sales' | 'operations' | 'workouts' | 'app';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

export type ChurnFeatures = {
  daysSinceLastCheckin: number;
  missedWorkouts30d: number;
  overdueInvoices: number;
  complaints90d: number;
  planMonthsRemaining: number;
  ageYears?: number;
};

export type ChurnPrediction = {
  score: number;
  label: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  features: ChurnFeatures;
};

/** Heuristic churn score 0..1 — replace with ML model later */
export function predictChurn(features: ChurnFeatures): ChurnPrediction {
  let score = 0;
  if (features.daysSinceLastCheckin >= 21) score += 0.35;
  else if (features.daysSinceLastCheckin >= 14) score += 0.25;
  else if (features.daysSinceLastCheckin >= 7) score += 0.15;

  if (features.missedWorkouts30d >= 8) score += 0.2;
  else if (features.missedWorkouts30d >= 4) score += 0.1;

  if (features.overdueInvoices >= 2) score += 0.25;
  else if (features.overdueInvoices >= 1) score += 0.15;

  if (features.complaints90d >= 2) score += 0.15;
  else if (features.complaints90d >= 1) score += 0.08;

  if (features.planMonthsRemaining <= 1) score += 0.1;

  score = Math.min(1, Math.round(score * 1000) / 1000);

  let label: ChurnPrediction['label'] = 'low';
  if (score >= 0.8) label = 'critical';
  else if (score >= 0.55) label = 'high';
  else if (score >= 0.3) label = 'medium';

  const recommendation =
    label === 'critical' || label === 'high'
      ? 'Entrar em contato. Oferecer retenção ou reagendar avaliação.'
      : label === 'medium'
        ? 'Monitorar frequência e enviar campanha de reengajamento.'
        : 'Manter acompanhamento padrão.';

  return { score, label, recommendation, features };
}

export type LeadConversionFeatures = {
  daysInPipeline: number;
  touchpoints: number;
  hasTrialClass: boolean;
  sourceQuality: number; // 0..1
};

export function predictLeadConversion(f: LeadConversionFeatures): number {
  let score = 0.2 * f.sourceQuality;
  if (f.hasTrialClass) score += 0.25;
  if (f.touchpoints >= 3) score += 0.2;
  else if (f.touchpoints >= 1) score += 0.1;
  if (f.daysInPipeline <= 7) score += 0.2;
  else if (f.daysInPipeline <= 14) score += 0.1;
  else if (f.daysInPipeline > 30) score -= 0.15;
  return Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));
}

export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function averageTicket(revenue: number, enrollments: number): number {
  if (enrollments <= 0) return 0;
  return Math.round((revenue / enrollments) * 100) / 100;
}

export function conversionRate(converted: number, leads: number): number {
  if (leads <= 0) return 0;
  return Math.round((converted / leads) * 1000) / 10;
}

export function churnRate(cancellations: number, activeBase: number): number {
  if (activeBase <= 0) return 0;
  return Math.round((cancellations / activeBase) * 1000) / 10;
}

export type ReportField = { key: string; label: string };

export const REPORT_SOURCES: Record<string, ReportField[]> = {
  checkins: [
    { key: 'date', label: 'Data' },
    { key: 'unit_id', label: 'Unidade' },
    { key: 'checkins', label: 'Check-ins' },
    { key: 'duration_minutes', label: 'Duração (min)' },
  ],
  revenue: [
    { key: 'date', label: 'Data' },
    { key: 'gross_revenue', label: 'Receita bruta' },
    { key: 'net_revenue', label: 'Receita líquida' },
    { key: 'expenses', label: 'Despesas' },
    { key: 'profit', label: 'Lucro' },
  ],
  sales: [
    { key: 'date', label: 'Data' },
    { key: 'pipeline', label: 'Pipeline' },
    { key: 'converted', label: 'Convertido' },
    { key: 'amount', label: 'Valor' },
  ],
  workouts: [
    { key: 'date', label: 'Data' },
    { key: 'completed', label: 'Concluídos' },
    { key: 'load_kg', label: 'Carga' },
    { key: 'calories', label: 'Calorias' },
  ],
};

export function toCsv(rows: Record<string, unknown>[], fields: string[]): string {
  const header = fields.join(',');
  const lines = rows.map((row) =>
    fields
      .map((f) => {
        const v = row[f];
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(','),
  );
  return [header, ...lines].join('\n');
}

export function exportMime(format: ExportFormat): string {
  switch (format) {
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf':
      return 'application/pdf';
    case 'csv':
    default:
      return 'text/csv';
  }
}
