import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  AuthContext,
  DashboardActivity,
  DashboardActivityKind,
  DashboardAgendaItem,
  DashboardAlert,
  DashboardBirthday,
  DashboardChartPeriod,
  DashboardChartPoint,
  DashboardCommercialSnapshot,
  DashboardDaySummary,
  DashboardFinanceSnapshot,
  DashboardGoal,
  DashboardKpi,
  DashboardLayoutItem,
  DashboardRankingRow,
  CommandDashboard,
} from '@movvo/shared';
import { layoutForPreset, resolveDashboardPreset } from '@movvo/shared';
import { RedisCacheService } from '../cache/redis-cache.service';
import { SupabaseService } from '../supabase/supabase.service';
import { DashboardRepository } from './dashboard.repository';
import {
  activityKindFromAudit,
  greetingForHour,
  goalProgress,
  percentDelta,
} from './dashboard.rules';

@Injectable()
export class DashboardService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly repo: DashboardRepository,
    private readonly cache: RedisCacheService,
  ) {}

  private companyId(auth: AuthContext) {
    const id = auth.companyId;
    if (!id) throw new BadRequestException('Empresa não definida na sessão');
    return id;
  }

  private admin() {
    return this.supabase.getAdmin();
  }

  async getExecutive(
    auth: AuthContext,
    opts?: { period?: DashboardChartPeriod; firstName?: string },
  ): Promise<CommandDashboard> {
    const companyId = this.companyId(auth);
    const period = opts?.period || '30d';
    const firstName = opts?.firstName || 'gestor';
    const cacheKey = this.cache.key(companyId, 'dashboard', `exec:${period}:${firstName}`);
    return this.cache.wrap(cacheKey, RedisCacheService.TTL.dashboard, () =>
      this.buildExecutive(auth, { period, firstName }),
    );
  }

  private async buildExecutive(
    auth: AuthContext,
    opts: { period: DashboardChartPeriod; firstName: string },
  ): Promise<CommandDashboard> {
    const companyId = this.companyId(auth);
    const period = opts.period;
    const firstName = opts.firstName;
    const [
      kpis,
      revenueChart,
      checkinChart,
      agenda,
      activities,
      dues,
      birthdays,
      ranking,
      savedLayout,
      extras,
    ] = await Promise.all([
      this.getKpis(auth),
      this.getRevenueChart(auth, period),
      this.getCheckinChart(auth),
      this.getAgenda(auth),
      this.getActivities(auth),
      this.getDues(auth),
      this.getBirthdays(auth),
      this.getRanking(auth),
      this.repo.getLayout(companyId, auth.userId),
      this.getDayExtras(auth),
    ]);

    const goals = this.buildGoals(kpis);
    const hour = new Date().getHours();
    const greeting = greetingForHour(hour, firstName);
    const daySummary = this.buildDaySummary(greeting, kpis, dues, birthdays, agenda, extras);
    const alerts = this.buildAlerts(dues, goals, extras, agenda);
    const financeSnapshot = extras.finance;
    const commercialSnapshot = extras.commercial;
    const layout = layoutForPreset(resolveDashboardPreset(auth.roles || []), savedLayout);

    const dueToday = dues.dueToday;
    const hint =
      dueToday > 0
        ? `Hoje existem ${dueToday} mensalidades vencendo.`
        : 'Bom trabalho! Acompanhe os indicadores abaixo.';

    return {
      greetingHint: `${greeting} · ${hint}`,
      daySummary,
      alerts,
      kpis,
      revenueChart,
      checkinChart,
      agenda,
      activities,
      dues,
      birthdays,
      goals,
      ranking,
      financeSnapshot,
      commercialSnapshot,
      layout,
      generatedAt: new Date().toISOString(),
    };
  }

  async getKpis(auth: AuthContext): Promise<DashboardKpi[]> {
    const companyId = this.companyId(auth);
    const admin = this.admin();
    const start = startOfDay();
    const end = endOfDay();
    const monthStart = startOfMonth();
    const prevMonthStart = startOfPrevMonth();
    const prevMonthEnd = new Date(monthStart.getTime() - 1);
    const today = dateKey(start);
    const yesterdayStart = new Date(start);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(end);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const [
      revenueMonth,
      revenuePrev,
      revenueDay,
      activeStudents,
      newStudents,
      checkins,
      checkinsPrev,
      overdue,
      overduePrev,
      assessmentsPending,
      enrollmentsMonth,
      enrollmentsPrev,
      cancellations,
    ] = await Promise.all([
      sumPaid(admin, companyId, monthStart.toISOString(), end.toISOString()),
      sumPaid(admin, companyId, prevMonthStart.toISOString(), prevMonthEnd.toISOString()),
      sumPaid(admin, companyId, start.toISOString(), end.toISOString()),
      admin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('status', 'active'),
      admin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      admin
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      admin
        .from('checkins')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', yesterdayStart.toISOString())
        .lte('created_at', yesterdayEnd.toISOString()),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .or(`status.eq.overdue,and(status.eq.open,due_date.lt.${today})`),
      countOverdueAt(admin, companyId, dateKey(prevMonthEnd)),
      admin
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('type', 'assessment')
        .gte('start_at', start.toISOString()),
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', monthStart.toISOString()),
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', prevMonthStart.toISOString())
        .lte('created_at', prevMonthEnd.toISOString()),
      admin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('status', 'cancelled')
        .gte('updated_at', monthStart.toISOString()),
    ]);

    const cash = await admin
      .from('cash_movements')
      .select('amount, direction')
      .eq('company_id', companyId)
      .eq('movement_date', today);
    const cashToday = (cash.data || []).reduce((sum, row) => {
      const amount = Number(row.amount) || 0;
      return row.direction === 'out' ? sum - amount : sum + amount;
    }, 0);

    const rev = revenueMonth;
    const revDelta = percentDelta(rev, revenuePrev);
    const active = activeStudents.count || 0;
    const enrollments = enrollmentsMonth.count || 0;
    const ticket = active > 0 ? rev / active : 0;
    const ticketPrev = active > 0 ? revenuePrev / active : 0;
    const checkinCount = checkins.count || 0;
    const overdueCount = overdue.count || 0;

    return [
      {
        id: 'revenue_month',
        label: 'Receita',
        value: rev,
        format: 'currency',
        delta: revDelta,
        deltaLabel: 'comparado ao mês passado',
        href: '/app/finance',
        tone: 'gold',
      },
      {
        id: 'revenue_day',
        label: 'Receita do dia',
        value: revenueDay,
        format: 'currency',
        href: '/app/finance/receivables',
        tone: 'gold',
      },
      {
        id: 'active_students',
        label: 'Alunos ativos',
        value: active,
        format: 'number',
        href: '/app/alunos',
        tone: 'blue',
      },
      {
        id: 'new_students',
        label: 'Novos alunos',
        value: newStudents.count || 0,
        format: 'number',
        deltaLabel: 'Hoje',
        href: '/app/alunos',
        tone: 'blue',
      },
      {
        id: 'checkins',
        label: 'Check-ins',
        value: checkinCount,
        format: 'number',
        delta: percentDelta(checkinCount, checkinsPrev.count || 0),
        deltaLabel: 'comparado a ontem',
        href: '/app/operations/checkin',
        tone: 'red',
      },
      {
        id: 'overdue',
        label: 'Inadimplência',
        value: overdueCount,
        format: 'number',
        delta: percentDelta(overdueCount, overduePrev),
        deltaLabel: 'comparado ao mês passado',
        href: '/app/finance/receivables',
        tone: 'orange',
      },
      {
        id: 'cash',
        label: 'Caixa hoje',
        value: cashToday,
        format: 'currency',
        href: '/app/finance/cashflow',
        tone: 'green',
      },
      {
        id: 'assessments',
        label: 'Avaliações pendentes',
        value: assessmentsPending.count || 0,
        format: 'number',
        href: '/app/workouts/assessments',
        tone: 'orange',
      },
      {
        id: 'enrollments',
        label: 'Matrículas',
        value: enrollments,
        format: 'number',
        delta: percentDelta(enrollments, enrollmentsPrev.count || 0),
        deltaLabel: 'comparado ao mês passado',
        href: '/app/sales/enrollments',
        tone: 'green',
      },
      {
        id: 'cancellations',
        label: 'Cancelamentos',
        value: cancellations.count || 0,
        format: 'number',
        href: '/app/alunos',
        tone: 'muted',
      },
      {
        id: 'ticket',
        label: 'Ticket médio',
        value: Number(ticket.toFixed(2)),
        format: 'currency',
        delta: percentDelta(ticket, ticketPrev),
        deltaLabel: 'comparado ao mês passado',
        href: '/app/finance',
        tone: 'gold',
      },
    ];
  }

  async getRevenueChart(auth: AuthContext, period: DashboardChartPeriod): Promise<DashboardChartPoint[]> {
    const companyId = this.companyId(auth);
    const admin = this.admin();
    const { keys, startIso } = periodKeys(period);

    const [{ data: paid }, { data: expenses }] = await Promise.all([
      admin
        .from('receivables')
        .select('amount, paid_at')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .not('paid_at', 'is', null)
        .gte('paid_at', startIso),
      admin
        .from('cash_movements')
        .select('amount, movement_date, direction')
        .eq('company_id', companyId)
        .eq('direction', 'out')
        .gte('movement_date', startIso.slice(0, 10)),
    ]);

    const revMap = new Map(keys.map((k) => [k, 0]));
    const expMap = new Map(keys.map((k) => [k, 0]));

    for (const row of paid || []) {
      const key = bucketKey(String(row.paid_at), period);
      if (revMap.has(key)) revMap.set(key, (revMap.get(key) || 0) + (Number(row.amount) || 0));
    }
    for (const row of expenses || []) {
      const key = bucketKey(String(row.movement_date), period);
      if (expMap.has(key)) expMap.set(key, (expMap.get(key) || 0) + (Number(row.amount) || 0));
    }

    const monthTarget = Math.max(
      [...revMap.values()].reduce((a, b) => a + b, 0) * 1.1,
      1000,
    );
    const perBucketGoal = monthTarget / Math.max(keys.length, 1);

    return keys.map((label) => {
      const revenue = revMap.get(label) || 0;
      const expense = expMap.get(label) || 0;
      return {
        label,
        revenue,
        expense,
        profit: revenue - expense,
        goal: Number(perBucketGoal.toFixed(2)),
      };
    });
  }

  async getCheckinChart(auth: AuthContext): Promise<DashboardChartPoint[]> {
    const companyId = this.companyId(auth);
    const admin = this.admin();
    const start = startOfWeekMonday();
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const keys: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      keys.push(dateKey(d));
    }
    const { data } = await admin
      .from('checkins')
      .select('created_at')
      .eq('company_id', companyId)
      .gte('created_at', start.toISOString());

    const map = new Map(keys.map((k) => [k, 0]));
    for (const row of data || []) {
      const key = String(row.created_at).slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    }
    return keys.map((k, i) => ({ label: labels[i], value: map.get(k) || 0 }));
  }

  async getAgenda(auth: AuthContext): Promise<DashboardAgendaItem[]> {
    const companyId = this.companyId(auth);
    const { data } = await this.admin()
      .from('schedules')
      .select('id, start_at, title, type')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .gte('start_at', startOfDay().toISOString())
      .lte('start_at', endOfDay().toISOString())
      .order('start_at', { ascending: true })
      .limit(12);

    return (data || []).map((row) => ({
      id: row.id as string,
      startAt: row.start_at as string,
      title: (row.title as string) || 'Compromisso',
      type: (row.type as string) || 'other',
      href: '/app/operations/agenda',
    }));
  }

  async getActivities(auth: AuthContext): Promise<DashboardActivity[]> {
    const companyId = this.companyId(auth);
    const { data } = await this.admin()
      .from('audit_logs')
      .select('id, created_at, module, action, entity, entity_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(15);

    return (data || []).map((row) => {
      const module = String(row.module || '');
      const action = String(row.action || '');
      const kind = activityKindFromAudit(module, action) as DashboardActivityKind;
      return {
        id: row.id as string,
        at: row.created_at as string,
        title: humanActivityTitle(module, action, row.entity as string | null),
        subtitle: row.entity ? String(row.entity) : null,
        href: row.entity === 'student' && row.entity_id ? `/app/alunos/${row.entity_id}` : undefined,
        kind,
        actorName: null,
        photoUrl: null,
      };
    });
  }

  async getDues(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const admin = this.admin();
    const today = dateKey(startOfDay());
    const monthStart = startOfMonth().toISOString();

    const [dueToday, overdue, received] = await Promise.all([
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .in('status', ['open', 'overdue'])
        .eq('due_date', today),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .or(`status.eq.overdue,and(status.eq.open,due_date.lt.${today})`),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .not('paid_at', 'is', null)
        .gte('paid_at', monthStart),
    ]);

    return {
      dueToday: dueToday.count || 0,
      overdue: overdue.count || 0,
      receivedMonth: received.count || 0,
    };
  }

  async getBirthdays(auth: AuthContext): Promise<DashboardBirthday[]> {
    const companyId = this.companyId(auth);
    const start = startOfDay();
    const { data } = await this.admin()
      .from('students')
      .select('id, full_name, birth_date, photo_url')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .not('birth_date', 'is', null)
      .limit(500);

    return (data || [])
      .map((s) => {
        const birth = String(s.birth_date);
        const bd = birth.slice(5);
        let next = new Date(`${start.getFullYear()}-${bd}T12:00:00`);
        if (next < start) next = new Date(`${start.getFullYear() + 1}-${bd}T12:00:00`);
        const daysUntil = Math.round((next.getTime() - start.getTime()) / 86400000);
        const age = ageFromBirth(birth, start);
        return {
          id: s.id as string,
          fullName: s.full_name as string,
          birthDate: birth,
          age,
          daysUntil,
          photoUrl: (s.photo_url as string) || null,
          href: `/app/alunos/${s.id}`,
        };
      })
      .filter((b) => b.daysUntil >= 0 && b.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 8);
  }

  async getGoals(auth: AuthContext): Promise<DashboardGoal[]> {
    const kpis = await this.getKpis(auth);
    return this.buildGoals(kpis);
  }

  async getRanking(auth: AuthContext): Promise<DashboardRankingRow[]> {
    const companyId = this.companyId(auth);
    const admin = this.admin();
    const monthStart = startOfMonth().toISOString();

    const [{ data: workouts }, { data: assessments }] = await Promise.all([
      admin
        .from('workouts')
        .select('trainer_id, student_id, status')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .not('trainer_id', 'is', null)
        .gte('created_at', monthStart)
        .limit(500),
      admin
        .from('assessments')
        .select('trainer_id')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .not('trainer_id', 'is', null)
        .gte('created_at', monthStart)
        .limit(500),
    ]);

    const map = new Map<string, DashboardRankingRow>();
    for (const w of workouts || []) {
      const tid = String(w.trainer_id);
      const row = map.get(tid) || {
        trainerId: tid,
        name: 'Professor',
        students: 0,
        assessments: 0,
        checkins: 0,
        workouts: 0,
      };
      row.workouts += 1;
      if (w.status === 'published' || w.status === 'active') row.students += 1;
      map.set(tid, row);
    }
    for (const a of assessments || []) {
      const tid = String(a.trainer_id);
      const row = map.get(tid) || {
        trainerId: tid,
        name: 'Professor',
        students: 0,
        assessments: 0,
        checkins: 0,
        workouts: 0,
      };
      row.assessments += 1;
      map.set(tid, row);
    }

    const ids = [...map.keys()];
    if (ids.length) {
      const { data: profiles } = await admin.from('profiles').select('id, full_name').in('id', ids);
      for (const p of profiles || []) {
        const row = map.get(p.id as string);
        if (row) row.name = (p.full_name as string) || row.name;
      }
    }

    return [...map.values()]
      .sort((a, b) => b.workouts + b.assessments - (a.workouts + a.assessments))
      .slice(0, 5);
  }

  getLayout(auth: AuthContext) {
    return this.repo.getLayout(this.companyId(auth), auth.userId).then((saved) =>
      layoutForPreset(resolveDashboardPreset(auth.roles || []), saved),
    );
  }

  saveLayout(auth: AuthContext, layout: DashboardLayoutItem[]) {
    return this.repo.saveLayout(this.companyId(auth), auth.userId, layout);
  }

  private buildGoals(kpis: DashboardKpi[]): DashboardGoal[] {
    const revenue = kpis.find((k) => k.id === 'revenue_month')?.value || 0;
    const checkins = kpis.find((k) => k.id === 'checkins')?.value || 0;
    const enrollments = kpis.find((k) => k.id === 'enrollments')?.value || 0;
    const revenueTarget = Math.max(10000, Math.round(revenue * 1.2) || 10000);
    return [
      {
        id: 'goal_revenue',
        label: 'Meta Receita',
        current: revenue,
        target: revenueTarget,
        format: 'currency',
      },
      {
        id: 'goal_checkins',
        label: 'Meta Check-ins (dia)',
        current: checkins,
        target: Math.max(checkins + 20, 50),
        format: 'number',
      },
      {
        id: 'goal_enrollments',
        label: 'Meta Matrículas',
        current: enrollments,
        target: Math.max(enrollments + 5, 10),
        format: 'number',
      },
    ];
  }

  private buildDaySummary(
    greeting: string,
    kpis: DashboardKpi[],
    dues: { dueToday: number },
    birthdays: DashboardBirthday[],
    agenda: DashboardAgendaItem[],
    extras: DayExtras,
  ): DashboardDaySummary {
    const assessmentsToday = agenda.filter((a) => a.type === 'assessment').length;
    const birthdaysToday = birthdays.filter((b) => b.daysUntil === 0).length;
    const items = [
      {
        id: 'enrollments_today',
        label: 'matrículas previstas',
        value: extras.enrollmentsToday,
        href: '/app/sales/enrollments',
        tone: 'info' as const,
      },
      {
        id: 'payments_today',
        label: 'pagamentos para receber',
        value: dues.dueToday,
        href: '/app/finance/receivables',
        tone: dues.dueToday > 0 ? ('warn' as const) : ('default' as const),
      },
      {
        id: 'assessments_today',
        label: 'avaliações agendadas',
        value: assessmentsToday,
        href: '/app/workouts/assessments',
        tone: 'info' as const,
      },
      {
        id: 'birthdays_today',
        label: 'aluno aniversariando',
        value: birthdaysToday,
        href: '/app/alunos',
        tone: birthdaysToday > 0 ? ('success' as const) : ('default' as const),
      },
    ].filter((i) => typeof i.value === 'number' && i.value > 0);

    return {
      greeting,
      items,
      forecastRevenue: extras.forecastRevenue,
    };
  }

  private buildAlerts(
    dues: { dueToday: number; overdue: number },
    goals: DashboardGoal[],
    extras: DayExtras,
    agenda: DashboardAgendaItem[],
  ): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    if (dues.dueToday > 0) {
      alerts.push({
        id: 'dues_today',
        severity: 'critical',
        title: `${dues.dueToday} mensalidade${dues.dueToday > 1 ? 's' : ''} vencem hoje`,
        href: '/app/finance/receivables',
      });
    }
    if (dues.overdue > 0) {
      alerts.push({
        id: 'dues_overdue',
        severity: 'critical',
        title: `${dues.overdue} mensalidade${dues.overdue > 1 ? 's' : ''} em atraso`,
        href: '/app/finance/receivables',
      });
    }
    if (extras.contractsExpiringTomorrow > 0) {
      alerts.push({
        id: 'contracts_tomorrow',
        severity: 'warning',
        title: `${extras.contractsExpiringTomorrow} contrato${extras.contractsExpiringTomorrow > 1 ? 's' : ''} vencem amanhã`,
        href: '/app/sales/enrollments',
      });
    }
    if (extras.trainersWithoutAgenda > 0) {
      alerts.push({
        id: 'trainer_no_agenda',
        severity: 'warning',
        title: `${extras.trainersWithoutAgenda} professor${extras.trainersWithoutAgenda > 1 ? 'es' : ''} sem agenda`,
        href: '/app/operations/agenda',
      });
    }
    const revenueGoal = goals.find((g) => g.id === 'goal_revenue');
    if (revenueGoal) {
      const pct = goalProgress(revenueGoal.current, revenueGoal.target);
      if (pct < 60) {
        alerts.push({
          id: 'revenue_goal_low',
          severity: 'warning',
          title: `Meta de receita abaixo de 60% (${pct}%)`,
          href: '/app/finance',
        });
      }
    }
    if (agenda.length === 0) {
      alerts.push({
        id: 'agenda_empty',
        severity: 'info',
        title: 'Nenhum compromisso na agenda de hoje',
        href: '/app/operations/agenda',
      });
    }
    return alerts.slice(0, 8);
  }

  private async getDayExtras(auth: AuthContext): Promise<DayExtras> {
    const empty: DayExtras = {
      enrollmentsToday: 0,
      forecastRevenue: 0,
      contractsExpiringTomorrow: 0,
      trainersWithoutAgenda: 0,
      finance: { inflows: 0, outflows: 0, balance: 0 },
      commercial: { newStudents: 0, cancellations: 0, conversionRate: 0 },
    };
    try {
      return await this.fetchDayExtras(auth);
    } catch {
      return empty;
    }
  }

  private async fetchDayExtras(auth: AuthContext): Promise<DayExtras> {
    const companyId = this.companyId(auth);
    const admin = this.admin();
    const start = startOfDay();
    const end = endOfDay();
    const today = dateKey(start);
    const tomorrow = dateKey(new Date(start.getTime() + 86400000));
    const monthStart = startOfMonth();
    const monthKey = dateKey(monthStart);

    const [
      enrollmentsToday,
      forecast,
      contractsTomorrow,
      newStudentsMonth,
      cancellationsMonth,
      cashMonth,
      trainers,
      agendaTrainers,
    ] = await Promise.all([
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      admin
        .from('receivables')
        .select('amount')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .in('status', ['open', 'overdue'])
        .eq('due_date', today),
      admin
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('end_date', tomorrow),
      admin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('created_at', monthStart.toISOString()),
      admin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .eq('status', 'cancelled')
        .gte('updated_at', monthStart.toISOString()),
      admin
        .from('cash_movements')
        .select('amount, direction')
        .eq('company_id', companyId)
        .gte('movement_date', monthKey),
      admin.from('user_roles').select('profile_id, roles(slug)').eq('company_id', companyId),
      admin
        .from('schedules')
        .select('teacher_id')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .not('teacher_id', 'is', null),
    ]);

    const forecastRevenue = (forecast.data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
    let inflows = 0;
    let outflows = 0;
    for (const row of cashMonth.data || []) {
      const amount = Number(row.amount) || 0;
      if (row.direction === 'out') outflows += amount;
      else inflows += amount;
    }

    const newStudents = newStudentsMonth.count || 0;
    const cancellations = cancellationsMonth.count || 0;
    const denom = newStudents + cancellations;
    const conversionRate = denom > 0 ? Math.round((newStudents / denom) * 100) : newStudents > 0 ? 100 : 0;

    const trainerIds = new Set(
      (trainers.data || [])
        .filter((r) => {
          const raw = r.roles as { slug?: string } | { slug?: string }[] | null;
          const slug = Array.isArray(raw)
            ? String(raw[0]?.slug || '').toLowerCase()
            : String(raw?.slug || '').toLowerCase();
          return slug.includes('trainer') || slug.includes('professor') || slug.includes('personal');
        })
        .map((r) => String(r.profile_id))
        .filter(Boolean),
    );
    const busy = new Set(
      (agendaTrainers.data || []).map((r) => String(r.teacher_id)).filter(Boolean),
    );
    let trainersWithoutAgenda = 0;
    for (const id of trainerIds) {
      if (!busy.has(id)) trainersWithoutAgenda += 1;
    }

    const finance: DashboardFinanceSnapshot = {
      inflows,
      outflows,
      balance: inflows - outflows,
    };
    const commercial: DashboardCommercialSnapshot = {
      newStudents,
      cancellations,
      conversionRate,
    };

    return {
      enrollmentsToday: enrollmentsToday.count || 0,
      forecastRevenue,
      contractsExpiringTomorrow: contractsTomorrow.count || 0,
      trainersWithoutAgenda,
      finance,
      commercial,
    };
  }
}

