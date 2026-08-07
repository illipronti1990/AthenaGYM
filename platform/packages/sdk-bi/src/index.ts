export type KpiCategory = 'finance' | 'sales' | 'operations' | 'workouts' | 'app';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

export type ChurnFeatures = {
  daysSinceLastCheckin: number;
  missedWorkouts30d: number;
  overdueInvoices: number;
  complaints90d: number;
  planMonthsRemaining: number;
  ageYears?: number;
  workoutFreshnessDays?: number;
  checkins30d?: number;
};

export type ChurnPrediction = {
  score: number;
  label: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  features: ChurnFeatures;
  reasons: string[];
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

  const workoutFreshnessDays = features.workoutFreshnessDays ?? 0;
  if (workoutFreshnessDays > 45) score += 0.08;
  else if (workoutFreshnessDays > 30) score += 0.04;

  const checkins30d = features.checkins30d;
  if (checkins30d != null && checkins30d <= 2) score += 0.1;

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

  const reasons: string[] = [];
  if (features.daysSinceLastCheckin > 14) {
    reasons.push(`Frequência caiu (sem check-in há ${features.daysSinceLastCheckin} dias)`);
  }
  if (features.overdueInvoices > 0) {
    reasons.push(`Mensalidade atrasada (${features.overdueInvoices})`);
  }
  if (workoutFreshnessDays > 30) {
    reasons.push(`Treino antigo (sem sessão há ${workoutFreshnessDays} dias)`);
  }
  if (checkins30d != null && checkins30d <= 2) {
    reasons.push('Pouco uso nos últimos 30 dias');
  }

  return { score, label, recommendation, features, reasons };
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

/** Simple moving-average + linear trend forecast */
export function forecastSeries(
  values: number[],
  periodsAhead = 1,
): { value: number; confidence: number; method: string } {
  if (!values.length) {
    return { value: 0, confidence: 0, method: 'insufficient_data' };
  }
  const n = values.length;
  const window = Math.min(3, n);
  const recent = values.slice(-window);
  const ma = recent.reduce((a, b) => a + b, 0) / recent.length;

  let trend = 0;
  if (n >= 2) {
    const xs = values.map((_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - xMean) * (values[i] - yMean);
      den += (xs[i] - xMean) ** 2;
    }
    trend = den === 0 ? 0 : num / den;
  }

  const value = Math.max(0, Math.round((ma + trend * periodsAhead) * 100) / 100);
  const confidence = Math.min(95, Math.round(40 + n * 8 + (window >= 3 ? 10 : 0)));
  return { value, confidence, method: 'moving_avg_linear' };
}

export type InsightInput = {
  delinquencyDeltaPct: number;
  occupancyPct: number;
  cancellationsDeltaPct: number;
  premiumFrequencyDeltaPct: number;
  cashAvailable: number;
  revenueDeltaPct: number;
};

export type InsightRule = {
  severity: 'info' | 'warning' | 'critical';
  code: string;
  title: string;
  recommendation: string;
  evidence: Record<string, unknown>;
};

export function buildInsights(input: InsightInput): InsightRule[] {
  const out: InsightRule[] = [];

  if (input.delinquencyDeltaPct >= 10) {
    out.push({
      severity: input.delinquencyDeltaPct >= 20 ? 'critical' : 'warning',
      code: 'delinquency_up',
      title: `Sua inadimplência aumentou ${input.delinquencyDeltaPct}%.`,
      recommendation: 'Enviar campanha para alunos com atraso superior a 10 dias.',
      evidence: { delinquencyDeltaPct: input.delinquencyDeltaPct },
    });
  }

  if (input.occupancyPct >= 95) {
    out.push({
      severity: 'warning',
      code: 'peak_occupancy',
      title: `Ocupação em horário de pico em ${input.occupancyPct}%.`,
      recommendation: 'Considere abrir uma nova turma no horário seguinte.',
      evidence: { occupancyPct: input.occupancyPct },
    });
  }

  if (input.cancellationsDeltaPct >= 15) {
    out.push({
      severity: 'warning',
      code: 'cancellations_up',
      title: `Os cancelamentos aumentaram ${input.cancellationsDeltaPct}%.`,
      recommendation: 'Revise reajustes recentes e ative recuperação de churn.',
      evidence: { cancellationsDeltaPct: input.cancellationsDeltaPct },
    });
  }

  if (input.premiumFrequencyDeltaPct <= -15) {
    out.push({
      severity: 'warning',
      code: 'premium_freq_down',
      title: `A frequência dos alunos do plano Premium caiu ${Math.abs(input.premiumFrequencyDeltaPct)}% nas últimas semanas.`,
      recommendation: 'Considere uma campanha de reengajamento para evitar cancelamentos.',
      evidence: { premiumFrequencyDeltaPct: input.premiumFrequencyDeltaPct },
    });
  }

  if (input.cashAvailable < 0) {
    out.push({
      severity: 'critical',
      code: 'negative_cash',
      title: 'Caixa estimado negativo.',
      recommendation: 'Priorize cobranças em atraso e revise despesas do mês.',
      evidence: { cashAvailable: input.cashAvailable },
    });
  }

  if (input.revenueDeltaPct <= -10) {
    out.push({
      severity: 'warning',
      code: 'revenue_down',
      title: `Receita caiu ${Math.abs(input.revenueDeltaPct)}% vs período anterior.`,
      recommendation: 'Acelere leads quentes e campanhas de renovação.',
      evidence: { revenueDeltaPct: input.revenueDeltaPct },
    });
  }

  if (!out.length) {
    out.push({
      severity: 'info',
      code: 'stable',
      title: 'Indicadores estáveis no período.',
      recommendation: 'Mantenha o ritmo operacional e monitore metas do mês.',
      evidence: {},
    });
  }

  return out;
}

export function campaignRoi(revenueAttributed: number, budget: number): number | null {
  if (budget <= 0) return null;
  return Math.round(((revenueAttributed - budget) / budget) * 1000) / 10;
}

export function campaignStars(roiPct: number | null, score: number): number {
  if (roiPct != null) {
    if (roiPct >= 300) return 5;
    if (roiPct >= 150) return 4;
    if (roiPct >= 50) return 3;
    if (roiPct >= 0) return 2;
    return 1;
  }
  if (score >= 0.8) return 5;
  if (score >= 0.6) return 4;
  if (score >= 0.4) return 3;
  if (score >= 0.2) return 2;
  return 1;
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

/** Excel-compatible TSV (opens in Excel without XLSX lib) */
export function toExcelCsv(rows: Record<string, unknown>[], fields: string[]): string {
  const bom = '\uFEFF';
  return bom + toCsv(rows, fields);
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

export function dateKey(d: Date | string): string {
  return (typeof d === 'string' ? d : d.toISOString()).slice(0, 10);
}

export function startOfMonth(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export function startOfYear(d = new Date()): string {
  return new Date(Date.UTC(d.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10);
}

export function daysAgo(n: number, d = new Date()): string {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() - n);
  return x.toISOString().slice(0, 10);
}

export function progressPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 1000) / 10);
}
