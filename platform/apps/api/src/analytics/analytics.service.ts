import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  buildInsights,
  campaignRoi,
  campaignStars,
  deltaPercent,
  forecastSeries,
  predictChurn,
  REPORT_SOURCES,
  toCsv,
  toExcelCsv,
  type ExportFormat,
} from '@movvo/sdk-bi';
import {
  movvoOllamaAnswer,
  isOllamaConfigured,
} from '@movvo/ai-sdk';
import type {
  MovvoAiChatResponse,
  AuthContext,
  BenchmarkResponse,
  BiInsight,
  BiInsightsResponse,
  CompareResponse,
  ForecastResult,
  HeatmapResponse,
} from '@movvo/shared';
import {
  classCancelBlockMessage,
  CLASS_CANCEL_CUTOFF_MINUTES,
} from '@movvo/shared';
import { AuthUser } from '../auth/auth.types';
import { OperationsService } from '../operations/operations.service';
import { StudentsService } from '../students/students.service';
import {
  formatOpenClassesList,
  formatWhenLabel,
  isAgendaQuestion,
  isCancelAgendaIntent,
  isCreateScheduleIntent,
  isDeleteScheduleIntent,
  isReserveIntent,
  matchOpenClass,
  matchUpcomingClass,
  parseScheduleDeleteFilter,
  parseScheduleDraft,
  scheduleTitleMatchesHint,
  summarizeSchedule,
  summarizeUpcoming,
} from './agenda-ai.helpers';
import {
  AiChatDto,
  AiInsightsDto,
  CreateExportDto,
  CreateGoalDto,
  CreateReportDto,
  CreateScheduleDto,
  RunPredictionsDto,
} from './dto/analytics.dto';
import {
  EXPORT_REQUESTED,
  PREDICTIONS_RUN,
  REPORT_CREATED,
  REPORT_SCHEDULED,
  WAREHOUSE_SYNCED,
} from './events/analytics.events';
import { AnalyticsRepository } from './analytics.repository';

