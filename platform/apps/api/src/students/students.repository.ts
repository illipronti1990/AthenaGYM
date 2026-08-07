import { Injectable } from '@nestjs/common';
import type {
  EmergencyContact,
  Student,
  StudentAddress,
  StudentDocument,
  StudentListItem,
  StudentStatusHistory,
  StudentTimelineEvent,
  Student360Summary,
} from '@athena/shared';
import { resolveStudentDisplayStatus } from '@athena/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StudentsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapStudent(row: Record<string, unknown>): Student {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: String(row.unit_id),
      legacyAlunoId: row.legacy_aluno_id != null ? Number(row.legacy_aluno_id) : null,
      registrationNumber: String(row.registration_number),
      fullName: String(row.full_name),
      socialName: (row.social_name as string) || null,
      cpf: (row.cpf as string) || null,
      rg: (row.rg as string) || null,
      birthDate: row.birth_date ? String(row.birth_date) : null,
      gender: (row.gender as string) || null,
      maritalStatus: (row.marital_status as string) || null,
      profession: (row.profession as string) || null,
      email: (row.email as string) || null,
      phone: (row.phone as string) || null,
      whatsapp: (row.whatsapp as string) || null,
      photoUrl: (row.photo_url as string) || null,
      status: String(row.status),
      planName: (row.plan_name as string) || null,
      trainerName: (row.trainer_name as string) || null,
      notes: (row.notes as string) || null,
      lastAccessAt: row.last_access_at ? String(row.last_access_at) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    };
  }

  mapListItem(
    row: Record<string, unknown>,
    meta?: { nextDueDate?: string | null; monthlyFee?: number | null },
  ): StudentListItem {
    const status = String(row.status);
    const nextDueDate = meta?.nextDueDate ?? null;
    return {
      id: String(row.id),
      fullName: String(row.full_name),
      cpf: (row.cpf as string) || null,
      registrationNumber: String(row.registration_number),
      planName: (row.plan_name as string) || null,
      trainerName: (row.trainer_name as string) || null,
      status,
      displayStatus: resolveStudentDisplayStatus(status, nextDueDate),
      unitId: String(row.unit_id),
      phone: (row.phone as string) || null,
      whatsapp: (row.whatsapp as string) || null,
      lastAccessAt: row.last_access_at ? String(row.last_access_at) : null,
      lastCheckinAt: row.last_access_at ? String(row.last_access_at) : null,
      nextDueDate,
      monthlyFee: meta?.monthlyFee ?? null,
      createdAt: String(row.created_at),
      photoUrl: (row.photo_url as string) || null,
    };
  }

  mapAddress(row: Record<string, unknown>): StudentAddress {
    return {
      id: String(row.id),
      studentId: String(row.student_id),
      zipcode: (row.zipcode as string) || null,
      street: (row.street as string) || null,
      number: (row.number as string) || null,
      complement: (row.complement as string) || null,
      district: (row.district as string) || null,
      city: (row.city as string) || null,
      state: (row.state as string) || null,
      country: (row.country as string) || null,
    };
  }

  mapEmergency(row: Record<string, unknown>): EmergencyContact {
    return {
      id: String(row.id),
      studentId: String(row.student_id),
      name: String(row.name),
      relationship: (row.relationship as string) || null,
      phone: (row.phone as string) || null,
      whatsapp: (row.whatsapp as string) || null,
    };
  }

  mapDocument(row: Record<string, unknown>): StudentDocument {
    return {
      id: String(row.id),
      studentId: String(row.student_id),
      type: String(row.type),
      storagePath: String(row.storage_path),
      fileName: (row.file_name as string) || null,
      uploadedAt: String(row.uploaded_at),
    };
  }

  mapHistory(row: Record<string, unknown>): StudentStatusHistory {
    return {
      id: String(row.id),
      studentId: String(row.student_id),
      oldStatus: (row.old_status as string) || null,
      newStatus: String(row.new_status),
      reason: (row.reason as string) || null,
      createdBy: row.created_by ? String(row.created_by) : null,
      createdAt: String(row.created_at),
    };
  }

  async list(params: {
    companyIds: string[];
    unitIds?: string[];
    filters: {
      q?: string;
      name?: string;
      cpf?: string;
      registration?: string;
      phone?: string;
      email?: string;
      status?: string;
      unitId?: string;
      planName?: string;
      trainerName?: string;
      birthdays?: boolean;
      recentEnrollment?: boolean;
    };
    page: number;
    pageSize: number;
    sort?: { column: string; ascending: boolean };
  }) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const sortColumn = params.sort?.column || 'full_name';
    const ascending = params.sort?.ascending ?? true;
    const selectCols =
      'id, full_name, cpf, registration_number, plan_name, trainer_name, status, unit_id, phone, whatsapp, last_access_at, photo_url, created_at, birth_date';

    if (params.filters.birthdays) {
      let birthdayQ = this.admin()
        .from('students')
        .select(selectCols)
        .is('deleted_at', null)
        .in('company_id', params.companyIds)
        .not('birth_date', 'is', null);
      if (params.unitIds?.length) birthdayQ = birthdayQ.in('unit_id', params.unitIds);
      if (params.filters.unitId) birthdayQ = birthdayQ.eq('unit_id', params.filters.unitId);
      const { data: allRows, error: allErr } = await birthdayQ;
      if (allErr) throw allErr;
      const month = new Date().getMonth() + 1;
      const filtered = (allRows || []).filter((r) => {
        const bd = (r as { birth_date?: string }).birth_date;
        if (!bd) return false;
        const m = Number(bd.slice(5, 7));
        return m === month;
      });
      const sorted = [...filtered].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortColumn] ?? '');
        const bv = String((b as Record<string, unknown>)[sortColumn] ?? '');
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      const slice = sorted.slice(from, to + 1);
      const meta = await this.subscriptionMetaForStudents(
        slice.map((r) => String((r as { id: string }).id)),
      );
      return {
        items: slice.map((r) =>
          this.mapListItem(r as Record<string, unknown>, meta.get(String((r as { id: string }).id))),
        ),
        total: filtered.length,
      };
    }

    let q = this.admin()
      .from('students')
      .select(selectCols, { count: 'exact' })
      .is('deleted_at', null)
      .in('company_id', params.companyIds)
      .order(sortColumn, { ascending })
      .range(from, to);

    if (params.unitIds?.length) q = q.in('unit_id', params.unitIds);
    if (params.filters.unitId) q = q.eq('unit_id', params.filters.unitId);
    if (params.filters.status) q = q.eq('status', params.filters.status);
    if (params.filters.cpf) q = q.eq('cpf', params.filters.cpf);
    if (params.filters.registration) {
      q = q.ilike('registration_number', `%${params.filters.registration}%`);
    }
    if (params.filters.phone) q = q.ilike('phone', `%${params.filters.phone}%`);
    if (params.filters.email) q = q.ilike('email', `%${params.filters.email}%`);
    if (params.filters.name) q = q.ilike('full_name', `%${params.filters.name}%`);
    if (params.filters.planName) q = q.ilike('plan_name', `%${params.filters.planName}%`);
    if (params.filters.trainerName) q = q.ilike('trainer_name', `%${params.filters.trainerName}%`);
    if (params.filters.recentEnrollment) {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      q = q.gte('created_at', since.toISOString());
    }
    if (params.filters.q) {
      const term = `%${params.filters.q}%`;
      q = q.or(
        `full_name.ilike.${term},cpf.ilike.${term},registration_number.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
      );
    }

    const { data, error, count } = await q;
    if (error) throw error;
    const rows = (data || []) as Record<string, unknown>[];
    const meta = await this.subscriptionMetaForStudents(rows.map((r) => String(r.id)));
    return {
      items: rows.map((r) => this.mapListItem(r, meta.get(String(r.id)))),
      total: count || 0,
    };
  }

  private async subscriptionMetaForStudents(studentIds: string[]) {
    const map = new Map<string, { nextDueDate: string | null; monthlyFee: number | null }>();
    if (!studentIds.length) return map;
    const { data, error } = await this.admin()
      .from('subscriptions')
      .select('student_id, next_due_date, amount, status')
      .in('student_id', studentIds)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (error) throw error;
    for (const row of data || []) {
      const sid = String((row as { student_id: string }).student_id);
      const nextDue = (row as { next_due_date?: string | null }).next_due_date;
      const amount = Number((row as { amount?: number }).amount ?? 0);
      const existing = map.get(sid);
      if (!existing) {
        map.set(sid, {
          nextDueDate: nextDue ? String(nextDue) : null,
          monthlyFee: amount,
        });
        continue;
      }
      if (nextDue && (!existing.nextDueDate || nextDue < existing.nextDueDate)) {
        existing.nextDueDate = String(nextDue);
      }
      if (amount > 0) existing.monthlyFee = amount;
    }
    return map;
  }

  async fetchTimeline(studentId: string, limit = 60): Promise<StudentTimelineEvent[]> {
    const admin = this.admin();
    const perSource = Math.min(25, limit);
    const [checkins, enrollments, assessments, workouts, payments, history] = await Promise.all([
      admin
        .from('checkins')
        .select('id, created_at, method')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(perSource),
      admin
        .from('enrollments')
        .select('id, created_at, status')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(perSource),
      admin
        .from('assessments')
        .select('id, created_at')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(perSource),
      admin
        .from('workouts')
        .select('id, name, created_at')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(perSource),
      admin
        .from('receivables')
        .select('id, description, amount, paid_at')
        .eq('student_id', studentId)
        .not('paid_at', 'is', null)
        .is('deleted_at', null)
        .order('paid_at', { ascending: false })
        .limit(perSource),
      this.findHistory(studentId),
    ]);

    const events: StudentTimelineEvent[] = [];

    for (const row of checkins.data || []) {
      const r = row as { id: string; created_at: string; method?: string };
      events.push({
        id: `checkin-${r.id}`,
        kind: 'checkin',
        title: 'Check-in',
        description: r.method ? `Via ${r.method}` : null,
        occurredAt: r.created_at,
      });
    }
    for (const row of enrollments.data || []) {
      const r = row as { id: string; created_at: string; status?: string };
      events.push({
        id: `enrollment-${r.id}`,
        kind: 'enrollment',
        title: 'Matrícula',
        description: r.status ? `Status: ${r.status}` : null,
        occurredAt: r.created_at,
      });
    }
    for (const row of assessments.data || []) {
      const r = row as { id: string; created_at: string };
      events.push({
        id: `assessment-${r.id}`,
        kind: 'assessment',
        title: 'Avaliação física',
        occurredAt: r.created_at,
      });
    }
    for (const row of workouts.data || []) {
      const r = row as { id: string; name: string; created_at: string };
      events.push({
        id: `workout-${r.id}`,
        kind: 'workout',
        title: r.name ? `Treino: ${r.name}` : 'Novo treino',
        occurredAt: r.created_at,
      });
    }
    for (const row of payments.data || []) {
      const r = row as {
        id: string;
        description?: string;
        amount?: number;
        paid_at: string;
      };
      const amt = r.amount != null ? `R$ ${Number(r.amount).toFixed(2)}` : '';
      events.push({
        id: `payment-${r.id}`,
        kind: 'payment',
        title: 'Pagamento',
        description: [r.description, amt].filter(Boolean).join(' · ') || null,
        occurredAt: r.paid_at,
      });
    }
    for (const row of history) {
      events.push({
        id: `status-${row.id}`,
        kind: 'status',
        title: 'Alteração de status',
        description:
          row.oldStatus
            ? `${row.oldStatus} → ${row.newStatus}${row.reason ? ` (${row.reason})` : ''}`
            : row.newStatus,
        occurredAt: row.createdAt,
      });
    }

    events.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
    return events.slice(0, limit);
  }

  async fetchStudentSummary(studentId: string): Promise<Student360Summary> {
    const admin = this.admin();
    const [assessment, workout, checkin, subscription, receivables] = await Promise.all([
      admin
        .from('assessments')
        .select('weight, height, bmi, created_at')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('workouts')
        .select('created_at, updated_at')
        .eq('student_id', studentId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('checkins')
        .select('created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('subscriptions')
        .select('next_due_date, amount')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('next_due_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
      admin
        .from('receivables')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'open')
        .is('deleted_at', null),
    ]);

    const a = assessment.data as {
      weight?: number;
      height?: number;
      bmi?: number;
    } | null;
    const w = workout.data as { updated_at?: string; created_at?: string } | null;
    const c = checkin.data as { created_at?: string } | null;
    const s = subscription.data as { next_due_date?: string; amount?: number } | null;

    return {
      weight: a?.weight != null ? Number(a.weight) : null,
      height: a?.height != null ? Number(a.height) : null,
      bmi: a?.bmi != null ? Number(a.bmi) : null,
      lastWorkoutAt: w?.updated_at || w?.created_at || null,
      lastCheckinAt: c?.created_at || null,
      nextDueDate: s?.next_due_date ? String(s.next_due_date) : null,
      monthlyFee: s?.amount != null ? Number(s.amount) : null,
      openReceivables: receivables.count || 0,
    };
  }

  async findById(id: string) {
    const { data, error } = await this.admin()
      .from('students')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapStudent(data as Record<string, unknown>) : null;
  }

  async findAddress(studentId: string) {
    const { data } = await this.admin()
      .from('student_addresses')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();
    return data ? this.mapAddress(data as Record<string, unknown>) : null;
  }

  async findEmergency(studentId: string) {
    const { data } = await this.admin()
      .from('emergency_contacts')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null);
    return (data || []).map((r) => this.mapEmergency(r as Record<string, unknown>));
  }

  async findDocuments(studentId: string) {
    const { data } = await this.admin()
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });
    return (data || []).map((r) => this.mapDocument(r as Record<string, unknown>));
  }

  async findHistory(studentId: string) {
    const { data } = await this.admin()
      .from('student_status_history')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    return (data || []).map((r) => this.mapHistory(r as Record<string, unknown>));
  }

  async insertStudent(payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('students')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapStudent(data as Record<string, unknown>);
  }

  async updateStudent(id: string, payload: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('students')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapStudent(data as Record<string, unknown>);
  }

  async softDelete(id: string) {
    return this.updateStudent(id, {
      deleted_at: new Date().toISOString(),
      status: 'archived',
    });
  }

  async upsertAddress(studentId: string, address: Record<string, unknown>) {
    const existing = await this.findAddress(studentId);
    if (existing) {
      const { data, error } = await this.admin()
        .from('student_addresses')
        .update(address)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      return this.mapAddress(data as Record<string, unknown>);
    }
    const { data, error } = await this.admin()
      .from('student_addresses')
      .insert({ ...address, student_id: studentId })
      .select('*')
      .single();
    if (error) throw error;
    return this.mapAddress(data as Record<string, unknown>);
  }

  async replaceEmergency(studentId: string, contacts: Record<string, unknown>[]) {
    await this.admin()
      .from('emergency_contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .is('deleted_at', null);
    if (!contacts.length) return [];
    const rows = contacts.map((c) => ({ ...c, student_id: studentId }));
    const { data, error } = await this.admin()
      .from('emergency_contacts')
      .insert(rows)
      .select('*');
    if (error) throw error;
    return (data || []).map((r) => this.mapEmergency(r as Record<string, unknown>));
  }

  async insertHistory(row: Record<string, unknown>) {
    await this.admin().from('student_status_history').insert(row);
  }

  async insertDocument(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('student_documents')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapDocument(data as Record<string, unknown>);
  }

  async countByUnit(companyId: string, unitId: string) {
    const { count } = await this.admin()
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('unit_id', unitId);
    return count || 0;
  }

  async findByCpf(companyId: string, cpf: string, excludeId?: string) {
    let q = this.admin()
      .from('students')
      .select('id')
      .eq('company_id', companyId)
      .eq('cpf', cpf)
      .is('deleted_at', null)
      .limit(1);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    return data;
  }

  async getUnit(unitId: string) {
    const { data } = await this.admin()
      .from('units')
      .select('id, company_id, code, name')
      .eq('id', unitId)
      .is('deleted_at', null)
      .maybeSingle();
    return data as { id: string; company_id: string; code: string | null; name: string } | null;
  }

  async exportRows(companyIds: string[]) {
    const { data, error } = await this.admin()
      .from('students')
      .select(
        'id, registration_number, full_name, cpf, email, phone, status, plan_name, trainer_name, unit_id',
      )
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('full_name');
    if (error) throw error;
    return data || [];
  }

  async exportRowsForTrainer(
    companyIds: string[],
    opts: { trainerUserId: string; nameHints: string[] },
  ) {
    const selectCols =
      'id, registration_number, full_name, cpf, email, phone, status, plan_name, trainer_name, unit_id';
    const byId = new Map<string, Record<string, unknown>>();

    const hints = [...new Set(opts.nameHints.map((h) => h.trim()).filter((h) => h.length >= 2))];
    if (hints.length) {
      const orFilter = hints
        .map((h) => `trainer_name.ilike.%${h.replace(/[%_,]/g, '')}%`)
        .join(',');
      const { data, error } = await this.admin()
        .from('students')
        .select(selectCols)
        .in('company_id', companyIds)
        .is('deleted_at', null)
        .or(orFilter)
        .order('full_name');
      if (error) throw error;
      for (const row of data || []) {
        byId.set(String(row.id), row as Record<string, unknown>);
      }
    }

    const { data: workouts, error: wErr } = await this.admin()
      .from('workouts')
      .select('student_id')
      .eq('trainer_id', opts.trainerUserId)
      .not('student_id', 'is', null)
      .limit(2000);
    if (wErr) throw wErr;
    const workoutStudentIds = [
      ...new Set((workouts || []).map((r) => String(r.student_id)).filter(Boolean)),
    ];
    if (workoutStudentIds.length) {
      const { data, error } = await this.admin()
        .from('students')
        .select(selectCols)
        .in('company_id', companyIds)
        .in('id', workoutStudentIds)
        .is('deleted_at', null);
      if (error) throw error;
      for (const row of data || []) {
        byId.set(String(row.id), row as Record<string, unknown>);
      }
    }

    return [...byId.values()].sort((a, b) =>
      String(a.full_name || '').localeCompare(String(b.full_name || ''), 'pt-BR'),
    );
  }
}
