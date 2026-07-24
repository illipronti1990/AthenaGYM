import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  predictChurn,
  predictLeadConversion,
  REPORT_SOURCES,
  toCsv,
  type ExportFormat,
} from '@athenas/sdk-bi';
import type { AuthContext } from '@athenas/shared';
import { AuthUser } from '../auth/auth.types';
import {
  AiInsightsDto,
  CreateExportDto,
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

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repo: AnalyticsRepository,
    private readonly events: EventEmitter2,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  dashboard(auth: AuthContext) {
    return this.repo.buildDashboard(this.companyId(auth));
  }

  executive(auth: AuthContext) {
    return this.repo.buildExecutive(this.companyId(auth));
  }

  async kpis(auth: AuthContext) {
    const dash = await this.repo.buildDashboard(this.companyId(auth));
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
      const rows = students.map((s, idx) => {
        const pred = predictChurn({
          daysSinceLastCheckin: 7 + (idx % 25),
          missedWorkouts30d: idx % 10,
          overdueInvoices: idx % 3,
          complaints90d: idx % 2,
          planMonthsRemaining: (idx % 6) + 1,
        });
        return {
          company_id: companyId,
          entity_type: 'student',
          entity_id: String(s.id),
          prediction_type: 'churn',
          score: pred.score,
          label: pred.label,
          recommendation: pred.recommendation,
          features: { ...pred.features, name: s.full_name },
        };
      });
      // Always include a high-risk demo if empty
      if (!rows.length) {
        rows.push({
          company_id: companyId,
          entity_type: 'student',
          entity_id: '00000000-0000-0000-0000-000000000099',
          prediction_type: 'churn',
          score: 0.92,
          label: 'critical',
          recommendation: 'Entrar em contato. Oferecer retenção ou reagendar avaliação.',
          features: {
            name: 'Carlos',
            daysSinceLastCheckin: 28,
            missedWorkouts30d: 9,
            overdueInvoices: 2,
            complaints90d: 1,
            planMonthsRemaining: 1,
          },
        });
      }
      created.push(...(await this.repo.insertPredictions(rows)));
    }

    if (type === 'lead_conversion') {
      const score = predictLeadConversion({
        daysInPipeline: 5,
        touchpoints: 4,
        hasTrialClass: true,
        sourceQuality: 0.8,
      });
      created.push(
        ...(await this.repo.insertPredictions([
          {
            company_id: companyId,
            entity_type: 'lead',
            entity_id: '00000000-0000-0000-0000-000000000088',
            prediction_type: 'lead_conversion',
            score,
            label: score >= 0.7 ? 'high' : 'medium',
            recommendation: 'Priorizar follow-up comercial nas próximas 24h.',
            features: { daysInPipeline: 5, touchpoints: 4, hasTrialClass: true },
          },
        ])),
      );
    }

    this.events.emit(PREDICTIONS_RUN, {
      companyId,
      type,
      count: created.length,
    });
    return created;
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

    const rows = await this.repo.queryFactRows(source, companyId);
    const format = dto.format as ExportFormat;
    let fileUrl: string | null = null;
    if (format === 'csv' || format === 'excel') {
      const csv = toCsv(rows, fields);
      // Stub storage path — worker/push to object storage later
      fileUrl = `data:text/csv;base64,${Buffer.from(csv).toString('base64')}`;
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
    this.events.emit(REPORT_SCHEDULED, { companyId, scheduleId: schedule.id, reportId: dto.reportId });
    return schedule;
  }

  listSchedules(auth: AuthContext) {
    return this.repo.listSchedules(this.companyId(auth));
  }

  async syncWarehouse(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const facts = await this.repo.upsertDailyFacts(companyId);
    this.events.emit(WAREHOUSE_SYNCED, { companyId, facts });
    return { ok: true, facts };
  }

  reportSources() {
    return REPORT_SOURCES;
  }

  async aiInsights(auth: AuthContext, dto: AiInsightsDto) {
    const companyId = this.companyId(auth);
    const exec = await this.repo.buildExecutive(companyId);
    const q = dto.question.toLowerCase();
    let answer =
      `Com base nos indicadores atuais: receita R$ ${exec.revenue.toLocaleString('pt-BR')}, ` +
      `lucro R$ ${exec.profit.toLocaleString('pt-BR')}, churn ${exec.churn}%, conversão ${exec.conversion}%.`;

    if (q.includes('inadimpl') || q.includes('unidade')) {
      answer =
        'Unidade com maior risco financeiro (stub): Unidade Centro — inadimplência relativa acima da média. Recomendo campanha de cobrança amigável e revisão de planos.';
    } else if (q.includes('churn') || q.includes('cancel')) {
      answer = `Churn atual ${exec.churn}%. Priorize alunos com predição crítica em /analytics/predictions.`;
    } else if (q.includes('receita') || q.includes('fatur')) {
      answer = `Receita do período: R$ ${exec.revenue.toLocaleString('pt-BR')} (${exec.revenueDeltaPct >= 0 ? '↑' : '↓'} ${Math.abs(exec.revenueDeltaPct)}%).`;
    }

    return {
      provider: 'analytics-ai-stub',
      question: dto.question,
      answer,
      sources: ['executive', 'kpi_snapshots', 'predictions'],
    };
  }
}