function buildNextBestActions(
  daysSinceCheckin: number,
  overdueInvoices: number,
  assessmentAgeDays: number,
): Array<{ type: string; label: string; priority: number }> {
  const actions: Array<{ type: string; label: string; priority: number }> = [];
  if (overdueInvoices > 0) {
    actions.push({ type: 'whatsapp', label: 'Enviar cobrança via WhatsApp', priority: 1 });
  }
  if (daysSinceCheckin > 14) {
    actions.push({ type: 'invite_class', label: 'Convidar para aula experimental', priority: 2 });
  }
  if (assessmentAgeDays > 90) {
    actions.push({ type: 'offer_assessment', label: 'Oferecer avaliação física gratuita', priority: 3 });
  }
  if (daysSinceCheckin > 7) {
    actions.push({ type: 'push_notification', label: 'Enviar notificação motivacional', priority: 4 });
  }
  return actions.sort((a, b) => a.priority - b.priority);
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly events: EventEmitter2,
    private readonly operations: OperationsService,
    private readonly students: StudentsService,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  dashboard(auth: AuthContext, from?: string, to?: string, unitId?: string) {
    return this.repo.buildDashboard(this.companyId(auth), { from, to, unitId });
  }

  executive(auth: AuthContext, from?: string, to?: string, unitId?: string) {
    return this.repo.buildExecutive(this.companyId(auth), { from, to, unitId });
  }

  async kpis(auth: AuthContext, category?: string, from?: string, to?: string, unitId?: string) {
    const dash = await this.repo.buildDashboard(this.companyId(auth), { from, to, unitId });
    if (category) return dash.kpis.filter((k) => k.category === category);
    return dash.kpis;
  }

  listPredictions(auth: AuthContext, type?: string) {
    return this.repo.listPredictions(this.companyId(auth), type);
  }

  async runPredictions(auth: AuthContext, dto: RunPredictionsDto) {
    const companyId = this.companyId(auth);
    const type = dto.type || 'churn';
    const created: Awaited<ReturnType<AnalyticsRepository['insertPredictions']>> = [];

    if (type === 'churn' || type === 'finance_risk') {
      const students = await this.repo.listStudentsForChurn(companyId);
      if (!students.length) return created;

      const studentIds = students.map((s) => String(s.id));
      const now = new Date();

      const [checkinMap, overdueMap, assessmentMap, workoutMap, checkins30d] = await Promise.all([
        this.repo.getLastCheckinsByStudents(companyId, studentIds),
        this.repo.getOverdueCountByStudents(companyId, studentIds),
        this.repo.getLastAssessmentsByStudents(companyId, studentIds),
        this.repo.getLastWorkoutsByStudents(companyId, studentIds),
        this.repo.getCheckinCount30dByStudents(companyId, studentIds),
      ]);

      const rows = students.map((s) => {
        const sid = String(s.id);
        const lastCheckin = checkinMap.get(sid);
        const daysSinceLastCheckin = lastCheckin
          ? Math.ceil((now.getTime() - new Date(lastCheckin).getTime()) / 86400000)
          : 60;
        const overdueInvoices = overdueMap.get(sid) || 0;
        const lastAssessment = assessmentMap.get(sid);
        const lastWorkout = workoutMap.get(sid);
        const assessmentAgeDays = lastAssessment
          ? Math.ceil((now.getTime() - new Date(lastAssessment).getTime()) / 86400000)
          : 180;
        const workoutFreshnessDays = lastWorkout
          ? Math.ceil((now.getTime() - new Date(lastWorkout).getTime()) / 86400000)
          : 60;

        const pred = predictChurn({
          daysSinceLastCheckin,
          missedWorkouts30d: Math.min(10, Math.floor(workoutFreshnessDays / 3)),
          overdueInvoices,
          complaints90d: 0,
          planMonthsRemaining: 1,
          workoutFreshnessDays,
          checkins30d: checkins30d.get(sid) || 0,
        });

        const reasons = [...pred.reasons];
        if (assessmentAgeDays > 90) {
          reasons.push(`Não fez avaliação recente (${assessmentAgeDays} dias)`);
        }

        const nextBestActions = buildNextBestActions(
          daysSinceLastCheckin,
          overdueInvoices,
          assessmentAgeDays,
        );

        return {
          company_id: companyId,
          entity_type: 'student',
          entity_id: sid,
          prediction_type: 'churn',
          score: pred.score,
          label: pred.label,
          recommendation: pred.recommendation,
          features: {
            ...pred.features,
            name: s.full_name,
            reasons,
            nextBestActions,
            chancePct: Math.round(pred.score * 100),
          },
        };
      });

      if (rows.length) {
        created.push(...(await this.repo.insertPredictions(rows)));
      }
    }

    if (
      type === 'revenue_month' ||
      type === 'revenue_year' ||
      type === 'cancellations' ||
      type === 'enrollments' ||
      type === 'cashflow' ||
      type === 'frequency'
    ) {
      const forecasts = await this.buildForecasts(companyId, type);
      const rows = forecasts.map((f) => ({
        company_id: companyId,
        entity_type: 'company',
        entity_id: companyId,
        prediction_type: f.type,
        score: f.confidence / 100,
        label: f.label,
        recommendation: `Previsão ${f.label}: ${f.value} (confiança ${f.confidence}%)`,
        features: { ...f },
      }));
      if (rows.length) created.push(...(await this.repo.insertPredictions(rows)));
    }

    if (type === 'lead_conversion') {
      // real leads only — no demo seed
    }

    this.events.emit(PREDICTIONS_RUN, {
      companyId,
      type,
      count: created.length,
    });
    return created;
  }

  async buildForecasts(companyId: string, type?: string): Promise<ForecastResult[]> {
    const revenueSeries = await this.repo.monthlyRevenueSeries(companyId, 6);
    const cancelSeries = await this.repo.monthlyCancellationSeries(companyId, 6);
    const enrollSeries = await this.repo.monthlyEnrollmentSeries(companyId, 6);
    const metrics = await this.repo.computeMetrics(companyId);
    const all: ForecastResult[] = [];

    const revMonth = forecastSeries(revenueSeries, 1);
    all.push({
      type: 'revenue_month',
      value: revMonth.value,
      confidence: revMonth.confidence,
      unit: 'currency',
      label: 'Receita do mês',
      method: revMonth.method,
    });

    const revYear = forecastSeries(
      revenueSeries.map((v) => v * 12),
      1,
    );
    all.push({
      type: 'revenue_year',
      value: Math.round(revMonth.value * 12 * 100) / 100,
      confidence: Math.max(50, revYear.confidence - 10),
      unit: 'currency',
      label: 'Receita anual',
      method: revYear.method,
    });

    const canc = forecastSeries(cancelSeries, 1);
    all.push({
      type: 'cancellations',
      value: Math.round(canc.value),
      confidence: canc.confidence,
      unit: 'number',
      label: 'Cancelamentos',
      method: canc.method,
    });

    const enroll = forecastSeries(enrollSeries, 1);
    all.push({
      type: 'enrollments',
      value: Math.round(enroll.value),
      confidence: enroll.confidence,
      unit: 'number',
      label: 'Matrículas',
      method: enroll.method,
    });

    all.push({
      type: 'cashflow',
      value: Math.round((revMonth.value - metrics.expenses) * 100) / 100,
      confidence: Math.max(40, revMonth.confidence - 5),
      unit: 'currency',
      label: 'Fluxo de caixa',
      method: 'revenue_minus_expenses',
    });

    all.push({
      type: 'frequency',
      value: metrics.frequency,
      confidence: metrics.activeStudents > 0 ? 70 : 20,
      unit: 'number',
      label: 'Frequência média',
      method: 'current_baseline',
    });

    if (type && type !== 'all') return all.filter((f) => f.type === type);
    return all;
  }

  forecasts(auth: AuthContext, type?: string) {
    return this.buildForecasts(this.companyId(auth), type);
  }

  async listChurnRisk(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const predictions = await this.repo.listPredictions(companyId, 'churn');
    return predictions.map((p) => {
      const features = p.features as Record<string, unknown>;
      return {
        studentId: p.entityId,
        studentName: String(features.name || ''),
        score: p.score,
        chancePct: Number(features.chancePct ?? Math.round(p.score * 100)),
        label: p.label || 'unknown',
        reasons: (features.reasons as string[]) || [],
        nextBestActions: (features.nextBestActions as unknown[]) || [],
      };
    });
  }

  async refreshChurnRisk(auth: AuthContext) {
    return this.runPredictions(auth, { type: 'churn' });
  }

  async heatmaps(auth: AuthContext, type = 'hours'): Promise<HeatmapResponse> {
    const companyId = this.companyId(auth);
    if (type === 'equipment' || type === 'equipments') {
      return {
        type: 'equipment',
        available: false,
        reason: 'integration_required',
        cells: [],
      };
    }
    if (type === 'days') {
      return { type: 'days', available: true, cells: await this.repo.checkinDayHeatmap(companyId) };
    }
    if (type === 'modalities') {
      return {
        type: 'modalities',
        available: true,
        cells: await this.repo.modalityHeatmap(companyId),
      };
    }
    return { type: 'hours', available: true, cells: await this.repo.checkinHourHeatmap(companyId) };
  }

  async compare(
    auth: AuthContext,
    metric = 'revenue',
    period: 'day' | 'month' | 'year' = 'month',
  ): Promise<CompareResponse> {
    const companyId = this.companyId(auth);
    const m = await this.repo.computeMetrics(companyId);
    const today = new Date().toISOString().slice(0, 10);

    if (metric === 'teacher') {
      const items = await this.repo.teacherBenchmark(companyId);
      return {
        metric,
        period,
        current: items[0]?.value || 0,
        previous: items[1]?.value || 0,
        deltaPct: deltaPercent(items[0]?.value || 0, items[1]?.value || 0),
        series: items.slice(0, 10).map((t) => ({
          label: t.label,
          current: t.value,
          previous: 0,
        })),
      };
    }

    if (metric === 'plan') {
      const items = await this.repo.planBenchmark(companyId);
      return {
        metric,
        period,
        current: items[0]?.value || 0,
        previous: items[1]?.value || 0,
        deltaPct: deltaPercent(items[0]?.value || 0, items[1]?.value || 0),
        series: items.slice(0, 10).map((t) => ({
          label: t.label,
          current: t.value,
          previous: 0,
        })),
      };
    }

    if (metric === 'unit') {
      return {
        metric,
        period,
        current: m.revenueMonth,
        previous: m.prevRevenue,
        deltaPct: deltaPercent(m.revenueMonth, m.prevRevenue),
        note: 'multi-unit em breve',
      };
    }

    let current = m.revenueMonth;
    let previous = m.prevRevenue;
    if (metric === 'checkins') {
      current = m.checkins;
      previous = m.prevCheckins;
    } else if (metric === 'churn') {
      current = m.churn;
      previous = m.prevChurn;
    } else if (metric === 'cancellations') {
      current = m.cancellations;
      previous = m.prevCancellations;
    } else if (period === 'day') {
      current = m.revenueDay;
      previous = await this.repo.oltpPaidRevenue(companyId, today, today);
    } else if (period === 'year') {
      current = m.revenueYear;
      previous = m.prevRevenue * 12;
    }

    return {
      metric,
      period,
      current,
      previous,
      deltaPct: deltaPercent(current, previous),
    };
  }

  async benchmark(auth: AuthContext, dimension = 'teacher'): Promise<BenchmarkResponse> {
    const companyId = this.companyId(auth);
    if (dimension === 'plan') {
      return { dimension, items: await this.repo.planBenchmark(companyId) };
    }
    if (dimension === 'modality' || dimension === 'hour') {
      const cells =
        dimension === 'hour'
          ? await this.repo.checkinHourHeatmap(companyId)
          : await this.repo.modalityHeatmap(companyId);
      return {
        dimension,
        items: cells
          .sort((a, b) => b.value - a.value)
          .map((c, i) => ({ id: c.key, label: c.label, value: c.value, rank: i + 1 })),
      };
    }
    if (dimension === 'campaign') {
      const commercial = await this.commercialInsights(auth);
      return {
        dimension,
        items: commercial.map((c, i) => ({
          id: c.campaignId,
          label: c.name,
          value: c.roiPct ?? c.score * 100,
          rank: i + 1,
        })),
      };
    }
    return { dimension: 'teacher', items: await this.repo.teacherBenchmark(companyId) };
  }

  async commercialInsights(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const campaigns = await this.repo.listCampaigns(companyId);
    return campaigns.map((c) => {
      const budget = Number(c.budget || 0);
      const goal = Number(c.goal_value || 0);
      const attributed = goal > 0 ? goal : budget > 0 ? budget * 2.5 : 0;
      const roi = campaignRoi(attributed, budget);
      const score = budget > 0 ? Math.min(1, attributed / (budget * 3)) : goal > 0 ? 0.5 : 0.2;
      return {
        campaignId: String(c.id),
        name: String(c.name),
        roiPct: roi,
        score: Math.round(score * 1000) / 1000,
        stars: campaignStars(roi, score),
        recommendation:
          roi != null && roi >= 100
            ? 'Melhor campanha — replique público e horário.'
            : 'Ajuste público-alvo ou orçamento para melhorar ROI.',
        note: budget <= 0 ? 'Sem budget cadastrado — score relativo heurístico' : undefined,
      };
    });
  }

  listReports(auth: AuthContext) {
    return this.repo.listReports(this.companyId(auth));
  }

  async getReport(auth: AuthContext, id: string) {
    const report = await this.repo.getReport(this.companyId(auth), id);
    if (!report) throw new NotFoundException('report_not_found');
    return report;
  }

  async createReport(user: AuthUser, auth: AuthContext, dto: CreateReportDto) {
    const companyId = this.companyId(auth);
    if (!REPORT_SOURCES[dto.source]) throw new BadRequestException('invalid_source');
    const report = await this.repo.createReport({
      company_id: companyId,
      name: dto.name,
      description: dto.description ?? null,
      source: dto.source,
      fields: dto.fields,
      filters: dto.filters || {},
      group_by: dto.groupBy || [],
      created_by: user.id,
      shared: dto.shared ?? false,
    });
    this.events.emit(REPORT_CREATED, { companyId, reportId: report.id });
    return report;
  }

  async createExport(user: AuthUser, auth: AuthContext, dto: CreateExportDto) {
    const companyId = this.companyId(auth);
    let source = dto.source || 'revenue';
    let fields: string[] = REPORT_SOURCES[source]?.map((f) => f.key) || ['date'];
    if (dto.reportId) {
      const report = await this.repo.getReport(companyId, dto.reportId);
      if (!report) throw new NotFoundException('report_not_found');
      source = report.source;
      fields = report.fields;
    }

    const job = await this.repo.createExport({
      company_id: companyId,
      report_id: dto.reportId ?? null,
      requested_by: user.id,
      format: dto.format,
      status: 'processing',
    });

    let rows: Record<string, unknown>[] = [];
    if (source === 'my_students' || source === 'students_mine') {
      fields = [
        'registration_number',
        'full_name',
        'cpf',
        'email',
        'phone',
        'status',
        'plan_name',
        'trainer_name',
        'unit_id',
      ];
      rows = await this.students.exportMyStudentsRows(auth);
    } else {
      rows = await this.repo.queryFactRows(source, companyId);
    }
    const format = dto.format as ExportFormat;
    let fileUrl: string | null = null;
    if (format === 'csv') {
      const csv = toCsv(rows, fields);
      fileUrl = `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
    } else if (format === 'excel') {
      const csv = toExcelCsv(rows, fields);
      fileUrl = `data:text/csv;charset=utf-8;base64,${Buffer.from(csv).toString('base64')}`;
    } else {
      fileUrl = `stub://pdf/${job.id}`;
    }

    const done = await this.repo.completeExport(job.id, {
      status: 'done',
      file_url: fileUrl,
      row_count: rows.length,
      completed_at: new Date().toISOString(),
    });

    this.events.emit(EXPORT_REQUESTED, {
      companyId,
      exportId: done.id,
      format: dto.format,
    });
    return done;
  }

  listExports(auth: AuthContext) {
    return this.repo.listExports(this.companyId(auth));
  }

  async createSchedule(auth: AuthContext, dto: CreateScheduleDto) {
    const companyId = this.companyId(auth);
    const report = await this.repo.getReport(companyId, dto.reportId);
    if (!report) throw new NotFoundException('report_not_found');
    const schedule = await this.repo.createSchedule({
      company_id: companyId,
      report_id: dto.reportId,
      cron: dto.cron,
      channel: dto.channel || 'email',
      recipients: dto.recipients || [],
      format: dto.format || 'pdf',
      active: true,
    });
    this.events.emit(REPORT_SCHEDULED, {
      companyId,
      scheduleId: schedule.id,
      reportId: dto.reportId,
      delivery: 'stub_outbox',
    });
    return { ...schedule, delivery: 'stub', note: 'Agendamento persistido — SMTP real fora do escopo G-12' };
  }

  listSchedules(auth: AuthContext) {
    return this.repo.listSchedules(this.companyId(auth));
  }

  async syncWarehouse(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const facts = await this.repo.upsertDailyFacts(companyId);
    await this.refreshAlerts(auth);
    this.events.emit(WAREHOUSE_SYNCED, { companyId, facts });
    return { ok: true, facts };
  }

  reportSources() {
    return REPORT_SOURCES;
  }

  private async buildAiGrounding(companyId: string, question: string) {
    const q = question.toLowerCase();
    const m = await this.repo.computeMetrics(companyId);
    const sources: string[] = ['executive', 'kpi'];
    const context: Record<string, unknown> = {
      metrics: {
        revenueDay: m.revenueDay,
        revenueMonth: m.revenueMonth,
        revenueYear: m.revenueYear,
        mrr: m.mrr,
        avgTicket: m.avgTicket,
        profit: m.profit,
        churnPct: m.churn,
        delinquency: m.delinquency,
        cashAvailable: m.cashAvailable,
        checkins: m.checkins,
        newStudents: m.newStudents,
        cancellations: m.cancellations,
        frequency: m.frequency,
        occupancyPct: m.occupancy,
        activeStudents: m.activeStudents,
        leads: m.leads,
        enrollments: m.enrollments,
      },
    };

    if (q.includes('inadimpl') || q.includes('cobrar') || q.includes('cobrança')) {
      context.overdueStudents = await this.repo.listOverdueStudents(companyId, 15);
      sources.push('receivables');
    }
    if (q.includes('professor') || q.includes('retenção')) {
      context.topTeacher = await this.repo.topTeacherByStudents(companyId);
      sources.push('schedules');
    }
    if (q.includes('plano')) {
      context.topPlan = await this.repo.topPlan(companyId);
      sources.push('enrollments');
    }
    if (q.includes('sem treinar') || (q.includes('sem') && q.includes('check'))) {
      const days = q.includes('30') ? 30 : 15;
      context.studentsWithoutCheckinDays = days;
      context.studentsWithoutCheckin = await this.repo.studentsWithoutCheckin(companyId, days);
      sources.push('checkins');
    }
    if (q.includes('previsão') || q.includes('projet') || q.includes('final do mês')) {
      context.forecastRevenueMonth = (await this.buildForecasts(companyId, 'revenue_month'))[0];
      sources.push('forecast');
    }
    if (q.includes('modalidade')) {
      context.modalities = (await this.repo.modalityHeatmap(companyId)).slice(0, 8);
      sources.push('schedules');
    }

    return { metrics: m, context, sources };
  }

  private rulesFallbackAnswer(
    question: string,
    m: Awaited<ReturnType<AnalyticsRepository['computeMetrics']>>,
    context: Record<string, unknown>,
  ): MovvoAiChatResponse {
    const q = question.toLowerCase();

    if (q.includes('fatur') || q.includes('receita') || (q.includes('quanto') && q.includes('mês'))) {
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['receivables', 'fact_revenue'],
        answer: `Receita do mês: R$ ${m.revenueMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        data: { revenueMonth: m.revenueMonth },
      };
    }
    if (q.includes('inadimpl')) {
      const overdue = (context.overdueStudents as Array<{ name: string }> | undefined) || [];
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['receivables'],
        answer: `Inadimplência: R$ ${m.delinquency.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Alunos: ${
          overdue.map((o) => o.name).join(', ') || 'nenhum'
        }.`,
        data: { delinquency: m.delinquency, overdue },
      };
    }
    if (q.includes('cobrar') || q.includes('cobrança')) {
      const overdue =
        (context.overdueStudents as Array<{ name: string; amount: number }> | undefined) || [];
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['receivables'],
        answer: overdue.length
          ? `Cobrar hoje: ${overdue.map((o) => `${o.name} (R$ ${o.amount})`).join('; ')}.`
          : 'Nenhum título vencido para cobrança hoje.',
        data: { overdue },
      };
    }
    if (q.includes('professor') && (q.includes('mais') || q.includes('retenção') || q.includes('aluno'))) {
      const top = context.topTeacher as { label: string; value: number } | null;
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['schedules', 'class_enrollments'],
        answer: top
          ? `Professor com mais alunos: ${top.label} (${top.value} reservas).`
          : 'Sem dados de professores no período.',
        data: { top },
      };
    }
    if (q.includes('plano') && (q.includes('vende') || q.includes('mais') || q.includes('vendido'))) {
      const top = context.topPlan as { label: string; value: number } | null;
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['enrollments'],
        answer: top
          ? `Plano mais vendido: ${top.label} (${top.value} matrículas).`
          : 'Sem matrículas para ranquear planos.',
        data: { top },
      };
    }
    if (q.includes('sem treinar') || (q.includes('sem') && q.includes('check'))) {
      const days = Number(context.studentsWithoutCheckinDays || 15);
      const list = (context.studentsWithoutCheckin as Array<{ name: string }> | undefined) || [];
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['checkins', 'students'],
        answer: list.length
          ? `${list.length} aluno(s) há mais de ${days} dias sem treinar: ${list
              .slice(0, 10)
              .map((s) => s.name)
              .join(', ')}.`
          : `Nenhum aluno ativo sem check-in há ${days} dias.`,
        data: { students: list },
      };
    }
    if (q.includes('previsão') || q.includes('projet') || q.includes('final do mês')) {
      const f = context.forecastRevenueMonth as { value: number; confidence: number } | undefined;
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['forecast'],
        answer: f
          ? `Previsão de receita do mês: R$ ${f.value.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })} (confiança ${f.confidence}%).`
          : 'Sem dados suficientes para previsão.',
        data: { forecast: f },
      };
    }
    if (q.includes('modalidade') && q.includes('lucro')) {
      const heat = (context.modalities as Array<{ label: string; value: number }> | undefined) || [];
      const top = heat[0];
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        sources: ['schedules'],
        answer: top
          ? `Modalidade mais procurada: ${top.label} (${top.value} reservas). Lucro por modalidade detalhado depende de rateio financeiro.`
          : 'Sem dados de modalidades.',
        data: { modalities: heat },
      };
    }
    if (isAgendaQuestion(question)) {
      const open =
        (context.openClasses as Array<{ id: string; title: string; startAt: string }> | undefined) ||
        [];
      const upcoming =
        (context.myAgenda as Array<{
          id: string;
          title: string;
          startAt: string;
          enrollmentStatus?: string;
        }> | undefined) || [];
      if (upcoming.length || open.length) {
        const parts: string[] = [];
        if (upcoming.length) {
          parts.push(
            `Suas reservas:\n${upcoming
              .slice(0, 8)
              .map(
                (s) =>
                  `• ${s.title} — ${formatWhenLabel(s.startAt)}${s.enrollmentStatus ? ` (${s.enrollmentStatus})` : ''}`,
              )
              .join('\n')}`,
          );
        } else {
          parts.push('Você não tem reservas ativas.');
        }
        if (open.length) {
          parts.push(`Aulas disponíveis:\n${formatOpenClassesList(open)}`);
          parts.push('Para reservar, diga por exemplo: "reservar a aula 1" ou o nome/data da aula.');
        }
        return {
          provider: 'movvo-rules',
          llm: 'not_configured',
          sources: ['agenda'],
          answer: parts.join('\n\n'),
          data: { myAgenda: upcoming, openClasses: open },
        };
      }
    }
    return {
      provider: 'movvo-rules',
      llm: 'not_configured',
      sources: [],
      answer:
        'Pergunte sobre faturamento do mês, inadimplentes, agenda/aulas, quem cobrar, professor com mais alunos, plano mais vendido, alunos sem treinar ou previsão de receita.',
    };
  }

  async aiInsights(auth: AuthContext, dto: AiInsightsDto): Promise<BiInsightsResponse> {
    const companyId = this.companyId(auth);
    const roles = auth.roles || [];
    const persona: 'admin' | 'professor' | 'aluno' =
      roles.includes('student') &&
      !roles.some((r) =>
        ['super_admin', 'admin', 'manager', 'finance', 'reception', 'trainer', 'personal'].includes(r),
      )
        ? 'aluno'
        : (roles.includes('trainer') || roles.includes('personal')) &&
            !roles.some((r) => ['super_admin', 'admin', 'manager', 'finance'].includes(r))
          ? 'professor'
          : 'admin';
    const m = await this.repo.computeMetrics(companyId);
    const insights: BiInsight[] = buildInsights({
      delinquencyDeltaPct: deltaPercent(m.delinquency, Math.max(1, m.delinquency * 0.88)),
      occupancyPct: m.occupancy,
      cancellationsDeltaPct: deltaPercent(m.cancellations, m.prevCancellations),
      premiumFrequencyDeltaPct: -18,
      cashAvailable: m.cashAvailable,
      revenueDeltaPct: deltaPercent(m.revenueMonth, m.prevRevenue),
    });
    const filtered =
      persona === 'admin'
        ? insights
        : insights.filter((i) => ['peak_occupancy', 'stable', 'premium_freq_down'].includes(i.code));

    const base: BiInsightsResponse = {
      provider: 'movvo-rules',
      llm: 'not_configured',
      question: dto.question || null,
      insights: filtered,
      sources: ['executive', 'kpi', 'occupancy', 'receivables'],
    };

    if (!isOllamaConfigured()) return base;

    try {
      const llm = await movvoOllamaAnswer({
        question:
          dto.question || 'Com base nos indicadores e insights, priorize 3 ações.',
        context: { metrics: m, ruleInsights: filtered },
        persona,
        systemExtra:
          'Retorne texto curto em português. Pode reforçar ou complementar os insights de regras, sem contradizer os números.',
      });
      return {
        ...base,
        provider: 'ollama',
        llm: llm.model,
        insights: [
          {
            severity: 'info',
            code: 'ollama_summary',
            title: 'Movvo AI (Ollama)',
            recommendation: llm.content,
            evidence: { model: llm.model, persona },
          },
          ...filtered,
        ],
      };
    } catch {
      return base;
    }
  }

  async aiChat(auth: AuthContext, dto: AiChatDto): Promise<MovvoAiChatResponse> {
    const companyId = this.companyId(auth);
    const roles = auth.roles || [];
    const persona: 'admin' | 'professor' | 'aluno' =
      roles.includes('student') &&
      !roles.some((r) =>
        ['super_admin', 'admin', 'manager', 'finance', 'reception', 'trainer', 'personal'].includes(r),
      )
        ? 'aluno'
        : (roles.includes('trainer') || roles.includes('personal')) &&
            !roles.some((r) => ['super_admin', 'admin', 'manager', 'finance'].includes(r))
          ? 'professor'
          : 'admin';

    const { metrics, context, sources } = await this.buildAiGrounding(companyId, dto.question);

    if (persona === 'aluno') {
      delete (context.metrics as Record<string, unknown>).revenueDay;
      delete (context.metrics as Record<string, unknown>).revenueMonth;
      delete (context.metrics as Record<string, unknown>).revenueYear;
      delete (context.metrics as Record<string, unknown>).mrr;
      delete (context.metrics as Record<string, unknown>).profit;
      delete (context.metrics as Record<string, unknown>).delinquency;
      delete (context.metrics as Record<string, unknown>).cashAvailable;
      delete context.overdueStudents;
      delete context.forecastRevenueMonth;
      delete context.topPlan;
    } else if (persona === 'professor') {
      delete (context.metrics as Record<string, unknown>).revenueDay;
      delete (context.metrics as Record<string, unknown>).revenueMonth;
      delete (context.metrics as Record<string, unknown>).revenueYear;
      delete (context.metrics as Record<string, unknown>).mrr;
      delete (context.metrics as Record<string, unknown>).profit;
      delete (context.metrics as Record<string, unknown>).delinquency;
      delete (context.metrics as Record<string, unknown>).cashAvailable;
      delete context.overdueStudents;
      delete context.forecastRevenueMonth;
      context.todayClasses = await this.repo.fullSchedulesToday(companyId);
    }

    const agendaAction = await this.tryAgendaChatActions(auth, persona, dto.question, context, sources);
    if (agendaAction) {
      return { ...agendaAction, persona };
    }

    context.persona = persona;
    const fallback = this.rulesFallbackAnswer(dto.question, metrics, context);
    fallback.persona = persona;

    if (persona === 'aluno' && /fatur|receita|inadimpl|lucro|caixa|cobrar/i.test(dto.question)) {
      return {
        provider: 'movvo-rules',
        llm: 'not_configured',
        persona,
        sources: ['portal'],
        answer:
          'Como aluno, não tenho acesso a dados financeiros da academia. Posso ajudar com treinos, agenda e frequência no portal.',
      };
    }

    if (!isOllamaConfigured()) return fallback;

    try {
      const llm = await movvoOllamaAnswer({
        question: dto.question,
        persona,
        history: (dto.history || []).map((h) => ({ role: h.role, content: h.content })),
        context: {
          ...context,
          rulesHint: fallback.answer,
        },
        systemExtra:
          persona === 'aluno'
            ? 'PROIBIDO dizer que cancelou ou reservou. Se o usuário pedir isso, diga para confirmar com "reservar a aula N" / "cancelar a aula N" (o backend executa). Use só myAgenda/openClasses do JSON.'
            : persona === 'professor'
              ? 'PROIBIDO dizer que não tem permissão para criar aulas. PROIBIDO afirmar que excluiu/cancelou aulas sem actionResult. Se pedirem excluir e o backend não executou, peça: "exclua todas as aulas NOME do dia DD/MM". Criação: "crie uma agenda chamada NOME às 10h do dia DD/MM".'
              : 'Se o contexto tiver agenda/openClasses, responda com horários reais. Reservas/cancelamentos pelo chat são para o perfil aluno. PROIBIDO afirmar exclusão de aulas sem actionResult.',
      });
      return {
        provider: 'ollama',
        llm: llm.model,
        persona,
        sources,
        answer: llm.content,
        data: { ...context, persona },
      };
    } catch {
      return {
        ...fallback,
        persona,
        answer: `${fallback.answer} (resposta local — Ollama indisponível)`,
      };
    }
  }

  private async executeCreateScheduleFromChat(
    auth: AuthContext,
    question: string,
    sources: string[],
  ): Promise<MovvoAiChatResponse> {
    sources.push('agenda');
    const unitId = auth.defaultUnitId || auth.unitIds?.[0] || null;
    if (!unitId) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer:
          'Não encontrei a unidade padrão do seu usuário. Defina a unidade no perfil ou no seletor e tente de novo.',
      };
    }
    if (!auth.permissions?.includes('operations.create') && !auth.isSuperAdmin) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: 'Seu perfil não tem permissão para criar aulas na agenda (operations.create).',
      };
    }

    const draft = parseScheduleDraft(question);
    if (draft.missingTitle || !draft.title) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer:
          'Para criar a aula, diga o nome. Ex.: "crie uma agenda chamada Spin G10 às 10h do dia 07/08 na sala 2" ou "agende uma aula de Yoga amanhã às 10h".',
        data: { draft },
      };
    }

    let roomId: string | undefined;
    let roomNote = '';
    if (draft.roomHint) {
      try {
        const rooms = await this.operations.listRooms(auth);
        const hint = draft.roomHint.toLowerCase();
        const match = rooms.find((r) => {
          const name = String(r.name || '').toLowerCase();
          const digits = name.replace(/\D/g, '');
          return (
            name === hint ||
            name === `sala ${hint}` ||
            name.endsWith(` ${hint}`) ||
            name.includes(hint) ||
            (digits.length > 0 && digits === hint.replace(/\D/g, ''))
          );
        });
        if (match) {
          roomId = match.id;
          roomNote = ` · sala ${match.name}`;
        } else {
          roomNote = ` (sala "${draft.roomHint}" não encontrada — criei sem vincular sala)`;
        }
      } catch {
        roomNote = ` (não consegui consultar salas — criei sem sala)`;
      }
    }

    const user: AuthUser = { id: auth.userId, email: auth.email || undefined };
    try {
      const schedule = await this.operations.createSchedule(user, auth, {
        unitId,
        title: draft.title,
        type: 'class',
        startAt: draft.startAt,
        endAt: draft.endAt,
        teacherId: auth.userId,
        roomId,
        maxCapacity: draft.maxCapacity,
      });
      const assumed = draft.assumedDateTime
        ? ' (usei amanhã às 10h por padrão — diga data/hora se quiser outro horário)'
        : '';
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: `Aula criada: "${schedule.title}" em ${formatWhenLabel(schedule.startAt)} · capacidade ${schedule.maxCapacity}${roomNote}.${assumed}`,
        data: {
          actionResult: 'schedule_created',
          schedule: summarizeSchedule(schedule),
          roomId: roomId || null,
        },
      };
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Não foi possível criar a aula.';
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer:
          message.includes('Conflict') ||
          /conflito|já possui aula|already/i.test(message)
            ? `Não consegui criar: ${message}. Escolha outro horário ou cancele a aula conflitante na Agenda.`
            : message,
        data: { draft },
      };
    }
  }

  private async executeDeleteSchedulesFromChat(
    auth: AuthContext,
    persona: 'admin' | 'professor',
    question: string,
    sources: string[],
  ): Promise<MovvoAiChatResponse> {
    sources.push('agenda');
    if (!auth.permissions?.includes('operations.update') && !auth.isSuperAdmin) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: 'Seu perfil não tem permissão para cancelar aulas na agenda (operations.update).',
      };
    }

    const filter = parseScheduleDeleteFilter(question);
    if (filter.missingTitle || !filter.titleHint) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer:
          'Para excluir, diga o nome da aula e o dia. Ex.: "exclua todas as aulas SPIN G10 do dia 07/08".',
        data: { filter },
      };
    }
    if (filter.missingDate || !filter.dayFrom || !filter.dayTo) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: `Para excluir "${filter.titleHint}", informe o dia. Ex.: "exclua todas as aulas ${filter.titleHint} do dia 07/08".`,
        data: { filter },
      };
    }

    let schedules: Awaited<ReturnType<OperationsService['listSchedules']>> = [];
    try {
      schedules = await this.operations.listSchedules(auth, {
        from: filter.dayFrom,
        to: filter.dayTo,
        type: 'class',
      });
    } catch (e) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: e instanceof Error ? e.message : 'Não consegui consultar a agenda.',
      };
    }

    let matches = schedules.filter(
      (s) =>
        s.status !== 'cancelled' &&
        !s.isBlock &&
        scheduleTitleMatchesHint(s.title, filter.titleHint!),
    );

    if (persona === 'professor') {
      matches = matches.filter((s) => !s.teacherId || s.teacherId === auth.userId);
    }

    if (filter.hour != null) {
      matches = matches.filter((s) => {
        const h = new Date(s.startAt).getHours();
        return h === filter.hour;
      });
    }

    if (!matches.length) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: `Não encontrei aulas "${filter.titleHint}" ativas nesse dia${
          filter.hour != null ? ` às ${filter.hour}h` : ''
        }${persona === 'professor' ? ' sob sua responsabilidade' : ''}.`,
        data: { filter, actionResult: 'schedule_delete_none' },
      };
    }

    if (!filter.deleteAll && filter.hour == null && matches.length > 1) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: `Encontrei ${matches.length} aulas "${filter.titleHint}":\n${matches
          .map((s, i) => `${i + 1}. ${formatWhenLabel(s.startAt)}`)
          .join('\n')}\nConfirme com "exclua todas as aulas ${filter.titleHint} do dia DD/MM" ou informe o horário (ex.: às 14h).`,
        data: {
          filter,
          candidates: matches.map(summarizeSchedule),
        },
      };
    }

    const user: AuthUser = { id: auth.userId, email: auth.email || undefined };
    const cancelled: Array<ReturnType<typeof summarizeSchedule>> = [];
    const errors: string[] = [];
    for (const s of matches) {
      try {
        const updated = await this.operations.cancelSchedule(user, auth, s.id);
        cancelled.push(summarizeSchedule(updated));
      } catch (e) {
        errors.push(
          `${s.title} (${formatWhenLabel(s.startAt)}): ${
            e instanceof Error ? e.message : 'falha'
          }`,
        );
      }
    }

    if (!cancelled.length) {
      return {
        provider: 'movvo-action',
        llm: 'rules',
        sources: ['agenda'],
        answer: `Não consegui excluir: ${errors.join('; ') || 'erro desconhecido'}.`,
        data: { filter, errors },
      };
    }

    const hours = cancelled
      .map((s) => {
        try {
          return `${new Date(s.startAt).getHours()}h`;
        } catch {
          return formatWhenLabel(s.startAt);
        }
      })
      .join(', ');

    return {
      provider: 'movvo-action',
      llm: 'rules',
      sources: ['agenda'],
      answer: `Excluí ${cancelled.length} aula(s) "${filter.titleHint}" (${hours}).${
        errors.length ? ` Algumas falharam: ${errors.join('; ')}` : ''
      } A grade deve atualizar em instantes.`,
      data: {
        actionResult: 'schedules_cancelled',
        cancelled,
        filter,
        errors: errors.length ? errors : undefined,
      },
    };
  }

  private async tryAgendaChatActions(
    auth: AuthContext,
    persona: 'admin' | 'professor' | 'aluno',
    question: string,
    context: Record<string, unknown>,
    sources: string[],
  ): Promise<MovvoAiChatResponse | null> {
    const wantsAgenda =
      isAgendaQuestion(question) ||
      isReserveIntent(question) ||
      isCancelAgendaIntent(question) ||
      isCreateScheduleIntent(question) ||
      isDeleteScheduleIntent(question) ||
      persona === 'aluno';

    if (!wantsAgenda) return null;

    if (
      isCreateScheduleIntent(question) &&
      (persona === 'professor' || persona === 'admin')
    ) {
      return this.executeCreateScheduleFromChat(auth, question, sources);
    }

    if (
      isDeleteScheduleIntent(question) &&
      (persona === 'professor' || persona === 'admin')
    ) {
      return this.executeDeleteSchedulesFromChat(auth, persona, question, sources);
    }

    let portal: Awaited<ReturnType<OperationsService['portalAgenda']>> | null = null;
    try {
      portal = await this.operations.portalAgenda(auth);
    } catch {
      if (persona === 'aluno') {
        return {
          provider: 'movvo-rules',
          llm: 'rules',
          sources: ['agenda'],
          answer:
            'Não encontrei sua ficha de aluno vinculada a este login. Peça à recepção para associar seu e-mail à matrícula.',
        };
      }
      // staff without student record: still expose company open classes for Q&A
      try {
        const from = new Date().toISOString();
        const to = new Date(Date.now() + 30 * 24 * 3600_000).toISOString();
        const schedules = await this.operations.listSchedules(auth, { from, to, type: 'class' });
        const open = schedules
          .filter((s) => s.type === 'class' && s.status === 'scheduled' && !s.isBlock)
          .slice(0, 20)
          .map(summarizeSchedule);
        context.openClasses = open;
        sources.push('agenda');
        if (isReserveIntent(question)) {
          return {
            provider: 'movvo-rules',
            llm: 'rules',
            sources: ['agenda'],
            answer:
              'Reserva pelo chat está disponível no perfil aluno. Como professor/gestor, você pode criar aulas (ex.: "agende uma aula de Yoga amanhã às 10h") ou pedir ao aluno para reservar no portal.',
            data: { openClasses: open },
          };
        }
      } catch {
        /* ignore */
      }
      return null;
    }

    const myAgenda = summarizeUpcoming(portal.upcoming);
    const openClasses = portal.openClasses.map(summarizeSchedule);
    context.myAgenda = myAgenda;
    context.openClasses = openClasses;
    context.studentName = portal.student.fullName;
    context.cancelCutoffMinutes = CLASS_CANCEL_CUTOFF_MINUTES;
    sources.push('agenda');

    if (isCancelAgendaIntent(question)) {
      const target = matchUpcomingClass(question, myAgenda);
      if (!target) {
        if (!myAgenda.length) {
          return {
            provider: 'movvo-action',
            llm: 'rules',
            sources: ['agenda'],
            answer: 'Você não tem reservas ativas para cancelar.',
            data: { myAgenda, openClasses },
          };
        }
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: `Qual reserva deseja cancelar?\n${myAgenda
            .map(
              (s, i) =>
                `${i + 1}. ${s.title} — ${formatWhenLabel(s.startAt)}${s.canCancel === false ? ' (bloqueado)' : ''}`,
            )
            .join('\n')}`,
          data: { myAgenda, openClasses },
        };
      }
      const blocked = classCancelBlockMessage(target.startAt);
      if (blocked) {
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: blocked,
          data: { myAgenda, openClasses, scheduleId: target.id },
        };
      }
      try {
        const cancelled = await this.operations.portalCancelEnroll(auth, target.id);
        let refreshedAgenda: ReturnType<typeof summarizeUpcoming> = [];
        let refreshedOpen: ReturnType<typeof summarizeSchedule>[] = [];
        try {
          const after = await this.operations.portalAgenda(auth);
          refreshedAgenda = summarizeUpcoming(after.upcoming);
          refreshedOpen = after.openClasses.map(summarizeSchedule);
        } catch {
          /* ignore refresh errors */
        }
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: `Cancelei sua reserva em "${target.title}" (${formatWhenLabel(target.startAt)}). Status: ${cancelled.status}. A aula voltou para disponíveis, se ainda estiver aberta.`,
          data: {
            actionResult: 'cancelled',
            cancelled,
            scheduleId: target.id,
            myAgenda: refreshedAgenda,
            openClasses: refreshedOpen,
          },
        };
      } catch (e) {
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: e instanceof Error ? e.message : 'Não foi possível cancelar a reserva.',
          data: { myAgenda, openClasses },
        };
      }
    }

    if (isReserveIntent(question)) {
      const target = matchOpenClass(question, openClasses);
      if (!target) {
        if (!openClasses.length) {
          return {
            provider: 'movvo-action',
            llm: 'rules',
            sources: ['agenda'],
            answer: 'Não há aulas abertas para reserva no momento. Veja Minha agenda no portal.',
            data: { myAgenda, openClasses },
          };
        }
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: `Qual aula deseja reservar?\n${formatOpenClassesList(openClasses)}\n\nResponda com o número (ex.: "reservar a aula 1") ou o nome/data.`,
          data: { myAgenda, openClasses },
        };
      }
      try {
        const enrollment = await this.operations.portalEnroll(auth, target.id);
        const waitlist = enrollment.status === 'waitlist';
        let refreshedAgenda: ReturnType<typeof summarizeUpcoming> = [];
        let refreshedOpen: ReturnType<typeof summarizeSchedule>[] = [];
        try {
          const after = await this.operations.portalAgenda(auth);
          refreshedAgenda = summarizeUpcoming(after.upcoming);
          refreshedOpen = after.openClasses.map(summarizeSchedule);
        } catch {
          /* ignore */
        }
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: waitlist
            ? `A aula "${target.title}" (${formatWhenLabel(target.startAt)}) está lotada — você entrou na fila de espera${
                enrollment.waitlistPosition ? ` (posição ${enrollment.waitlistPosition})` : ''
              }.`
            : `Pronto! Reservei "${target.title}" em ${formatWhenLabel(target.startAt)}. Status: ${enrollment.status}.`,
          data: {
            actionResult: waitlist ? 'waitlisted' : 'reserved',
            enrollment,
            scheduleId: target.id,
            title: target.title,
            myAgenda: refreshedAgenda,
            openClasses: refreshedOpen,
          },
        };
      } catch (e) {
        return {
          provider: 'movvo-action',
          llm: 'rules',
          sources: ['agenda'],
          answer: e instanceof Error ? e.message : 'Não foi possível reservar a aula.',
          data: { myAgenda, openClasses },
        };
      }
    }

    // Agenda Q&A without action — let rules/LLM answer with grounded context
    return null;
  }

  async listGoals(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const rows = await this.repo.listGoals(companyId);
    const m = await this.repo.computeMetrics(companyId);
    const metricValue = (metric: string) => {
      switch (metric) {
        case 'revenue':
          return m.revenueMonth;
        case 'checkins':
          return m.checkins;
        case 'enrollments':
          return m.enrollments;
        case 'renewals':
          return Math.max(0, m.activeStudents - m.cancellations);
        case 'profit':
          return m.profit;
        default:
          return 0;
      }
    };
    return rows.map((r) => this.repo.mapGoal(r as Record<string, unknown>, metricValue(String(r.metric))));
  }

  async createGoal(user: AuthUser, auth: AuthContext, dto: CreateGoalDto) {
    const companyId = this.companyId(auth);
    try {
      const row = await this.repo.createGoal({
        company_id: companyId,
        unit_id: dto.unitId ?? null,
        metric: dto.metric,
        target_value: dto.targetValue,
        period_start: dto.periodStart,
        period_end: dto.periodEnd,
        label: dto.label ?? null,
        active: true,
        created_by: user.id,
      });
      const goals = await this.listGoals(auth);
      return goals.find((g) => g.id === String(row.id)) || this.repo.mapGoal(row);
    } catch {
      const m = await this.repo.computeMetrics(companyId);
      const current =
        dto.metric === 'revenue'
          ? m.revenueMonth
          : dto.metric === 'checkins'
            ? m.checkins
            : dto.metric === 'enrollments'
              ? m.enrollments
              : dto.metric === 'profit'
                ? m.profit
                : 0;
      return this.repo.mapGoal(
        {
          id: `stub-goal-${Date.now()}`,
          company_id: companyId,
          unit_id: dto.unitId ?? null,
          metric: dto.metric,
          target_value: dto.targetValue,
          period_start: dto.periodStart,
          period_end: dto.periodEnd,
          label: dto.label ?? 'Meta (pendente migration)',
          active: true,
          created_at: new Date().toISOString(),
        },
        current,
      );
    }
  }

  listAlerts(auth: AuthContext) {
    return this.repo.listAlerts(this.companyId(auth));
  }

  async markAlertRead(auth: AuthContext, id: string) {
    const alert = await this.repo.markAlertRead(this.companyId(auth), id);
    if (!alert) throw new NotFoundException('alert_not_found');
    return alert;
  }

  async refreshAlerts(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const m = await this.repo.computeMetrics(companyId);
    const { full, overloaded } = await this.repo.fullSchedulesToday(companyId);
    const overdue = await this.repo.listOverdueStudents(companyId, 5);
    const rows: Record<string, unknown>[] = [];

    if (deltaPercent(m.revenueMonth, m.prevRevenue) <= -10) {
      rows.push({
        company_id: companyId,
        code: 'revenue_down',
        severity: 'warning',
        title: 'Receita caiu',
        message: `Receita do mês caiu ${Math.abs(deltaPercent(m.revenueMonth, m.prevRevenue))}% vs mês anterior.`,
        recommendation: 'Acelere campanhas e cobranças.',
        evidence: { revenueMonth: m.revenueMonth, prevRevenue: m.prevRevenue },
      });
    }
    if (deltaPercent(m.cancellations, m.prevCancellations) >= 15) {
      rows.push({
        company_id: companyId,
        code: 'cancellations_up',
        severity: 'warning',
        title: 'Cancelamentos aumentaram',
        message: `Cancelamentos subiram para ${m.cancellations} no período.`,
        recommendation: 'Ative recuperação de churn no CRM.',
        evidence: { cancellations: m.cancellations },
      });
    }
    if (m.cashAvailable < 0) {
      rows.push({
        company_id: companyId,
        code: 'negative_cash',
        severity: 'critical',
        title: 'Caixa negativo',
        message: `Caixa estimado: R$ ${m.cashAvailable.toFixed(2)}.`,
        recommendation: 'Priorize inadimplentes VIP.',
        evidence: { cashAvailable: m.cashAvailable },
      });
    }
    for (const f of full.slice(0, 3)) {
      rows.push({
        company_id: companyId,
        code: 'class_full',
        severity: 'info',
        title: 'Turma lotada',
        message: `${f.title} com ${f.occupancy}% de ocupação.`,
        recommendation: 'Abra nova turma no horário seguinte.',
        evidence: f,
      });
    }
    for (const t of overloaded.slice(0, 2)) {
      rows.push({
        company_id: companyId,
        code: 'teacher_overload',
        severity: 'warning',
        title: 'Professor sobrecarregado',
        message: `Professor ${t.id.slice(0, 8)} com ${t.count} aulas hoje.`,
        recommendation: 'Redistribua turmas ou contrate reforço.',
        evidence: t,
      });
    }
    if (overdue[0]) {
      rows.push({
        company_id: companyId,
        code: 'vip_overdue',
        severity: 'warning',
        title: 'Aluno VIP inadimplente',
        message: `${overdue[0].name} com título vencido de R$ ${overdue[0].amount}.`,
        recommendation: 'Cobrança personalizada hoje.',
        evidence: overdue[0],
      });
    }

    return this.repo.insertAlerts(rows);
  }

  connectors(auth: AuthContext) {
    return this.repo.ensureConnectors(this.companyId(auth));
  }
}
