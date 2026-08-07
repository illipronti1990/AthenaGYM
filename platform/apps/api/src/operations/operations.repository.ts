import { Injectable } from '@nestjs/common';
import type {
  AccessDevice,
  AccessLiveEvent,
  AccessLog,
  AccessRules,
  AgendaDashboard,
  AgendaKpis,
  AgendaSuggestion,
  Checkin,
  ClassEnrollment,
  Modality,
  OccupancyArea,
  OperationsDashboard,
  OperationsKpis,
  PartnerAccessRequest,
  PartnerHubItem,
  PartnerIntegration,
  PresencePerson,
  PresenceSnapshot,
  Room,
  Schedule,
} from '@movvo/shared';
import { SupabaseService } from '../supabase/supabase.service';

export type ScheduleListFilters = {
  from?: string;
  to?: string;
  type?: string;
  teacherId?: string;
  roomId?: string;
  modalityId?: string;
  unitId?: string | null;
};

@Injectable()
export class OperationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapModality(row: Record<string, unknown>): Modality {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      slug: String(row.slug),
      color: String(row.color || '#0f766e'),
      defaultTeacherId: row.default_teacher_id ? String(row.default_teacher_id) : null,
      defaultRoomId: row.default_room_id ? String(row.default_room_id) : null,
      defaultCapacity: Number(row.default_capacity ?? 20),
      active: Boolean(row.active ?? true),
    };
  }

  mapRoom(row: Record<string, unknown>): Room {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: String(row.unit_id),
      name: String(row.name),
      capacity: Number(row.capacity),
      area: row.area ? String(row.area) : null,
      active: Boolean(row.active),
      equipmentJson: Array.isArray(row.equipment_json) ? (row.equipment_json as unknown[]) : [],
      status: (row.status as Room['status']) || 'active',
    };
  }

  mapSchedule(row: Record<string, unknown>, reserved = 0, waitlist = 0): Schedule {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: String(row.unit_id),
      title: String(row.title),
      type: row.type as Schedule['type'],
      startAt: String(row.start_at),
      endAt: String(row.end_at),
      teacherId: row.teacher_id ? String(row.teacher_id) : null,
      roomId: row.room_id ? String(row.room_id) : null,
      modalityId: row.modality_id ? String(row.modality_id) : null,
      color: row.color ? String(row.color) : null,
      recurrenceRule: row.recurrence_rule ? String(row.recurrence_rule) : null,
      seriesId: row.series_id ? String(row.series_id) : null,
      isBlock: Boolean(row.is_block),
      equipmentNotes: row.equipment_notes ? String(row.equipment_notes) : null,
      maxCapacity: Number(row.max_capacity),
      status: row.status as Schedule['status'],
      notes: row.notes ? String(row.notes) : null,
      reservedCount: reserved,
      waitlistCount: waitlist,
    };
  }

  mapEnrollment(row: Record<string, unknown>): ClassEnrollment {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      scheduleId: String(row.schedule_id),
      studentId: String(row.student_id),
      status: row.status as ClassEnrollment['status'],
      waitlistPosition: row.waitlist_position != null ? Number(row.waitlist_position) : null,
      checkinAt: row.checkin_at ? String(row.checkin_at) : null,
      cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
      attendedAt: row.attended_at ? String(row.attended_at) : null,
      markedBy: row.marked_by ? String(row.marked_by) : null,
      source: (row.source as ClassEnrollment['source']) || 'manual',
      createdAt: String(row.created_at),
    };
  }

  mapCheckin(row: Record<string, unknown>): Checkin {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: String(row.unit_id),
      studentId: String(row.student_id),
      scheduleId: row.schedule_id ? String(row.schedule_id) : null,
      method: row.method as Checkin['method'],
      device: row.device ? String(row.device) : null,
      deviceId: row.device_id ? String(row.device_id) : null,
      direction: (row.direction as 'in' | 'out') || 'in',
      partner: row.partner ? String(row.partner) : null,
      externalCheckinId: row.external_checkin_id ? String(row.external_checkin_id) : null,
      createdAt: String(row.created_at),
    };
  }

  mapAccessRules(row: Record<string, unknown>): AccessRules {
    const hours = (row.allowed_hours_json as { start?: string; end?: string }) || {};
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      maxCheckinsPerDay: Number(row.max_checkins_per_day ?? 2),
      minIntervalMinutes: Number(row.min_interval_minutes ?? 2),
      blockOverdue: Boolean(row.block_overdue ?? true),
      blockExpiredPlan: Boolean(row.block_expired_plan ?? true),
      blockFrozen: Boolean(row.block_frozen ?? true),
      graceDays: Number(row.grace_days ?? 0),
      allowedWeekdays: Array.isArray(row.allowed_weekdays)
        ? (row.allowed_weekdays as number[])
        : [0, 1, 2, 3, 4, 5, 6],
      allowedHoursJson: {
        start: hours.start || '05:00',
        end: hours.end || '23:00',
      },
    };
  }

  mapDevice(row: Record<string, unknown>): AccessDevice {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: String(row.unit_id),
      name: String(row.name),
      manufacturer: row.manufacturer ? String(row.manufacturer) : null,
      ip: row.ip ? String(row.ip) : null,
      provider: String(row.provider || 'stub'),
      status: String(row.status),
    };
  }

  async listRooms(companyId: string, unitId?: string | null) {
    let q = this.admin()
      .from('rooms')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('active', true)
      .order('name');
    if (unitId) q = q.eq('unit_id', unitId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapRoom(r as Record<string, unknown>));
  }

  async createRoom(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('rooms').insert(row).select('*').single();
    if (error) throw error;
    return this.mapRoom(data as Record<string, unknown>);
  }

  async listSchedules(companyId: string, filters: ScheduleListFilters = {}) {
    let q = this.admin()
      .from('schedules')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('start_at', { ascending: true });
    if (filters.unitId) q = q.eq('unit_id', filters.unitId);
    if (filters.from) q = q.gte('start_at', filters.from);
    if (filters.to) q = q.lte('start_at', filters.to);
    if (filters.type) q = q.eq('type', filters.type);
    if (filters.teacherId) q = q.eq('teacher_id', filters.teacherId);
    if (filters.roomId) q = q.eq('room_id', filters.roomId);
    if (filters.modalityId) q = q.eq('modality_id', filters.modalityId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data || []) as Record<string, unknown>[];
    const result: Schedule[] = [];
    for (const row of rows) {
      const counts = await this.countEnrollments(String(row.id));
      result.push(this.mapSchedule(row, counts.reserved, counts.waitlist));
    }
    return result;
  }

  async findScheduleConflicts(params: {
    companyId: string;
    startAt: string;
    endAt: string;
    teacherId?: string | null;
    roomId?: string | null;
    excludeId?: string;
  }) {
    let q = this.admin()
      .from('schedules')
      .select('*')
      .eq('company_id', params.companyId)
      .is('deleted_at', null)
      .neq('status', 'cancelled')
      .lt('start_at', params.endAt)
      .gt('end_at', params.startAt);
    if (params.excludeId) q = q.neq('id', params.excludeId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data || []) as Record<string, unknown>[];
    const teacherConflict = params.teacherId
      ? rows.find((r) => r.teacher_id === params.teacherId)
      : undefined;
    const roomConflict = params.roomId
      ? rows.find((r) => String(r.room_id || '') === params.roomId)
      : undefined;
    return {
      teacherConflict: teacherConflict
        ? this.mapSchedule(teacherConflict as Record<string, unknown>)
        : null,
      roomConflict: roomConflict ? this.mapSchedule(roomConflict as Record<string, unknown>) : null,
    };
  }

  async listModalities(companyId: string) {
    const { data, error } = await this.admin()
      .from('modalities')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapModality(r as Record<string, unknown>));
  }

  async getModality(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('modalities')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapModality(data as Record<string, unknown>) : null;
  }

  async createModality(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('modalities').insert(row).select('*').single();
    if (error) throw error;
    return this.mapModality(data as Record<string, unknown>);
  }

  async updateModality(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('modalities')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapModality(data as Record<string, unknown>);
  }

  async updateRoom(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('rooms')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapRoom(data as Record<string, unknown>);
  }

  async insertScheduleAudit(row: Record<string, unknown>) {
    const { error } = await this.admin().from('schedule_audit_logs').insert(row);
    if (error) throw error;
  }

  async getEnrollment(companyId: string, scheduleId: string, enrollmentId: string) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .select('*')
      .eq('company_id', companyId)
      .eq('schedule_id', scheduleId)
      .eq('id', enrollmentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapEnrollment(data as Record<string, unknown>) : null;
  }

  async findStudentByEmail(companyId: string, email: string) {
    const { data, error } = await this.admin()
      .from('students')
      .select('id, full_name, email, unit_id, status')
      .eq('company_id', companyId)
      .ilike('email', email.trim())
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async insertPartnerApiLog(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('partner_api_logs')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async agendaDashboard(companyId: string, unitId?: string | null): Promise<AgendaDashboard> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    let q = this.admin()
      .from('schedules')
      .select('id, type, teacher_id, max_capacity, status')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .neq('status', 'cancelled')
      .gte('start_at', start.toISOString())
      .lte('start_at', end.toISOString());
    if (unitId) q = q.eq('unit_id', unitId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data || []) as Array<Record<string, unknown>>;
    let confirmedToday = 0;
    let waitlistToday = 0;
    let capacitySum = 0;
    let reservedSum = 0;
    const teachers = new Set<string>();
    for (const row of rows) {
      if (row.teacher_id) teachers.add(String(row.teacher_id));
      const counts = await this.countEnrollments(String(row.id));
      confirmedToday += counts.reserved;
      waitlistToday += counts.waitlist;
      capacitySum += Number(row.max_capacity || 0);
      reservedSum += counts.reserved;
    }
    return {
      classesToday: rows.filter((r) => r.type === 'class').length,
      confirmedToday,
      occupancyPct: capacitySum > 0 ? Math.round((reservedSum / capacitySum) * 100) : 0,
      teachersInClass: teachers.size,
      assessmentsToday: rows.filter((r) => r.type === 'assessment').length,
      reservationsToday: confirmedToday,
      waitlistToday,
    };
  }

  async agendaKpis(companyId: string, from: string, to: string): Promise<AgendaKpis> {
    const schedules = await this.listSchedules(companyId, { from, to });
    let attended = 0;
    let reservedLike = 0;
    let cancellations = 0;
    const modalityCount = new Map<string, number>();
    const hourCount = new Map<number, number>();

    for (const s of schedules) {
      const hour = new Date(s.startAt).getHours();
      hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
      if (s.modalityId) {
        modalityCount.set(s.modalityId, (modalityCount.get(s.modalityId) || 0) + 1);
      }
      const enrollments = await this.listClassEnrollments(s.id);
      for (const e of enrollments) {
        if (e.status === 'cancelled') cancellations += 1;
        if (['reserved', 'checked_in', 'no_show'].includes(e.status)) reservedLike += 1;
        if (e.status === 'checked_in' || e.attendedAt) attended += 1;
      }
    }

    const modalities = await this.listModalities(companyId);
    const nameById = new Map(modalities.map((m) => [m.id, m.name]));
    const topModalities = [...modalityCount.entries()]
      .map(([modalityId, count]) => ({
        modalityId,
        name: nameById.get(modalityId) || modalityId,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const peakHours = [...hourCount.entries()]
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      from,
      to,
      attendanceRate: reservedLike > 0 ? Math.round((attended / reservedLike) * 100) : 0,
      cancellations,
      topModalities,
      peakHours,
    };
  }

  async agendaSuggestions(companyId: string): Promise<AgendaSuggestion[]> {
    const from = new Date();
    from.setDate(from.getDate() - 60);
    const schedules = await this.listSchedules(companyId, { from: from.toISOString() });
    const slotScore = new Map<string, number>();
    for (const s of schedules) {
      const enrollments = await this.countEnrollments(s.id);
      const d = new Date(s.startAt);
      const key = `${d.getDay()}-${d.getHours()}`;
      slotScore.set(key, (slotScore.get(key) || 0) + enrollments.reserved + 1);
    }
    const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return [...slotScore.entries()]
      .map(([key, score]) => {
        const [weekday, hour] = key.split('-').map(Number);
        return {
          weekday,
          hour,
          score,
          label: `${weekdayNames[weekday] || weekday} ${String(hour).padStart(2, '0')}:00`,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  async getSchedule(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const counts = await this.countEnrollments(id);
    return this.mapSchedule(data as Record<string, unknown>, counts.reserved, counts.waitlist);
  }

  async createSchedule(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('schedules').insert(row).select('*').single();
    if (error) throw error;
    return this.mapSchedule(data as Record<string, unknown>, 0, 0);
  }

  async updateSchedule(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('schedules')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single();
    if (error) throw error;
    const counts = await this.countEnrollments(id);
    return this.mapSchedule(data as Record<string, unknown>, counts.reserved, counts.waitlist);
  }

  async countEnrollments(scheduleId: string) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .select('status')
      .eq('schedule_id', scheduleId)
      .is('deleted_at', null)
      .in('status', ['reserved', 'checked_in', 'waitlist']);
    if (error) throw error;
    const rows = data || [];
    return {
      reserved: rows.filter((r) => r.status === 'reserved' || r.status === 'checked_in').length,
      waitlist: rows.filter((r) => r.status === 'waitlist').length,
    };
  }

  async listClassEnrollments(scheduleId: string) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .select('*')
      .eq('schedule_id', scheduleId)
      .is('deleted_at', null)
      .order('created_at');
    if (error) throw error;
    return (data || []).map((r) => this.mapEnrollment(r as Record<string, unknown>));
  }

  async findClassEnrollment(scheduleId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapEnrollment(data as Record<string, unknown>) : null;
  }

  async createClassEnrollment(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapEnrollment(data as Record<string, unknown>);
  }

  async updateClassEnrollment(id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapEnrollment(data as Record<string, unknown>);
  }

  async waitlistPositions(scheduleId: string) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .select('waitlist_position')
      .eq('schedule_id', scheduleId)
      .eq('status', 'waitlist')
      .is('deleted_at', null);
    if (error) throw error;
    return (data || [])
      .map((r) => Number(r.waitlist_position || 0))
      .filter((n) => n > 0);
  }

  async firstWaitlisted(scheduleId: string) {
    const { data, error } = await this.admin()
      .from('class_enrollments')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('status', 'waitlist')
      .is('deleted_at', null)
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapEnrollment(data as Record<string, unknown>) : null;
  }

  async getStudent(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('students')
      .select(
        'id, company_id, unit_id, status, full_name, cpf, access_code, wellhub_id, totalpass_id, partner_status',
      )
      .eq('company_id', companyId)
      .eq('id', studentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async findStudentByCpf(companyId: string, cpf: string) {
    const digits = cpf.replace(/\D/g, '');
    const { data, error } = await this.admin()
      .from('students')
      .select('id, company_id, unit_id, status, full_name, cpf, access_code')
      .eq('company_id', companyId)
      .eq('cpf', digits)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async findStudentByAccessCode(companyId: string, code: string) {
    const { data, error } = await this.admin()
      .from('students')
      .select('id, company_id, unit_id, status, full_name, cpf, access_code')
      .eq('company_id', companyId)
      .eq('access_code', code.trim())
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
  }

  async getAccessRules(companyId: string, unitId?: string | null): Promise<AccessRules> {
    let q = this.admin().from('access_rules').select('*').eq('company_id', companyId);
    if (unitId) {
      const { data } = await q.eq('unit_id', unitId).maybeSingle();
      if (data) return this.mapAccessRules(data as Record<string, unknown>);
    }
    const { data: companyWide } = await this.admin()
      .from('access_rules')
      .select('*')
      .eq('company_id', companyId)
      .is('unit_id', null)
      .maybeSingle();
    if (companyWide) return this.mapAccessRules(companyWide as Record<string, unknown>);

    const { data: anyUnit } = await this.admin()
      .from('access_rules')
      .select('*')
      .eq('company_id', companyId)
      .limit(1)
      .maybeSingle();
    if (anyUnit) return this.mapAccessRules(anyUnit as Record<string, unknown>);

    return {
      id: 'default',
      companyId,
      unitId: unitId || null,
      maxCheckinsPerDay: 2,
      minIntervalMinutes: 2,
      blockOverdue: true,
      blockExpiredPlan: true,
      blockFrozen: true,
      graceDays: 0,
      allowedWeekdays: [0, 1, 2, 3, 4, 5, 6],
      allowedHoursJson: { start: '05:00', end: '23:00' },
    };
  }

  async upsertAccessRules(payload: Record<string, unknown>): Promise<AccessRules> {
    const { data, error } = await this.admin()
      .from('access_rules')
      .upsert(payload, { onConflict: 'company_id,unit_id' })
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAccessRules(data as Record<string, unknown>);
  }

  async countCheckinsToday(companyId: string, studentId: string, unitId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await this.admin()
      .from('checkins')
      .select('id')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .eq('unit_id', unitId)
      .eq('direction', 'in')
      .gte('created_at', start.toISOString());
    if (error) throw error;
    return (data || []).length;
  }

  async getActiveEnrollmentEndDate(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .select('id, end_date, status')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as { id: string; end_date: string | null; status: string } | null;
  }

  async companyHasAnyEnrollment(companyId: string) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .select('id')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .limit(1);
    if (error) throw error;
    return (data || []).length > 0;
  }

  async overdueDays(companyId: string, studentId: string): Promise<number | null> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.admin()
      .from('receivables')
      .select('due_date')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .in('status', ['open', 'overdue'])
      .lt('due_date', today)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .limit(1);
    if (error) throw error;
    const row = (data || [])[0] as { due_date?: string } | undefined;
    if (!row?.due_date) return null;
    const due = new Date(row.due_date);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86_400_000));
  }

  async hasActiveEnrollment(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .select('id')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(1);
    if (error) throw error;
    return (data || []).length > 0;
  }

  async hasFrozenEnrollment(companyId: string, studentId: string) {
    const { data, error } = await this.admin()
      .from('enrollments')
      .select('id')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .eq('status', 'frozen')
      .is('deleted_at', null)
      .limit(1);
    if (error) throw error;
    return (data || []).length > 0;
  }

  async hasOverdueReceivable(companyId: string, studentId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await this.admin()
      .from('receivables')
      .select('id')
      .eq('company_id', companyId)
      .eq('student_id', studentId)
      .in('status', ['open', 'overdue'])
      .lt('due_date', today)
      .is('deleted_at', null)
      .limit(1);
    if (error) throw error;
    return (data || []).length > 0;
  }

  async recentCheckin(studentId: string, unitId: string, withinMinutes = 2) {
    const since = new Date(Date.now() - withinMinutes * 60_000).toISOString();
    const { data, error } = await this.admin()
      .from('checkins')
      .select('id')
      .eq('student_id', studentId)
      .eq('unit_id', unitId)
      .gte('created_at', since)
      .limit(1);
    if (error) throw error;
    return (data || []).length > 0;
  }

  async createCheckin(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('checkins').insert(row).select('*').single();
    if (error) throw error;
    return this.mapCheckin(data as Record<string, unknown>);
  }

  async listCheckins(companyId: string, studentId?: string, unitId?: string | null) {
    let q = this.admin()
      .from('checkins')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (studentId) q = q.eq('student_id', studentId);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapCheckin(r as Record<string, unknown>));
  }

  async listDevices(companyId: string, unitId?: string | null) {
    let q = this.admin()
      .from('access_devices')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (unitId) q = q.eq('unit_id', unitId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapDevice(r as Record<string, unknown>));
  }

  async getDevice(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('access_devices')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapDevice(data as Record<string, unknown>) : null;
  }

  async insertAccessLog(row: Record<string, unknown>): Promise<AccessLog> {
    const { data, error } = await this.admin().from('access_logs').insert(row).select('*').single();
    if (error) throw error;
    const r = data as Record<string, unknown>;
    return {
      id: String(r.id),
      companyId: String(r.company_id),
      unitId: r.unit_id ? String(r.unit_id) : null,
      studentId: r.student_id ? String(r.student_id) : null,
      deviceId: r.device_id ? String(r.device_id) : null,
      result: r.result as AccessLog['result'],
      reason: r.reason ? String(r.reason) : null,
      reasonLabel: r.reason_label ? String(r.reason_label) : null,
      method: r.method ? String(r.method) : null,
      partner: r.partner ? String(r.partner) : null,
      createdAt: String(r.created_at),
    };
  }

  async listLiveAccess(companyId: string, unitId: string | null, limit = 30): Promise<AccessLiveEvent[]> {
    let q = this.admin()
      .from('access_logs')
      .select('id, student_id, result, reason, reason_label, method, partner, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (unitId) q = q.eq('unit_id', unitId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data || []) as Record<string, unknown>[];
    const studentIds = [
      ...new Set(rows.map((r) => (r.student_id ? String(r.student_id) : '')).filter(Boolean)),
    ];
    const nameMap = new Map<string, string>();
    if (studentIds.length) {
      const { data: students } = await this.admin()
        .from('students')
        .select('id, full_name')
        .in('id', studentIds);
      for (const s of students || []) {
        nameMap.set(String((s as { id: string }).id), String((s as { full_name: string }).full_name));
      }
    }
    return rows.map((r) => ({
      id: String(r.id),
      studentId: r.student_id ? String(r.student_id) : null,
      studentName: r.student_id ? nameMap.get(String(r.student_id)) || null : null,
      result: r.result as AccessLiveEvent['result'],
      reason: r.reason ? String(r.reason) : null,
      reasonLabel: r.reason_label ? String(r.reason_label) : null,
      method: r.method ? String(r.method) : null,
      partner: r.partner ? String(r.partner) : null,
      createdAt: String(r.created_at),
    }));
  }

  async presence(companyId: string, unitId: string): Promise<PresenceSnapshot> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const isoDay = start.toISOString();

    const { data: today } = await this.admin()
      .from('checkins')
      .select('id, student_id, direction, created_at, partner, method')
      .eq('company_id', companyId)
      .eq('unit_id', unitId)
      .gte('created_at', isoDay)
      .order('created_at', { ascending: true });

    const rows = (today || []) as Array<{
      student_id: string;
      direction: string;
      created_at: string;
      partner: string | null;
      method: string;
    }>;

    const lastByStudent = new Map<
      string,
      { direction: string; created_at: string; partner: string | null; method: string }
    >();
    const byPartner: Record<string, number> = { own: 0 };
    let entries = 0;
    let running = 0;
    let peak = 0;
    for (const r of rows) {
      if (r.direction === 'in') {
        entries += 1;
        running += 1;
        peak = Math.max(peak, running);
        const key = r.partner || 'own';
        byPartner[key] = (byPartner[key] || 0) + 1;
      } else {
        running = Math.max(0, running - 1);
      }
      lastByStudent.set(r.student_id, {
        direction: r.direction,
        created_at: r.created_at,
        partner: r.partner,
        method: r.method,
      });
    }

    const presentIds = [...lastByStudent.entries()]
      .filter(([, v]) => v.direction === 'in')
      .map(([id]) => id);

    const nameMap = new Map<string, string>();
    if (presentIds.length) {
      const { data: students } = await this.admin()
        .from('students')
        .select('id, full_name')
        .in('id', presentIds);
      for (const s of students || []) {
        nameMap.set(String((s as { id: string }).id), String((s as { full_name: string }).full_name));
      }
    }

    const now = Date.now();
    const present: PresencePerson[] = presentIds.map((id) => {
      const last = lastByStudent.get(id)!;
      const durationSec = Math.max(
        0,
        Math.floor((now - new Date(last.created_at).getTime()) / 1000),
      );
      return {
        studentId: id,
        fullName: nameMap.get(id) || 'Aluno',
        checkinAt: last.created_at,
        durationSec,
        partner: last.partner,
        method: last.method || 'manual',
      };
    });

    const avgDurationSec =
      present.length === 0
        ? 0
        : Math.round(present.reduce((s, p) => s + p.durationSec, 0) / present.length);

    const { count: deniedToday } = await this.admin()
      .from('access_logs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('unit_id', unitId)
      .eq('result', 'denied')
      .gte('created_at', isoDay);

    return {
      present,
      presentCount: present.length,
      avgDurationSec,
      peakToday: peak,
      checkinsToday: entries,
      deniedToday: deniedToday || 0,
      byPartner,
    };
  }

  async agendaCheckins(companyId: string, unitId: string, from: string, to: string) {
    const { data, error } = await this.admin()
      .from('checkins')
      .select('*, students(full_name)')
      .eq('company_id', companyId)
      .eq('unit_id', unitId)
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown> & { students?: { full_name?: string } };
      return {
        ...this.mapCheckin(row),
        studentName: row.students?.full_name || null,
      };
    });
  }

  async operationsKpis(companyId: string, unitId: string): Promise<OperationsKpis> {
    const snap = await this.presence(companyId, unitId);
    return {
      checkinsToday: snap.checkinsToday,
      deniedToday: snap.deniedToday,
      presentNow: snap.presentCount,
      avgDurationSec: snap.avgDurationSec,
      peakToday: snap.peakToday,
      byPartner: snap.byPartner,
    };
  }

  async listPartners(companyId: string): Promise<PartnerHubItem[]> {
    const { data, error } = await this.admin()
      .from('partners')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        companyId: String(row.company_id),
        name: String(row.name),
        slug: String(row.slug),
        type: row.type as PartnerHubItem['type'],
        status: String(row.status),
        settings: (row.settings as Record<string, unknown>) || {},
      };
    });
  }

  async dashboard(companyId: string, unitId: string): Promise<OperationsDashboard> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isoDay = startOfDay.toISOString();
    const now = new Date().toISOString();

    const { data: today } = await this.admin()
      .from('checkins')
      .select('direction')
      .eq('company_id', companyId)
      .eq('unit_id', unitId)
      .gte('created_at', isoDay);

    const entriesToday = (today || []).filter((c) => c.direction === 'in').length;
    const exitsToday = (today || []).filter((c) => c.direction === 'out').length;
    const presentNow = Math.max(0, entriesToday - exitsToday);

    const { data: classes } = await this.admin()
      .from('schedules')
      .select('id')
      .eq('company_id', companyId)
      .eq('unit_id', unitId)
      .is('deleted_at', null)
      .lte('start_at', now)
      .gte('end_at', now)
      .neq('status', 'cancelled');

    const rooms = await this.listRooms(companyId, unitId);
    const capacity = rooms.reduce((s, r) => s + r.capacity, 0) || 1;
    const areas: OccupancyArea[] = rooms.map((r) => {
      // Approximate area occupancy by proportion of presentNow
      const share = r.capacity / capacity;
      const present = Math.round(presentNow * share);
      return {
        area: r.area || r.name,
        present,
        capacity: r.capacity,
        occupancyPct: Math.min(100, Math.round((present / r.capacity) * 1000) / 10),
      };
    });

    return {
      presentNow,
      entriesToday,
      exitsToday,
      occupancyPct: Math.min(100, Math.round((presentNow / capacity) * 1000) / 10),
      classesInProgress: (classes || []).length,
      areas,
    };
  }

  mapPartnerIntegration(row: Record<string, unknown>): PartnerIntegration {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      provider: row.provider as PartnerIntegration['provider'],
      enabled: Boolean(row.enabled),
      status: String(row.status),
      externalGymId: row.external_gym_id ? String(row.external_gym_id) : null,
      notes: row.notes ? String(row.notes) : null,
    };
  }

  mapPartnerAccessRequest(row: Record<string, unknown>): PartnerAccessRequest {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      provider: row.provider as PartnerAccessRequest['provider'],
      status: row.status as PartnerAccessRequest['status'],
      memberName: String(row.member_name),
      memberDocument: row.member_document ? String(row.member_document) : null,
      memberEmail: row.member_email ? String(row.member_email) : null,
      externalMemberId: row.external_member_id ? String(row.external_member_id) : null,
      externalBookingId: row.external_booking_id ? String(row.external_booking_id) : null,
      studentId: row.student_id ? String(row.student_id) : null,
      checkinId: row.checkin_id ? String(row.checkin_id) : null,
      decidedBy: row.decided_by ? String(row.decided_by) : null,
      decidedAt: row.decided_at ? String(row.decided_at) : null,
      rejectReason: row.reject_reason ? String(row.reject_reason) : null,
      createdAt: String(row.created_at),
    };
  }

  async listPartnerIntegrations(companyId: string) {
    const { data, error } = await this.admin()
      .from('partner_integrations')
      .select('*')
      .eq('company_id', companyId)
      .order('provider');
    if (error) throw error;
    return (data || []).map((r) => this.mapPartnerIntegration(r as Record<string, unknown>));
  }

  async upsertPartnerIntegration(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('partner_integrations')
      .upsert(payload, { onConflict: 'company_id,provider' })
      .select('*')
      .single();
    if (error) throw error;
    return this.mapPartnerIntegration(data as Record<string, unknown>);
  }

  async listPartnerAccessRequests(companyId: string, status?: string) {
    let q = this.admin()
      .from('partner_access_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => this.mapPartnerAccessRequest(r as Record<string, unknown>));
  }

  async getPartnerAccessRequest(companyId: string, id: string) {
    const { data } = await this.admin()
      .from('partner_access_requests')
      .select('*')
      .eq('company_id', companyId)
      .eq('id', id)
      .maybeSingle();
    return data ? this.mapPartnerAccessRequest(data as Record<string, unknown>) : null;
  }

  async insertPartnerAccessRequest(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('partner_access_requests')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapPartnerAccessRequest(data as Record<string, unknown>);
  }

  async updatePartnerAccessRequest(id: string, payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('partner_access_requests')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapPartnerAccessRequest(data as Record<string, unknown>);
  }
}
