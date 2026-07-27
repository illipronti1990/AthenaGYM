import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthContext, Student, StudentListResponse } from '@athena/shared';
import { STUDENT_STATUSES } from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ChangeStatusDto,
  CreateStudentDto,
  TransferStudentDto,
  UpdateStudentDto,
} from './dto/students.dto';
import {
  STUDENT_CREATED,
  STUDENT_STATUS_CHANGED,
  STUDENT_TRANSFERRED,
  STUDENT_UPDATED,
} from './events/student.events';
import { StudentsRepository } from './students.repository';
import { assertValidCpf } from './validators/cpf.validator';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DOC_BYTES = 10 * 1024 * 1024;

@Injectable()
export class StudentsService {
  constructor(
    private readonly repo: StudentsRepository,
    private readonly events: EventEmitter2,
    private readonly audit: AuditService,
    private readonly supabase: SupabaseService,
  ) {}

  private companyScope(auth: AuthContext, companyId?: string | null): string[] {
    if (auth.isSuperAdmin) {
      return companyId ? [companyId] : auth.companyIds.length ? auth.companyIds : [];
    }
    if (!auth.companyIds.length) throw new ForbiddenException('No company access');
    if (companyId && !auth.companyIds.includes(companyId)) {
      throw new ForbiddenException('Company not allowed');
    }
    return companyId ? [companyId] : auth.companyIds;
  }

  private assertCanAccess(auth: AuthContext, student: Student) {
    if (auth.isSuperAdmin) return;
    if (!auth.companyIds.includes(student.companyId)) {
      throw new NotFoundException('Student not found');
    }
    if (auth.unitIds.length && !auth.unitIds.includes(student.unitId)) {
      throw new ForbiddenException('Unit not allowed');
    }
  }

  async list(
    auth: AuthContext,
    query: Record<string, string | undefined>,
  ): Promise<StudentListResponse> {
    const companyIds = this.companyScope(auth, query.companyId);
    if (!companyIds.length && !auth.isSuperAdmin) {
      return { items: [], total: 0, page: 1, pageSize: 20 };
    }
    // super admin without companies: need all — use empty filter via fetch all companies not ideal;
    // for MVP require company header or first membership
    const ids =
      companyIds.length > 0
        ? companyIds
        : ['11111111-1111-1111-1111-111111111111'];

    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(200, Math.max(1, Number(query.pageSize || 20)));
    const sortMap: Record<string, string> = {
      fullName: 'full_name',
      full_name: 'full_name',
      planName: 'plan_name',
      plan_name: 'plan_name',
      status: 'status',
      phone: 'phone',
      registrationNumber: 'registration_number',
      registration_number: 'registration_number',
      lastAccessAt: 'last_access_at',
      lastCheckinAt: 'last_access_at',
      createdAt: 'created_at',
      created_at: 'created_at',
      trainerName: 'trainer_name',
      trainer_name: 'trainer_name',
      cpf: 'cpf',
    };
    const sortKey = query.sort ? sortMap[query.sort] : undefined;
    const sortDir = String(query.sortDir || 'asc').toLowerCase() === 'desc' ? false : true;
    const { items, total } = await this.repo.list({
      companyIds: ids,
      unitIds: auth.isSuperAdmin ? undefined : auth.unitIds.length ? auth.unitIds : undefined,
      filters: {
        q: query.q,
        name: query.name,
        cpf: query.cpf,
        registration: query.registration,
        phone: query.phone,
        email: query.email,
        status: query.status,
        unitId: query.unitId,
        planName: query.planName,
        trainerName: query.trainerName,
        birthdays: query.birthdays === '1' || query.birthdays === 'true',
        recentEnrollment:
          query.recentEnrollment === '1' || query.recentEnrollment === 'true',
      },
      page,
      pageSize,
      sort: sortKey ? { column: sortKey, ascending: sortDir } : undefined,
    });
    return { items, total, page, pageSize };
  }

  async search(auth: AuthContext, q: string) {
    return this.list(auth, { q, page: '1', pageSize: '20' });
  }

