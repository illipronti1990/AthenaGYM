import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  AuthContext,
  DashboardActivity,
  DashboardAgendaItem,
  DashboardBirthday,
  DashboardChartPeriod,
  DashboardChartPoint,
  DashboardGoal,
  DashboardKpi,
  DashboardLayoutItem,
  DashboardRankingRow,
  CommandDashboard,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { DashboardRepository } from './dashboard.repository';
import { greetingForHour, goalProgress } from './dashboard.rules';

@Injectable()
export class DashboardService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly repo: DashboardRepository,
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
    const [kpis, revenueChart, checkinChart, agenda, activities, dues, birthdays, goals, ranking, layout] =
      await Promise.all([
        this.getKpis(auth),
        this.getRevenueChart(auth, period),
        this.getCheckinChart(auth),
        this.getAgenda(auth),
        this.getActivities(auth),
        this.getDues(auth),
        this.getBirthdays(auth),
        this.getGoals(auth),
        this.getRanking(auth),
        this.repo.getLayout(companyId, auth.userId),
      ]);

    const hour = new Date().getHours();
    const dueToday = dues.dueToday;
    const hint =
      dueToday > 0
        ? `Hoje existem ${dueToday} mensalidades vencendo.`
        : 'Bom trabalho! Acompanhe os indicadores abaixo.';

    return {
      greetingHint: `${greetingForHour(hour, opts?.firstName || 'gestor')} · ${hint}`,
      kpis,
      revenueChart,
      checkinChart,
      agenda,
      activities,
      dues,
      birthdays,
      goals,
      ranking,
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

    const [
      revenueMonth,
      revenuePrev,
      revenueDay,
      activeStudents,
      newStudents,
      checkins,
      overdue,
      assessmentsPending,
      enrollmentsMonth,
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
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .or(`status.eq.overdue,and(status.eq.open,due_date.lt.${today})`),
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

    // Clean slate: receita do mês zerada no dashboard executivo (demo / base limpa).
    void revenueMonth;
    void revenuePrev;
    const rev = 0;
    const revDelta = 0;
    const active = activeStudents.count || 0;
    const ticket = 0;

    return [
      {
        id: 'revenue_month',
        label: 'Receita do mês',
        value: rev,
        format: 'currency',
        delta: revDelta,
        deltaLabel: 'vs mês passado',
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
        href: '/app/students',
        tone: 'blue',
      },
      {
        id: 'new_students',
        label: 'Novos alunos',
        value: newStudents.count || 0,
        format: 'number',
        deltaLabel: 'Hoje',
        href: '/app/students',
        tone: 'blue',
      },
      {
        id: 'checkins',
        label: 'Check-ins',
        value: checkins.count || 0,
        format: 'number',
        deltaLabel: 'Hoje',
        href: '/app/operations/checkin',
        tone: 'red',
      },
      {
        id: 'overdue',
        label: 'Inadimplentes',
        value: overdue.count || 0,
        format: 'number',
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
        label: 'Matrículas do mês',
        value: enrollmentsMonth.count || 0,
        format: 'number',
        href: '/app/sales/enrollments',
        tone: 'green',
      },
      {
        id: 'cancellations',
        label: 'Cancelamentos',
        value: cancellations.count || 0,
        format: 'number',
        href: '/app/students',
        tone: 'muted',
      },
      {
        id: 'ticket',
        label: 'Ticket médio',
        value: ticket,
        format: 'currency',
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
      // Receita do gráfico zerada (mesmo critério do KPI receita do mês).
      void revMap;
      const revenue = 0;
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

    return (data || []).map((row) => ({
      id: row.id as string,
      at: row.created_at as string,
      title: `${row.module}: ${row.action}`,
      subtitle: row.entity ? String(row.entity) : null,
      href: row.entity === 'student' && row.entity_id ? `/app/students/${row.entity_id}` : undefined,
    }));
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
      // Clean slate: recebidas do mês zeradas no dashboard executivo (demo / base limpa).
      receivedMonth: 0,
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
          href: `/app/students/${s.id}`,
        };
      })
      .filter((b) => b.daysUntil >= 0 && b.daysUntil <= 14)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 8);
  }

  async getGoals(auth: AuthContext): Promise<DashboardGoal[]> {
    const kpis = await this.getKpis(auth);
    const revenue = 0;
    const checkins = kpis.find((k) => k.id === 'checkins')?.value || 0;
    const enrollments = kpis.find((k) => k.id === 'enrollments')?.value || 0;
    const revenueTarget = 10000;
    const goals: DashboardGoal[] = [
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
    return goals;
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
      .map((row) => ({
        ...row,
        // Clean slate: treinos do ranking zerados no dashboard executivo (demo / base limpa).
        workouts: 0,
      }))
      .sort((a, b) => b.workouts + b.assessments - (a.workouts + a.assessments))
      .slice(0, 5);
  }

  getLayout(auth: AuthContext) {
    return this.repo.getLayout(this.companyId(auth), auth.userId);
  }

  saveLayout(auth: AuthContext, layout: DashboardLayoutItem[]) {
    return this.repo.saveLayout(this.companyId(auth), auth.userId, layout);
  }
}

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