type DayExtras = {
  enrollmentsToday: number;
  forecastRevenue: number;
  contractsExpiringTomorrow: number;
  trainersWithoutAgenda: number;
  finance: DashboardFinanceSnapshot;
  commercial: DashboardCommercialSnapshot;
};

/* helpers */
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfPrevMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
}
function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfWeekMonday(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}
function ageFromBirth(birth: string, today: Date) {
  const b = new Date(`${birth}T12:00:00`);
  if (Number.isNaN(b.getTime())) return null;
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age -= 1;
  return age;
}

async function sumPaid(
  admin: ReturnType<SupabaseService['getAdmin']>,
  companyId: string,
  fromIso: string,
  toIso: string,
) {
  const { data } = await admin
    .from('receivables')
    .select('amount')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .not('paid_at', 'is', null)
    .gte('paid_at', fromIso)
    .lte('paid_at', toIso);
  return (data || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

async function countOverdueAt(
  admin: ReturnType<SupabaseService['getAdmin']>,
  companyId: string,
  asOfDate: string,
) {
  const { count } = await admin
    .from('receivables')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .or(`status.eq.overdue,and(status.eq.open,due_date.lt.${asOfDate})`);
  return count || 0;
}

function periodKeys(period: DashboardChartPeriod): { keys: string[]; startIso: string } {
  const end = startOfDay();
  if (period === '12m') {
    const keys: string[] = [];
    const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
    for (let i = 0; i < 12; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return { keys, startIso: start.toISOString() };
  }
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const keys: string[] = [];
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(dateKey(d));
  }
  return { keys, startIso: start.toISOString() };
}

function bucketKey(iso: string, period: DashboardChartPeriod) {
  return period === '12m' ? iso.slice(0, 7) : iso.slice(0, 10);
}

function humanActivityTitle(module: string, action: string, entity: string | null): string {
  const kind = activityKindFromAudit(module, action);
  const map: Record<string, string> = {
    checkin: 'Realizou check-in',
    payment: 'Efetuou pagamento',
    enrollment: 'Renovou plano',
    assessment: 'Agendou avaliação',
    workout: 'Atualizou treino',
    student: 'Atualizou aluno',
    other: `${module}: ${action}`,
  };
  const base = map[kind] || `${module}: ${action}`;
  if (entity && kind !== 'other') return base;
  return base;
}
