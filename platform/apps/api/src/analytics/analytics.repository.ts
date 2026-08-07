import { Injectable } from '@nestjs/common';
import {
  averageTicket,
  churnRate,
  conversionRate,
  daysAgo,
  deltaPercent,
  startOfMonth,
  startOfYear,
} from '@athena/sdk-bi';
import type {
  AnalyticsDashboard,
  BiAlert,
  BiConnector,
  BiGoal,
  ExecutiveDashboard,
  ExportJob,
  KpiItem,
  PredictionItem,
  ReportDefinition,
  ReportSchedule,
} from '@athena/shared';
import { progressPct } from '@athena/sdk-bi';
import { SupabaseService } from '../supabase/supabase.service';

type PeriodFilter = { from?: string; to?: string; unitId?: string };

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

  mapGoal(row: Record<string, unknown>, currentValue = 0): BiGoal {
    const target = Number(row.target_value || 0);
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      metric: String(row.metric),
      targetValue: target,
      periodStart: String(row.period_start),
      periodEnd: String(row.period_end),
      label: row.label ? String(row.label) : null,
      active: Boolean(row.active),
      currentValue,
      progressPct: progressPct(currentValue, target),
      createdAt: String(row.created_at),
    };
  }

  mapAlert(row: Record<string, unknown>): BiAlert {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      code: String(row.code),
      severity: String(row.severity),
      title: String(row.title),
      message: String(row.message),
      recommendation: row.recommendation ? String(row.recommendation) : null,
      evidence: (row.evidence as Record<string, unknown>) || {},
      readAt: row.read_at ? String(row.read_at) : null,
      createdAt: String(row.created_at),
    };
  }

  mapConnector(row: Record<string, unknown>): BiConnector {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      provider: String(row.provider),
      status: String(row.status),
      config: (row.config as Record<string, unknown>) || {},
      lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
    };
  }

  async sumRevenue(companyId: string, from: string, to: string, unitId?: string) {
    let q = this.admin()
      .schema('analytics')
      .from('fact_revenue')
      .select('gross_revenue, net_revenue, expenses, profit')
      .eq('company_id', companyId)
      .gte('date', from)
      .lte('date', to);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data } = await q;
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

  async sumCheckins(companyId: string, from: string, to: string, unitId?: string) {
    let q = this.admin()
      .schema('analytics')
      .from('fact_checkins')
      .select('checkins, duration_minutes')
      .eq('company_id', companyId)
      .gte('date', from)
      .lte('date', to)
      .is('student_id', null);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data } = await q;
    return (data || []).reduce(
      (acc, r) => {
        acc.checkins += Number(r.checkins || 0);
        acc.minutes += Number(r.duration_minutes || 0);
        return acc;
      },
      { checkins: 0, minutes: 0 },
    );
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

  /** Paid receivables in range (OLTP) */
  async oltpPaidRevenue(companyId: string, from: string, to: string, unitId?: string) {
    let q = this.admin()
      .from('receivables')
      .select('amount, discount, interest, fine, unit_id, paid_at')
      .eq('company_id', companyId)
      .eq('status', 'paid')
      .is('deleted_at', null)
      .gte('paid_at', `${from}T00:00:00.000Z`)
      .lte('paid_at', `${to}T23:59:59.999Z`);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data } = await q;
    return (data || []).reduce((s, r) => {
      const amt =
        Number(r.amount || 0) - Number(r.discount || 0) + Number(r.interest || 0) + Number(r.fine || 0);
      return s + amt;
    }, 0);
  }

  async oltpPaidExpenses(companyId: string, from: string, to: string, unitId?: string) {
    let q = this.admin()
      .from('payables')
      .select('amount, unit_id, paid_at')
      .eq('company_id', companyId)
      .eq('status', 'paid')
      .is('deleted_at', null)
      .gte('paid_at', `${from}T00:00:00.000Z`)
      .lte('paid_at', `${to}T23:59:59.999Z`);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data } = await q;
    return (data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  }

  async oltpOpenReceivables(companyId: string, unitId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    let q = this.admin()
      .from('receivables')
      .select('amount, due_date, status')
      .eq('company_id', companyId)
      .in('status', ['open', 'overdue'])
      .is('deleted_at', null);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data } = await q;
    let open = 0;
    let overdue = 0;
    for (const r of data || []) {
      const amt = Number(r.amount || 0);
      open += amt;
      if (String(r.due_date) < today || r.status === 'overdue') overdue += amt;
    }
    return { open, overdue };
  }

  async oltpMrr(companyId: string) {
    const { data } = await this.admin()
      .from('subscriptions')
      .select('amount')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .is('deleted_at', null);
    return (data || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  }

  async oltpCheckinCount(companyId: string, from: string, to: string, unitId?: string) {
    let q = this.admin()
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('checked_in_at', `${from}T00:00:00.000Z`)
      .lte('checked_in_at', `${to}T23:59:59.999Z`);
    if (unitId) q = q.eq('unit_id', unitId);
    const { count } = await q;
    return count || 0;
  }

  async oltpStudentCounts(companyId: string, from: string, to: string) {
    const { count: active } = await this.admin()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .is('deleted_at', null);

    const { count: created } = await this.admin()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('created_at', `${from}T00:00:00.000Z`)
      .lte('created_at', `${to}T23:59:59.999Z`);

    const { count: cancelled } = await this.admin()
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'cancelled')
      .is('deleted_at', null)
      .gte('updated_at', `${from}T00:00:00.000Z`)
      .lte('updated_at', `${to}T23:59:59.999Z`);

    return { active: active || 0, created: created || 0, cancelled: cancelled || 0 };
  }

  async oltpLeadsStats(companyId: string, from: string, to: string) {
    const { data } = await this.admin()
      .from('leads')
      .select('id, status, student_id, created_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('created_at', `${from}T00:00:00.000Z`)
      .lte('created_at', `${to}T23:59:59.999Z`);
    const rows = data || [];
    const converted = rows.filter((r) => r.student_id || r.status === 'won' || r.status === 'converted').length;
    return { leads: rows.length, converted };
  }

  async oltpOccupancy(companyId: string, from: string, to: string) {
    const { data: schedules } = await this.admin()
      .from('schedules')
      .select('id, max_capacity')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('start_at', `${from}T00:00:00.000Z`)
      .lte('start_at', `${to}T23:59:59.999Z`);
    const list = schedules || [];
    if (!list.length) return 0;
    let reserved = 0;
    let capacity = 0;
    for (const s of list) {
      capacity += Number(s.max_capacity || 0);
      const { count } = await this.admin()
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', String(s.id))
        .in('status', ['reserved', 'checked_in'])
        .is('deleted_at', null);
      reserved += count || 0;
    }
    if (capacity <= 0) return 0;
    return Math.round((reserved / capacity) * 1000) / 10;
  }

  async computeMetrics(companyId: string, filter: PeriodFilter = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = startOfMonth();
    const yearStart = startOfYear();
    const prevMonthStart = startOfMonth(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)));
    const prevMonthEnd = daysAgo(new Date().getUTCDate(), new Date());
    const unitId = filter.unitId;

    const from = filter.from || monthStart;
    const to = filter.to || today;

    const [
      factMonth,
      factPrev,
      factDay,
      factYear,
      oltpDay,
      oltpMonth,
      oltpYear,
      oltpPrevMonth,
      expMonth,
      expPrev,
      mrr,
      delinquency,
      checkinsMonth,
      checkinsPrev,
      students,
      studentsPrev,
      leads,
      leadsPrev,
      occupancy,
      checkinsFact,
    ] = await Promise.all([
      this.sumRevenue(companyId, monthStart, today, unitId),
      this.sumRevenue(companyId, prevMonthStart, prevMonthEnd, unitId),
      this.sumRevenue(companyId, today, today, unitId),
      this.sumRevenue(companyId, yearStart, today, unitId),
      this.oltpPaidRevenue(companyId, today, today, unitId),
      this.oltpPaidRevenue(companyId, monthStart, today, unitId),
      this.oltpPaidRevenue(companyId, yearStart, today, unitId),
      this.oltpPaidRevenue(companyId, prevMonthStart, prevMonthEnd, unitId),
      this.oltpPaidExpenses(companyId, monthStart, today, unitId),
      this.oltpPaidExpenses(companyId, prevMonthStart, prevMonthEnd, unitId),
      this.oltpMrr(companyId),
      this.oltpOpenReceivables(companyId, unitId),
      this.oltpCheckinCount(companyId, monthStart, today, unitId),
      this.oltpCheckinCount(companyId, prevMonthStart, prevMonthEnd, unitId),
      this.oltpStudentCounts(companyId, monthStart, today),
      this.oltpStudentCounts(companyId, prevMonthStart, prevMonthEnd),
      this.oltpLeadsStats(companyId, monthStart, today),
      this.oltpLeadsStats(companyId, prevMonthStart, prevMonthEnd),
      this.oltpOccupancy(companyId, monthStart, today),
      this.sumCheckins(companyId, monthStart, today, unitId),
    ]);

    const revenueDay = factDay.gross > 0 ? factDay.gross : oltpDay;
    const revenueMonth = factMonth.gross > 0 ? factMonth.gross : oltpMonth;
    const revenueYear = factYear.gross > 0 ? factYear.gross : oltpYear;
    const prevRevenue = factPrev.gross > 0 ? factPrev.gross : oltpPrevMonth;
    const expenses = factMonth.expenses > 0 ? factMonth.expenses : expMonth;
    const prevExpenses = factPrev.expenses > 0 ? factPrev.expenses : expPrev;
    const profit = revenueMonth - expenses;
    const prevProfit = prevRevenue - prevExpenses;
    const checkins = checkinsFact.checkins > 0 ? checkinsFact.checkins : checkinsMonth;
    const frequency =
      students.active > 0 ? Math.round((checkins / students.active) * 10) / 10 : 0;
    const avgTicket = averageTicket(revenueMonth, Math.max(1, students.created || leads.converted || 1));
    const churn = churnRate(students.cancelled, Math.max(1, students.active + students.cancelled));
    const prevChurn = churnRate(
      studentsPrev.cancelled,
      Math.max(1, studentsPrev.active + studentsPrev.cancelled),
    );
    const conversion = conversionRate(leads.converted, leads.leads);
    const prevConversion = conversionRate(leadsPrev.converted, leadsPrev.leads);
    const cashAvailable = revenueMonth - expenses - delinquency.overdue * 0.1;

    return {
      revenueDay,
      revenueMonth,
      revenueYear,
      prevRevenue,
      mrr,
      avgTicket,
      profit,
      prevProfit,
      churn,
      prevChurn,
      delinquency: delinquency.overdue,
      delinquencyOpen: delinquency.open,
      cashAvailable,
      conversion,
      prevConversion,
      checkins,
      prevCheckins: checkinsPrev,
      newStudents: students.created,
      cancellations: students.cancelled,
      prevCancellations: studentsPrev.cancelled,
      frequency,
      occupancy,
      activeStudents: students.active,
      leads: leads.leads,
      enrollments: leads.converted || students.created,
      expenses,
      from,
      to,
    };
  }

  async buildExecutive(companyId: string, filter: PeriodFilter = {}): Promise<ExecutiveDashboard> {
    const m = await this.computeMetrics(companyId, filter);
    return {
      revenue: m.revenueMonth,
      revenueDeltaPct: deltaPercent(m.revenueMonth, m.prevRevenue),
      revenueDay: m.revenueDay,
      revenueMonth: m.revenueMonth,
      revenueYear: m.revenueYear,
      mrr: m.mrr,
      avgTicket: m.avgTicket,
      profit: m.profit,
      profitDeltaPct: deltaPercent(m.profit, m.prevProfit),
      churn: m.churn,
      churnDeltaPct: deltaPercent(m.churn, m.prevChurn),
      delinquency: m.delinquency,
      cashAvailable: Math.round(m.cashAvailable * 100) / 100,
      conversion: m.conversion,
      conversionDeltaPct: deltaPercent(m.conversion, m.prevConversion),
      checkins: m.checkins,
      checkinsDeltaPct: deltaPercent(m.checkins, m.prevCheckins),
      newStudents: m.newStudents,
      cancellations: m.cancellations,
      frequency: m.frequency,
      occupancy: m.occupancy,
      updatedAt: new Date().toISOString(),
    };
  }

  async buildDashboard(companyId: string, filter: PeriodFilter = {}): Promise<AnalyticsDashboard> {
    const executive = await this.buildExecutive(companyId, filter);
    const defs = await this.listKpiDefinitions();
    const m = await this.computeMetrics(companyId, filter);

    const values: Record<string, number> = {
      revenue_daily: m.revenueDay,
      revenue_monthly: m.revenueMonth,
      revenue_yearly: m.revenueYear,
      avg_ticket: m.avgTicket,
      profit: m.profit,
      mrr: m.mrr,
      arr: Math.round(m.mrr * 12 * 100) / 100,
      cash_available: executive.cashAvailable,
      delinquency: m.delinquency,
      delinquency_rate:
        m.delinquencyOpen > 0
          ? Math.round((m.delinquency / m.delinquencyOpen) * 1000) / 10
          : 0,
      cashflow: Math.round((m.revenueMonth - m.expenses) * 100) / 100,
      roi: 0,
      conversion: m.conversion,
      cac: 0,
      ltv: m.avgTicket > 0 ? Math.round(m.avgTicket * 12 * 100) / 100 : 0,
      churn: m.churn,
      leads: m.leads,
      enrollments: m.enrollments,
      cancellations: m.cancellations,
      renewal_rate: Math.max(0, 100 - m.churn),
      checkins: m.checkins,
      frequency: m.frequency,
      occupancy: m.occupancy,
      no_show: 0,
      teachers_active: 0,
      classes_count: 0,
      peak_hour: 0,
      avg_stay_minutes: 0,
      avg_age: 0,
      top_plan: 0,
      revenue_teacher: 0,
      revenue_modality: 0,
      workouts_completed: 0,
      avg_evolution: 0,
      active_users: m.activeStudents,
      engagement_rate: m.frequency > 0 ? Math.min(100, m.frequency * 10) : 0,
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
                  : d.code === 'cancellations'
                    ? deltaPercent(m.cancellations, m.prevCancellations)
                    : null,
    }));

    const byCategory: Record<string, KpiItem[]> = {};
    for (const k of kpis) {
      byCategory[k.category] = byCategory[k.category] || [];
      byCategory[k.category].push(k);
    }

    return { executive, kpis, byCategory };
  }

  async monthlyRevenueSeries(companyId: string, months = 6): Promise<number[]> {
    const series: number[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0));
      const from = start.toISOString().slice(0, 10);
      const to = end.toISOString().slice(0, 10);
      const fact = await this.sumRevenue(companyId, from, to);
      if (fact.gross > 0) series.push(fact.gross);
      else series.push(await this.oltpPaidRevenue(companyId, from, to));
    }
    return series;
  }

  async monthlyCancellationSeries(companyId: string, months = 6): Promise<number[]> {
    const series: number[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0));
      const from = start.toISOString().slice(0, 10);
      const to = end.toISOString().slice(0, 10);
      const s = await this.oltpStudentCounts(companyId, from, to);
      series.push(s.cancelled);
    }
    return series;
  }

  async monthlyEnrollmentSeries(companyId: string, months = 6): Promise<number[]> {
    const series: number[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0));
      const from = start.toISOString().slice(0, 10);
      const to = end.toISOString().slice(0, 10);
      const s = await this.oltpStudentCounts(companyId, from, to);
      series.push(s.created);
    }
    return series;
  }

  async checkinHourHeatmap(companyId: string) {
    const from = daysAgo(30);
    const { data } = await this.admin()
      .from('checkins')
      .select('checked_in_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('checked_in_at', `${from}T00:00:00.000Z`);
    const hours = Array.from({ length: 24 }, () => 0);
    for (const r of data || []) {
      const h = new Date(String(r.checked_in_at)).getHours();
      hours[h] += 1;
    }
    return hours.map((value, hour) => ({
      key: String(hour),
      label: `${String(hour).padStart(2, '0')}h`,
      value,
    }));
  }

  async checkinDayHeatmap(companyId: string) {
    const from = daysAgo(30);
    const { data } = await this.admin()
      .from('checkins')
      .select('checked_in_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('checked_in_at', `${from}T00:00:00.000Z`);
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const counts = Array.from({ length: 7 }, () => 0);
    for (const r of data || []) {
      counts[new Date(String(r.checked_in_at)).getDay()] += 1;
    }
    return counts.map((value, i) => ({ key: String(i), label: days[i], value }));
  }

  async modalityHeatmap(companyId: string) {
    const from = daysAgo(30);
    const { data: schedules } = await this.admin()
      .from('schedules')
      .select('id, title, type')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('start_at', `${from}T00:00:00.000Z`);
    const map = new Map<string, number>();
    for (const s of schedules || []) {
      const key = String(s.type || s.title || 'outro');
      const { count } = await this.admin()
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', String(s.id))
        .in('status', ['reserved', 'checked_in'])
        .is('deleted_at', null);
      map.set(key, (map.get(key) || 0) + (count || 0));
    }
    return [...map.entries()]
      .map(([key, value]) => ({ key, label: key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }

  async teacherBenchmark(companyId: string) {
    const from = daysAgo(30);
    const { data: schedules } = await this.admin()
      .from('schedules')
      .select('id, teacher_id, title')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .not('teacher_id', 'is', null)
      .gte('start_at', `${from}T00:00:00.000Z`);
    const map = new Map<string, { label: string; value: number }>();
    for (const s of schedules || []) {
      const tid = String(s.teacher_id);
      const { count } = await this.admin()
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', String(s.id))
        .in('status', ['reserved', 'checked_in'])
        .is('deleted_at', null);
      const prev = map.get(tid) || { label: tid.slice(0, 8), value: 0 };
      prev.value += count || 0;
      map.set(tid, prev);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, label: v.label, value: v.value }))
      .sort((a, b) => b.value - a.value)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  }

  async planBenchmark(companyId: string) {
    const { data } = await this.admin()
      .from('enrollments')
      .select('plan_id, plans(name)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .limit(500);
    const map = new Map<string, { label: string; value: number }>();
    for (const r of data || []) {
      const pid = String((r as Record<string, unknown>).plan_id || 'unknown');
      const plans = (r as Record<string, unknown>).plans as { name?: string } | null;
      const label = plans?.name || pid.slice(0, 8);
      const prev = map.get(pid) || { label, value: 0 };
      prev.value += 1;
      map.set(pid, prev);
    }
    return [...map.entries()]
      .map(([id, v]) => ({ id, label: v.label, value: v.value }))
      .sort((a, b) => b.value - a.value)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  }

  async listCampaigns(companyId: string) {
    const { data } = await this.admin()
      .from('campaigns')
      .select('id, name, budget, goal_value, status, starts_at, ends_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    return data || [];
  }

  async listOverdueStudents(companyId: string, limit = 20) {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await this.admin()
      .from('receivables')
      .select('student_id, amount, due_date, students(full_name)')
      .eq('company_id', companyId)
      .in('status', ['open', 'overdue'])
      .lt('due_date', today)
      .is('deleted_at', null)
      .limit(limit);
    return (data || []).map((r) => {
      const students = (r as Record<string, unknown>).students as { full_name?: string } | null;
      return {
        studentId: String(r.student_id),
        name: students?.full_name || String(r.student_id).slice(0, 8),
        amount: Number(r.amount || 0),
        dueDate: String(r.due_date),
      };
    });
  }

  async studentsWithoutCheckin(companyId: string, days: number) {
    const cutoff = daysAgo(days);
    const { data: students } = await this.admin()
      .from('students')
      .select('id, full_name')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(100);
    const result: Array<{ id: string; name: string }> = [];
    for (const s of students || []) {
      const { data: last } = await this.admin()
        .from('checkins')
        .select('checked_in_at')
        .eq('company_id', companyId)
        .eq('student_id', String(s.id))
        .is('deleted_at', null)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!last || String(last.checked_in_at) < `${cutoff}T00:00:00.000Z`) {
        result.push({ id: String(s.id), name: String(s.full_name) });
      }
    }
    return result;
  }

  async topTeacherByStudents(companyId: string) {
    const items = await this.teacherBenchmark(companyId);
    return items[0] || null;
  }

  async topPlan(companyId: string) {
    const items = await this.planBenchmark(companyId);
    return items[0] || null;
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
    try {
      const { data, error } = await this.admin()
        .schema('analytics')
        .from(table)
        .select('*')
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .limit(500);
      if (error) {
        return this.oltpExportFallback(source, companyId);
      }
      return (data || []) as Record<string, unknown>[];
    } catch {
      return this.oltpExportFallback(source, companyId);
    }
  }

  private async oltpExportFallback(source: string, companyId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const from = daysAgo(30);
    if (source === 'revenue') {
      const gross = await this.oltpPaidRevenue(companyId, from, today);
      const expenses = await this.oltpPaidExpenses(companyId, from, today);
      return [
        {
          date: today,
          gross_revenue: gross,
          net_revenue: gross,
          expenses,
          profit: gross - expenses,
        },
      ];
    }
    if (source === 'checkins') {
      const checkins = await this.oltpCheckinCount(companyId, from, today);
      return [{ date: today, unit_id: null, checkins, duration_minutes: checkins * 60 }];
    }
    if (source === 'sales') {
      const leads = await this.oltpLeadsStats(companyId, from, today);
      return [
        {
          date: today,
          pipeline: 'crm',
          converted: leads.converted > 0,
          amount: 0,
          leads: leads.leads,
        },
      ];
    }
    return [{ date: today, completed: 0, load_kg: 0, calories: 0 }];
  }

  /** Real ETL: aggregate OLTP into analytics facts for last 30 days */
  async upsertDailyFacts(companyId: string) {
    const facts: string[] = [];
    const today = new Date();

    try {
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        const date = d.toISOString().slice(0, 10);

        const [gross, expenses, checkins] = await Promise.all([
          this.oltpPaidRevenue(companyId, date, date),
          this.oltpPaidExpenses(companyId, date, date),
          this.oltpCheckinCount(companyId, date, date),
        ]);
        const profit = gross - expenses;

        const { data: existingRev, error: revReadErr } = await this.admin()
          .schema('analytics')
          .from('fact_revenue')
          .select('id')
          .eq('company_id', companyId)
          .eq('date', date)
          .is('unit_id', null)
          .maybeSingle();
        if (revReadErr) throw revReadErr;

        if (existingRev) {
          await this.admin()
            .schema('analytics')
            .from('fact_revenue')
            .update({
              gross_revenue: gross,
              net_revenue: gross,
              expenses,
              profit,
            })
            .eq('id', existingRev.id);
        } else {
          await this.admin().schema('analytics').from('fact_revenue').insert({
            date,
            company_id: companyId,
            unit_id: null,
            gross_revenue: gross,
            net_revenue: gross,
            expenses,
            profit,
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

        if (existingCheck) {
          await this.admin()
            .schema('analytics')
            .from('fact_checkins')
            .update({ checkins, duration_minutes: checkins * 60 })
            .eq('id', existingCheck.id);
        } else {
          await this.admin().schema('analytics').from('fact_checkins').insert({
            date,
            company_id: companyId,
            unit_id: null,
            student_id: null,
            checkins,
            duration_minutes: checkins * 60,
          });
        }

        const leads = await this.oltpLeadsStats(companyId, date, date);
        await this.admin()
          .schema('analytics')
          .from('fact_sales')
          .delete()
          .eq('company_id', companyId)
          .eq('date', date);
        if (leads.leads > 0) {
          await this.admin().schema('analytics').from('fact_sales').insert({
            date,
            company_id: companyId,
            unit_id: null,
            pipeline: 'crm',
            converted: leads.converted > 0,
            amount: 0,
          });
        }
      }

      facts.push('fact_revenue', 'fact_checkins', 'fact_sales');
      return facts;
    } catch {
      // Schema analytics may not be exposed on PostgREST — KPIs still use OLTP fallback.
      return ['oltp_fallback'];
    }
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

  async getLastCheckinsByStudents(companyId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, string>();
    const { data } = await this.admin()
      .from('checkins')
      .select('student_id, checked_in_at')
      .eq('company_id', companyId)
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .order('checked_in_at', { ascending: false });
    const map = new Map<string, string>();
    for (const r of data || []) {
      const sid = String((r as Record<string, unknown>).student_id);
      if (!map.has(sid)) map.set(sid, String((r as Record<string, unknown>).checked_in_at));
    }
    return map;
  }

  async getCheckinCount30dByStudents(companyId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, number>();
    const from = daysAgo(30);
    const { data } = await this.admin()
      .from('checkins')
      .select('student_id')
      .eq('company_id', companyId)
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .gte('checked_in_at', `${from}T00:00:00.000Z`);
    const map = new Map<string, number>();
    for (const r of data || []) {
      const sid = String((r as Record<string, unknown>).student_id);
      map.set(sid, (map.get(sid) || 0) + 1);
    }
    return map;
  }

  async getOverdueCountByStudents(companyId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, number>();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await this.admin()
      .from('receivables')
      .select('student_id')
      .eq('company_id', companyId)
      .in('student_id', studentIds)
      .lt('due_date', today)
      .in('status', ['open', 'overdue'])
      .is('deleted_at', null);
    const map = new Map<string, number>();
    for (const r of data || []) {
      const sid = String((r as Record<string, unknown>).student_id);
      map.set(sid, (map.get(sid) || 0) + 1);
    }
    return map;
  }

  async getLastAssessmentsByStudents(companyId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, string>();
    const { data } = await this.admin()
      .from('assessments')
      .select('student_id, created_at')
      .eq('company_id', companyId)
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    const map = new Map<string, string>();
    for (const r of data || []) {
      const sid = String((r as Record<string, unknown>).student_id);
      if (!map.has(sid)) map.set(sid, String((r as Record<string, unknown>).created_at));
    }
    return map;
  }

  async getLastWorkoutsByStudents(companyId: string, studentIds: string[]) {
    if (!studentIds.length) return new Map<string, string>();
    const { data } = await this.admin()
      .from('student_workout_sessions')
      .select('student_id, completed_at')
      .eq('company_id', companyId)
      .in('student_id', studentIds)
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });
    const map = new Map<string, string>();
    for (const r of data || []) {
      const sid = String((r as Record<string, unknown>).student_id);
      if (!map.has(sid)) map.set(sid, String((r as Record<string, unknown>).completed_at));
    }
    return map;
  }

  async listGoals(companyId: string) {
    const { data, error } = await this.admin()
      .from('bi_goals')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('period_end', { ascending: false });
    if (error) {
      if (String(error.message || '').includes('bi_goals') || error.code === '42P01' || error.code === 'PGRST205') {
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async createGoal(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('bi_goals').insert(row).select('*').single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async listAlerts(companyId: string) {
    const { data, error } = await this.admin()
      .from('bi_alerts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      if (String(error.message || '').includes('bi_alerts') || error.code === '42P01' || error.code === 'PGRST205') {
        return [];
      }
      throw error;
    }
    return (data || []).map((r) => this.mapAlert(r as Record<string, unknown>));
  }

  async insertAlerts(rows: Record<string, unknown>[]) {
    if (!rows.length) return [];
    const { data, error } = await this.admin().from('bi_alerts').insert(rows).select('*');
    if (error) {
      if (String(error.message || '').includes('bi_alerts') || error.code === '42P01' || error.code === 'PGRST205') {
        return [];
      }
      throw error;
    }
    return (data || []).map((r) => this.mapAlert(r as Record<string, unknown>));
  }

  async markAlertRead(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('bi_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapAlert(data as Record<string, unknown>) : null;
  }

  async listConnectors(companyId: string) {
    const { data, error } = await this.admin()
      .from('bi_export_connectors')
      .select('*')
      .eq('company_id', companyId);
    if (error) {
      if (
        String(error.message || '').includes('bi_export_connectors') ||
        error.code === '42P01' ||
        error.code === 'PGRST205'
      ) {
        return [];
      }
      throw error;
    }
    return (data || []).map((r) => this.mapConnector(r as Record<string, unknown>));
  }

  async ensureConnectors(companyId: string) {
    try {
      const existing = await this.listConnectors(companyId);
      const providers = ['powerbi', 'looker'];
      for (const provider of providers) {
        if (!existing.find((c) => c.provider === provider)) {
          const { error } = await this.admin().from('bi_export_connectors').insert({
            company_id: companyId,
            provider,
            status: 'not_configured',
            config: { llm: 'not_configured', note: 'Stub G-12 — configure OAuth later' },
          });
          if (error) throw error;
        }
      }
      return this.listConnectors(companyId);
    } catch {
      return [
        {
          id: 'stub-powerbi',
          companyId,
          provider: 'powerbi',
          status: 'not_configured',
          config: { note: 'Apply migration 20260806_0002_bi_g12.sql' },
          lastSyncAt: null,
        },
        {
          id: 'stub-looker',
          companyId,
          provider: 'looker',
          status: 'not_configured',
          config: { note: 'Apply migration 20260806_0002_bi_g12.sql' },
          lastSyncAt: null,
        },
      ];
    }
  }

  async fullSchedulesToday(companyId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: schedules } = await this.admin()
      .from('schedules')
      .select('id, title, max_capacity, teacher_id')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('start_at', `${today}T00:00:00.000Z`)
      .lte('start_at', `${today}T23:59:59.999Z`);
    const full: Array<{ id: string; title: string; occupancy: number }> = [];
    const teacherLoad = new Map<string, number>();
    for (const s of schedules || []) {
      const { count } = await this.admin()
        .from('class_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', String(s.id))
        .in('status', ['reserved', 'checked_in'])
        .is('deleted_at', null);
      const cap = Number(s.max_capacity || 1);
      const occ = Math.round(((count || 0) / cap) * 1000) / 10;
      if (occ >= 95) full.push({ id: String(s.id), title: String(s.title), occupancy: occ });
      if (s.teacher_id) {
        const tid = String(s.teacher_id);
        teacherLoad.set(tid, (teacherLoad.get(tid) || 0) + 1);
      }
    }
    const overloaded = [...teacherLoad.entries()].filter(([, n]) => n >= 6).map(([id, n]) => ({ id, count: n }));
    return { full, overloaded };
  }
}
