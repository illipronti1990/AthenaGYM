import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  predictChurn,
  REPORT_SOURCES,
  toCsv,
  type ExportFormat,
} from '@athena/sdk-bi';
import type { AuthContext } from '@athena/shared';
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
      if (rows.length) {
        created.push(...(await this.repo.insertPredictions(rows)));
      }
    }

    if (type === 'lead_conversion') {
      // Predictions only from real leads — no demo seed.
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
    this.companyId(auth);
    return {
      provider: 'analytics-ai-stub',
      question: dto.question,
      answer:
        'Ainda não há dados suficientes nos Relatórios (tudo zerado). Assim que o warehouse/ETL estiver ativo, os insights aparecerão aqui.',
      sources: ['executive', 'kpi_snapshots', 'predictions'],
    };
  }
}
