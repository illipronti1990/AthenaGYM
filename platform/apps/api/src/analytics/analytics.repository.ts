import { Injectable } from '@nestjs/common';
import type {
  AnalyticsDashboard,
  ExecutiveDashboard,
  ExportJob,
  KpiItem,
  PredictionItem,
  ReportDefinition,
  ReportSchedule,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapReport(row: Record<string, unknown>): ReportDefinition {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      source: String(row.source),
      fields: (row.fields as string[]) || [],
      filters: (row.filters as Record<string, unknown>) || {},
      groupBy: (row.group_by as string[]) || [],
      shared: Boolean(row.shared),
      createdAt: String(row.created_at),
    };
  }

  mapExport(row: Record<string, unknown>): ExportJob {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      reportId: row.report_id ? String(row.report_id) : null,
      format: String(row.format),
      status: String(row.status),
      fileUrl: row.file_url ? String(row.file_url) : null,
      rowCount: row.row_count != null ? Number(row.row_count) : null,
      createdAt: String(row.created_at),
      completedAt: row.completed_at ? String(row.completed_at) : null,
    };
  }

  mapPrediction(row: Record<string, unknown>): PredictionItem {
    return {
      id: String(row.id),
      entityType: String(row.entity_type),
      entityId: String(row.entity_id),
      predictionType: String(row.prediction_type),
      score: Number(row.score),
      label: row.label ? String(row.label) : null,
      recommendation: row.recommendation ? String(row.recommendation) : null,
      features: (row.features as Record<string, unknown>) || {},
      createdAt: String(row.created_at),
    };
  }

  mapSchedule(row: Record<string, unknown>): ReportSchedule {
    return {
      id: String(row.id),
      reportId: String(row.report_id),
      cron: String(row.cron),
      channel: String(row.channel),
      format: String(row.format),
      active: Boolean(row.active),
      lastRunAt: row.last_run_at ? String(row.last_run_at) : null,
    };
  }

  async sumRevenue(companyId: string, from: string, to: string) {
    const { data } = await this.admin()
      .schema('analytics')
      .from('fact_revenue')
      .select('gross_revenue, net_revenue, expenses, profit')
      .eq('company_id', companyId)
      .gte('date', from)
      .lte('date', to);
    const rows = data || [];
    return rows.reduce(
      (acc, r) => {
        acc.gross += Number(r.gross_revenue || 0);
        acc.net += Number(r.net_revenue || 0);
        acc.expenses += Number(r.expenses || 0);
        acc.profit += Number(r.profit || 0);
        return acc;
      },
      { gross: 0, net: 0, expenses: 0, profit: 0 },
    );
  }

  async sumCheckins(companyId: string, from: string, to: string) {
    const { data } = await this.admin()
      .schema('analytics')
      .from('fact_checkins')
      .select('checkins')
      .eq('company_id', companyId)
      .gte('date', from)
      .lte('date', to);
    return (data || []).reduce((s, r) => s + Number(r.checkins || 0), 0);
  }

  async salesStats(companyId: string, from: string, to: string) {
    const { data } = await this.admin()
      .schema('analytics')
      .from('fact_sales')
      .select('converted, amount')
      .eq('company_id', companyId)
      .gte('date', from)
      .lte('date', to);
    const rows = data || [];
    const leads = rows.length;
    const converted = rows.filter((r) => r.converted).length;
    const amount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    return { leads, converted, amount };
  }

  async listKpiDefinitions() {
    const { data } = await this.admin()
      .from('kpi_definitions')
      .select('*')
      .is('company_id', null)
      .order('category');
    return data || [];
  }

  async buildExecutive(_companyId: string): Promise<ExecutiveDashboard> {
    // Clean slate: Relatórios shows zeros until real warehouse/ETL is enabled.
    return {
      revenue: 0,
      revenueDeltaPct: 0,
      profit: 0,
      profitDeltaPct: 0,
      churn: 0,
      churnDeltaPct: 0,
      conversion: 0,
      conversionDeltaPct: 0,
      checkins: 0,
      checkinsDeltaPct: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async buildDashboard(companyId: string): Promise<AnalyticsDashboard> {
    const executive = await this.buildExecutive(companyId);
    const defs = await this.listKpiDefinitions();

    const values: Record<string, number> = {
      revenue_daily: 0,
      revenue_monthly: 0,
      revenue_yearly: 0,
      avg_ticket: 0,
      profit: 0,
      conversion: 0,
      cac: 0,
      ltv: 0,
      churn: 0,
      leads: 0,
      enrollments: 0,
      cancellations: 0,
      checkins: 0,
      frequency: 0,
      occupancy: 0,
      no_show: 0,
      workouts_completed: 0,
      avg_evolution: 0,
      active_users: 0,
      engagement_rate: 0,
    };

    const kpis: KpiItem[] = defs.map((d) => ({
      code: String(d.code),
      name: String(d.name),
      category: String(d.category),
      value: values[String(d.code)] ?? 0,
      unit: String(d.unit),
      deltaPct:
        d.code === 'revenue_monthly'
          ? executive.revenueDeltaPct
          : d.code === 'profit'
            ? executive.profitDeltaPct
            : d.code === 'churn'
              ? executive.churnDeltaPct
              : d.code === 'conversion'
                ? executive.conversionDeltaPct
                : d.code === 'checkins'
                  ? executive.checkinsDeltaPct
                  : null,
    }));

    const byCategory: Record<string, KpiItem[]> = {};
    for (const k of kpis) {
      byCategory[k.category] = byCategory[k.category] || [];
      byCategory[k.category].push(k);
    }

    return { executive, kpis, byCategory };
  }

  async listPredictions(companyId: string, type?: string) {
    let q = this.admin()
      .from('predictions')
      .select('*')
      .eq('company_id', companyId)
      .order('score', { ascending: false })
      .limit(100);
    if (type) q = q.eq('prediction_type', type);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapPrediction(r as Record<string, unknown>));
  }

  async insertPredictions(
    rows: Array<{
      company_id: string;
      entity_type: string;
      entity_id: string;
      prediction_type: string;
      score: number;
      label: string;
      recommendation: string;
      features: Record<string, unknown>;
    }>,
  ) {
    if (!rows.length) return [];
    const { data, error } = await this.admin().from('predictions').insert(rows).select('*');
    if (error) throw error;
    return (data || []).map((r) => this.mapPrediction(r as Record<string, unknown>));
  }

  async listReports(companyId: string) {
    const { data, error } = await this.admin()
      .from('report_definitions')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapReport(r as Record<string, unknown>));
  }

  async getReport(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('report_definitions')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapReport(data as Record<string, unknown>) : null;
  }

  async createReport(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('report_definitions')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapReport(data as Record<string, unknown>);
  }

  async createExport(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('export_jobs').insert(row).select('*').single();
    if (error) throw error;
    return this.mapExport(data as Record<string, unknown>);
  }

  async completeExport(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('export_jobs')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapExport(data as Record<string, unknown>);
  }

  async listExports(companyId: string) {
    const { data, error } = await this.admin()
      .from('export_jobs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((r) => this.mapExport(r as Record<string, unknown>));
  }

  async createSchedule(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('report_schedules')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapSchedule(data as Record<string, unknown>);
  }

  async listSchedules(companyId: string) {
    const { data, error } = await this.admin()
      .from('report_schedules')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapSchedule(r as Record<string, unknown>));
  }

  async queryFactRows(source: string, companyId: string) {
    const table =
      source === 'checkins'
        ? 'fact_checkins'
        : source === 'revenue'
          ? 'fact_revenue'
          : source === 'sales'
            ? 'fact_sales'
            : 'fact_workouts';
    const { data, error } = await this.admin()
      .schema('analytics')
      .from(table)
      .select('*')
      .eq('company_id', companyId)
      .order('date', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data || []) as Record<string, unknown>[];
  }

  async upsertDailyFacts(companyId: string) {
    const date = new Date().toISOString().slice(0, 10);
    // Keep warehouse at zero until real ETL is connected (no demo seed).
    await this.admin()
      .schema('analytics')
      .from('fact_revenue')
      .update({
        gross_revenue: 0,
        net_revenue: 0,
        expenses: 0,
        profit: 0,
      })
      .eq('company_id', companyId);
    await this.admin()
      .schema('analytics')
      .from('fact_checkins')
      .update({ checkins: 0, duration_minutes: 0 })
      .eq('company_id', companyId);
    await this.admin()
      .schema('analytics')
      .from('fact_sales')
      .delete()
      .eq('company_id', companyId);

    const { data: existingRev } = await this.admin()
      .schema('analytics')
      .from('fact_revenue')
      .select('id')
      .eq('company_id', companyId)
      .eq('date', date)
      .is('unit_id', null)
      .maybeSingle();
    if (!existingRev) {
      await this.admin().schema('analytics').from('fact_revenue').insert({
        date,
        company_id: companyId,
        unit_id: null,
        gross_revenue: 0,
        net_revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }
    const { data: existingCheck } = await this.admin()
      .schema('analytics')
      .from('fact_checkins')
      .select('id')
      .eq('company_id', companyId)
      .eq('date', date)
      .is('unit_id', null)
      .is('student_id', null)
      .maybeSingle();
    if (!existingCheck) {
      await this.admin().schema('analytics').from('fact_checkins').insert({
        date,
        company_id: companyId,
        unit_id: null,
        student_id: null,
        checkins: 0,
        duration_minutes: 0,
      });
    }
    return ['fact_revenue', 'fact_checkins'];
  }

  async listStudentsForChurn(companyId: string) {
    const { data } = await this.admin()
      .from('students')
      .select('id, full_name, status')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .limit(50);
    return data || [];
  }
}
