import { Injectable } from '@nestjs/common';
import type {
  EmergencyContact,
  Student,
  StudentAddress,
  StudentDocument,
  StudentListItem,
  StudentStatusHistory,
} from '@athena/shared';
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

  mapListItem(row: Record<string, unknown>): StudentListItem {
    return {
      id: String(row.id),
      fullName: String(row.full_name),
      cpf: (row.cpf as string) || null,
      registrationNumber: String(row.registration_number),
      planName: (row.plan_name as string) || null,
      status: String(row.status),
      unitId: String(row.unit_id),
      phone: (row.phone as string) || null,
      lastAccessAt: row.last_access_at ? String(row.last_access_at) : null,
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
    };
    page: number;
    pageSize: number;
  }) {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    let q = this.admin()
      .from('students')
      .select(
        'id, full_name, cpf, registration_number, plan_name, status, unit_id, phone, last_access_at, photo_url',
        { count: 'exact' },
      )
      .is('deleted_at', null)
      .in('company_id', params.companyIds)
      .order('full_name')
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
    if (params.filters.q) {
      const term = `%${params.filters.q}%`;
      q = q.or(
        `full_name.ilike.${term},cpf.ilike.${term},registration_number.ilike.${term},phone.ilike.${term},email.ilike.${term}`,
      );
    }

    const { data, error, count } = await q;
    if (error) throw error;
    return {
      items: (data || []).map((r) => this.mapListItem(r as Record<string, unknown>)),
      total: count || 0,
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
        'registration_number, full_name, cpf, email, phone, status, plan_name, trainer_name, unit_id',
      )
      .in('company_id', companyIds)
      .is('deleted_at', null)
      .order('full_name');
    if (error) throw error;
    return data || [];
  }
}
