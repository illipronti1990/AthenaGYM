import { Injectable } from '@nestjs/common';
import type {
  AccessDevice,
  AccessLog,
  Checkin,
  ClassEnrollment,
  OccupancyArea,
  OperationsDashboard,
  PartnerAccessRequest,
  PartnerIntegration,
  Room,
  Schedule,
} from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OperationsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
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
      createdAt: String(row.created_at),
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

  async listSchedules(companyId: string, unitId?: string | null) {
    let q = this.admin()
      .from('schedules')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('start_at', { ascending: true });
    if (unitId) q = q.eq('unit_id', unitId);
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
      .select('id, company_id, unit_id, status, full_name')
      .eq('company_id', companyId)
      .eq('id', studentId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data as Record<string, unknown> | null;
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
      method: r.method ? String(r.method) : null,
      createdAt: String(r.created_at),
    };
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