  async getById(auth: AuthContext, id: string): Promise<Student> {
    const student = await this.repo.findById(id);
    if (!student) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, student);
    const [address, emergencyContacts, documents] = await Promise.all([
      this.repo.findAddress(id),
      this.repo.findEmergency(id),
      this.repo.findDocuments(id),
    ]);
    return { ...student, address, emergencyContacts, documents };
  }

  async create(user: AuthUser, auth: AuthContext, dto: CreateStudentDto): Promise<Student> {
    const resolvedUnitId = dto.unitId || auth.defaultUnitId || auth.unitIds[0] || null;
    if (!resolvedUnitId) {
      throw new BadRequestException('unitId obrigatório — vincule uma unidade ao usuário');
    }

    const unit = await this.repo.getUnit(resolvedUnitId);
    if (!unit) throw new BadRequestException('Invalid unit');
    const companyId = dto.companyId || unit.company_id || auth.companyId;
    if (!companyId) throw new BadRequestException('companyId required');
    this.companyScope(auth, companyId);
    if (!auth.isSuperAdmin && auth.unitIds.length && !auth.unitIds.includes(resolvedUnitId)) {
      throw new ForbiddenException('Unit not allowed');
    }

    let cpf: string | null = null;
    try {
      cpf = assertValidCpf(dto.cpf);
    } catch {
      throw new BadRequestException('CPF inválido');
    }
    if (cpf) {
      const dup = await this.repo.findByCpf(companyId, cpf);
      if (dup) throw new ConflictException('CPF já cadastrado nesta empresa');
    }

    if (dto.birthDate && Number.isNaN(Date.parse(dto.birthDate))) {
      throw new BadRequestException('Data de nascimento inválida');
    }

    let registration = dto.registrationNumber?.trim();
    if (!registration) {
      const code = (unit.code || 'MX').toUpperCase();
      const n = (await this.repo.countByUnit(companyId, resolvedUnitId)) + 1;
      registration = `ATH-${code}-${String(n).padStart(6, '0')}`;
    }

    const status = dto.status || 'pre_registration';
    if (!STUDENT_STATUSES.includes(status as (typeof STUDENT_STATUSES)[number])) {
      throw new BadRequestException('Status inválido');
    }

    let student: Student;
    try {
      student = await this.repo.insertStudent({
        company_id: companyId,
        unit_id: resolvedUnitId,
        registration_number: registration,
        full_name: dto.fullName,
        social_name: dto.socialName || null,
        cpf,
        rg: dto.rg || null,
        birth_date: dto.birthDate || null,
        gender: dto.gender || null,
        marital_status: dto.maritalStatus || null,
        profession: dto.profession || null,
        email: dto.email || null,
        phone: dto.phone || null,
        whatsapp: dto.whatsapp || null,
        status,
        plan_name: dto.planName || null,
        trainer_name: dto.trainerName || null,
        notes: dto.notes || null,
        created_by: user.id,
      });
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : '';
      if (msg.toLowerCase().includes('duplicate') || msg.includes('unique')) {
        throw new ConflictException('Matrícula ou CPF já existente');
      }
      throw e;
    }

    if (dto.address) {
      await this.repo.upsertAddress(student.id, {
        zipcode: dto.address.zipcode || null,
        street: dto.address.street || null,
        number: dto.address.number || null,
        complement: dto.address.complement || null,
        district: dto.address.district || null,
        city: dto.address.city || null,
        state: dto.address.state || null,
        country: dto.address.country || 'Brasil',
      });
    }
    if (dto.emergencyContacts?.length) {
      await this.repo.replaceEmergency(
        student.id,
        dto.emergencyContacts.map((c) => ({
          name: c.name,
          relationship: c.relationship || null,
          phone: c.phone || null,
          whatsapp: c.whatsapp || null,
        })),
      );
    }

    await this.repo.insertHistory({
      student_id: student.id,
      old_status: null,
      new_status: status,
      reason: 'create',
      created_by: user.id,
    });

    this.events.emit(STUDENT_CREATED, {
      studentId: student.id,
      companyId,
      unitId: resolvedUnitId,
      fullName: student.fullName,
      planName: dto.planName || student.planName || null,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'students',
      action: 'create',
      entity: 'student',
      entityId: student.id,
    });

    return this.getById(auth, student.id);
  }

  async update(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: UpdateStudentDto,
  ): Promise<Student> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);

    let cpf: string | null | undefined = undefined;
    if (dto.cpf !== undefined) {
      try {
        cpf = assertValidCpf(dto.cpf);
      } catch {
        throw new BadRequestException('CPF inválido');
      }
      if (cpf) {
        const dup = await this.repo.findByCpf(existing.companyId, cpf, id);
        if (dup) throw new ConflictException('CPF já cadastrado nesta empresa');
      }
    }

    if (dto.birthDate && Number.isNaN(Date.parse(dto.birthDate))) {
      throw new BadRequestException('Data de nascimento inválida');
    }

    if (dto.unitId) {
      if (!auth.isSuperAdmin && auth.unitIds.length && !auth.unitIds.includes(dto.unitId)) {
        throw new BadRequestException('Sem acesso à unidade informada');
      }
      const unit = await this.repo.getUnit(dto.unitId);
      if (!unit) throw new BadRequestException('Unidade não encontrada');
    }

    if (dto.status && !STUDENT_STATUSES.includes(dto.status as (typeof STUDENT_STATUSES)[number])) {
      throw new BadRequestException('Status inválido');
    }

    const patch: Record<string, unknown> = { updated_by: user.id };
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId;
    if (dto.fullName !== undefined) patch.full_name = dto.fullName;
    if (dto.socialName !== undefined) patch.social_name = dto.socialName;
    if (cpf !== undefined) patch.cpf = cpf;
    if (dto.rg !== undefined) patch.rg = dto.rg;
    if (dto.birthDate !== undefined) patch.birth_date = dto.birthDate;
    if (dto.gender !== undefined) patch.gender = dto.gender;
    if (dto.maritalStatus !== undefined) patch.marital_status = dto.maritalStatus;
    if (dto.profession !== undefined) patch.profession = dto.profession;
    if (dto.email !== undefined) patch.email = dto.email;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.whatsapp !== undefined) patch.whatsapp = dto.whatsapp;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.planName !== undefined) patch.plan_name = dto.planName;
    if (dto.trainerName !== undefined) patch.trainer_name = dto.trainerName;
    if (dto.notes !== undefined) patch.notes = dto.notes;

    await this.repo.updateStudent(id, patch);
    if (dto.address) {
      await this.repo.upsertAddress(id, {
        zipcode: dto.address.zipcode || null,
        street: dto.address.street || null,
        number: dto.address.number || null,
        complement: dto.address.complement || null,
        district: dto.address.district || null,
        city: dto.address.city || null,
        state: dto.address.state || null,
        country: dto.address.country || 'Brasil',
      });
    }
    if (dto.emergencyContacts) {
      await this.repo.replaceEmergency(
        id,
        dto.emergencyContacts.map((c) => ({
          name: c.name,
          relationship: c.relationship || null,
          phone: c.phone || null,
          whatsapp: c.whatsapp || null,
        })),
      );
    }

    if (dto.status && dto.status !== existing.status) {
      await this.repo.insertHistory({
        student_id: id,
        old_status: existing.status,
        new_status: dto.status,
        reason: 'update',
        created_by: user.id,
      });
    }

    this.events.emit(STUDENT_UPDATED, {
      studentId: id,
      companyId: existing.companyId,
      unitId: dto.unitId ?? existing.unitId,
      planName: dto.planName !== undefined ? dto.planName : existing.planName,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'students',
      action: 'update',
      entity: 'student',
      entityId: id,
    });
    return this.getById(auth, id);
  }

  async remove(user: AuthUser, auth: AuthContext, id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);
    await this.repo.softDelete(id);
    await this.repo.insertHistory({
      student_id: id,
      old_status: existing.status,
      new_status: 'archived',
      reason: 'soft_delete',
      created_by: user.id,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'students',
      action: 'delete',
      entity: 'student',
      entityId: id,
    });
    return { ok: true };
  }

  async changeStatus(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: ChangeStatusDto,
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);
    if (!STUDENT_STATUSES.includes(dto.status as (typeof STUDENT_STATUSES)[number])) {
      throw new BadRequestException('Status inválido');
    }
    await this.repo.updateStudent(id, {
      status: dto.status,
      updated_by: user.id,
    });
    await this.repo.insertHistory({
      student_id: id,
      old_status: existing.status,
      new_status: dto.status,
      reason: dto.reason || null,
      created_by: user.id,
    });
    this.events.emit(STUDENT_STATUS_CHANGED, {
      studentId: id,
      companyId: existing.companyId,
      oldStatus: existing.status,
      newStatus: dto.status,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'students',
      action: 'status_change',
      entity: 'student',
      entityId: id,
      metadata: { from: existing.status, to: dto.status },
    });
    return this.getById(auth, id);
  }

  async transfer(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: TransferStudentDto,
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);
    const unit = await this.repo.getUnit(dto.unitId);
    if (!unit || unit.company_id !== existing.companyId) {
      throw new BadRequestException('Unidade inválida para a empresa');
    }
    if (!auth.isSuperAdmin && auth.unitIds.length && !auth.unitIds.includes(dto.unitId)) {
      throw new ForbiddenException('Unit not allowed');
    }
    await this.repo.updateStudent(id, {
      unit_id: dto.unitId,
      updated_by: user.id,
    });
    this.events.emit(STUDENT_TRANSFERRED, {
      studentId: id,
      companyId: existing.companyId,
      fromUnitId: existing.unitId,
      toUnitId: dto.unitId,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'students',
      action: 'transfer',
      entity: 'student',
      entityId: id,
      metadata: { from: existing.unitId, to: dto.unitId, reason: dto.reason },
    });
    return this.getById(auth, id);
  }

  async history(auth: AuthContext, id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);
    return this.repo.findHistory(id);
  }

  async timeline(auth: AuthContext, id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);
    return this.repo.fetchTimeline(id);
  }

  async summary(auth: AuthContext, id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);
    return this.repo.fetchStudentSummary(id);
  }

  async uploadPhoto(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (file.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException('Foto maior que o limite de 5MB');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo de foto inválido');
    }
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);

    const path = `companies/${existing.companyId}/students/${id}/photo.jpg`;
    const admin = this.supabase.getAdmin();
    const { error } = await admin.storage
      .from('student-photos')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
    if (error) throw new BadRequestException(error.message);

    const { data: pub } = admin.storage.from('student-photos').getPublicUrl(path);
    await this.repo.updateStudent(id, {
      photo_url: pub.publicUrl,
      updated_by: user.id,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'students',
      action: 'upload_photo',
      entity: 'student',
      entityId: id,
    });
    return this.getById(auth, id);
  }

  async uploadDocument(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    file: Express.Multer.File,
    type = 'other',
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (file.size > MAX_DOC_BYTES) {
      throw new BadRequestException('Documento maior que o limite de 10MB');
    }
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Student not found');
    this.assertCanAccess(auth, existing);

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `companies/${existing.companyId}/students/${id}/documents/${Date.now()}-${safeName}`;
    const admin = this.supabase.getAdmin();
    const { error } = await admin.storage
      .from('student-documents')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException(error.message);

    const doc = await this.repo.insertDocument({
      student_id: id,
      type,
      storage_path: path,
      file_name: file.originalname,
      created_by: user.id,
    });
    await this.audit.log({
      companyId: existing.companyId,
      userId: user.id,
      module: 'students',
      action: 'upload_document',
      entity: 'student_document',
      entityId: doc.id,
    });
    return doc;
  }

  async exportCsv(auth: AuthContext) {
    const companyIds = this.companyScope(auth);
    const ids =
      companyIds.length > 0
        ? companyIds
        : ['11111111-1111-1111-1111-111111111111'];
    const rows = await this.repo.exportRows(ids);
    const header =
      'registration_number,full_name,cpf,email,phone,status,plan_name,trainer_name,unit_id';
    const lines = rows.map((r) =>
      [
        r.registration_number,
        r.full_name,
        r.cpf || '',
        r.email || '',
        r.phone || '',
        r.status,
        r.plan_name || '',
        r.trainer_name || '',
        r.unit_id,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }

  async importCsv(user: AuthUser, auth: AuthContext, csv: string, unitId: string) {
    const lines = csv.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new BadRequestException('CSV vazio');
    const created: string[] = [];
    const errors: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const [registrationNumber, fullName, cpf, email, phone, status, planName, trainerName] =
        cols;
      if (!fullName) {
        errors.push(`linha ${i + 1}: nome obrigatório`);
        continue;
      }
      try {
        const s = await this.create(user, auth, {
          unitId,
          registrationNumber: registrationNumber || undefined,
          fullName,
          cpf: cpf || undefined,
          email: email || undefined,
          phone: phone || undefined,
          status: (status as CreateStudentDto['status']) || 'pre_registration',
          planName: planName || undefined,
          trainerName: trainerName || undefined,
        });
        created.push(s.id);
      } catch (e) {
        errors.push(`linha ${i + 1}: ${e instanceof Error ? e.message : 'erro'}`);
      }
    }
    return { created: created.length, ids: created, errors };
  }
}
