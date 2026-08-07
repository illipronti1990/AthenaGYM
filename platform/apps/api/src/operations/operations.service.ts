import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getAccessProvider } from '@movvo/sdk-access';
import type { AuthContext } from '@movvo/shared';
import {
  canCancelClassReservation,
  classCancelBlockMessage,
  CLASS_CANCEL_CUTOFF_MINUTES,
  QR_TTL_SECONDS,
} from '@movvo/shared';
import { randomUUID } from 'crypto';
import { AuthUser } from '../auth/auth.types';
import {
  AttendanceBatchDto,
  CopyWeekDto,
  CreateCheckinDto,
  CheckinByCpfDto,
  CheckinByCodeDto,
  CreateModalityDto,
  CreatePartnerAccessRequestDto,
  CreateRoomDto,
  CreateScheduleDto,
  EnrollClassDto,
  FromTemplateDto,
  GenerateQrDto,
  OpenGateDto,
  RejectPartnerAccessDto,
  UpdateAccessRulesDto,
  UpdateEnrollmentDto,
  UpdateModalityDto,
  UpdatePartnerIntegrationDto,
  UpdateRoomDto,
  UpdateScheduleDto,
  ValidateAccessDto,
} from './dto/operations.dto';
import {
  ACCESS_ALLOWED,
  ACCESS_DENIED,
  ATTENDANCE_MARKED,
  CHECKIN_CREATED,
  CLASS_COMPLETED,
  CLASS_ENROLLED,
  CLASS_ENROLLMENT_CANCELLED,
  CLASS_WAITLISTED,
  SCHEDULE_CANCELLED,
  SCHEDULE_CREATED,
  WAITLIST_PROMOTED,
} from './events/operations.events';
import { OperationsRepository } from './operations.repository';
import {
  assertStudentActive,
  assertUnitMatch,
  assertWithinSchedule,
  buildQrPayload,
  humanizeDenyReason,
  isClassFull,
  nextWaitlistPosition,
  signQrToken,
  verifyQrToken,
} from './operations.rules';

@Injectable()
export class OperationsService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  private unitId(auth: AuthContext, override?: string) {
    return override || auth.defaultUnitId || null;
  }

  private qrSecret() {
    return (
      this.config.get<string>('QR_SIGNING_SECRET') ||
      this.config.get<string>('DEV_JWT_SECRET') ||
      'movvo-qr-dev-secret'
    );
  }

  private async assertNoConflicts(
    companyId: string,
    startAt: string,
    endAt: string,
    teacherId?: string | null,
    roomId?: string | null,
    excludeId?: string,
  ) {
    const conflicts = await this.repo.findScheduleConflicts({
      companyId,
      startAt,
      endAt,
      teacherId,
      roomId,
      excludeId,
    });
    if (conflicts.teacherConflict) {
      throw new ConflictException({
        message: 'Professor já possui aula neste horário',
        code: 'teacher_conflict',
      });
    }
    if (conflicts.roomConflict) {
      throw new ConflictException({
        message: 'Sala já ocupada neste horário',
        code: 'room_conflict',
      });
    }
  }

  listRooms(auth: AuthContext) {
    return this.repo.listRooms(this.companyId(auth), auth.defaultUnitId);
  }

  createRoom(auth: AuthContext, dto: CreateRoomDto) {
    return this.repo.createRoom({
      company_id: this.companyId(auth),
      unit_id: dto.unitId,
      name: dto.name,
      capacity: dto.capacity ?? 20,
      area: dto.area || null,
      active: true,
      status: 'active',
      equipment_json: [],
    });
  }

  updateRoom(auth: AuthContext, id: string, dto: UpdateRoomDto) {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.capacity !== undefined) patch.capacity = dto.capacity;
    if (dto.area !== undefined) patch.area = dto.area;
    if (dto.active !== undefined) patch.active = dto.active;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.equipmentJson !== undefined) patch.equipment_json = dto.equipmentJson;
    return this.repo.updateRoom(this.companyId(auth), id, patch);
  }

  listModalities(auth: AuthContext) {
    return this.repo.listModalities(this.companyId(auth));
  }

  createModality(auth: AuthContext, dto: CreateModalityDto) {
    const slug =
      dto.slug ||
      dto.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return this.repo.createModality({
      company_id: this.companyId(auth),
      name: dto.name,
      slug,
      color: dto.color || '#0f766e',
      default_teacher_id: dto.defaultTeacherId || null,
      default_room_id: dto.defaultRoomId || null,
      default_capacity: dto.defaultCapacity ?? 20,
      active: true,
    });
  }

  updateModality(auth: AuthContext, id: string, dto: UpdateModalityDto) {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.color !== undefined) patch.color = dto.color;
    if (dto.defaultTeacherId !== undefined) patch.default_teacher_id = dto.defaultTeacherId;
    if (dto.defaultRoomId !== undefined) patch.default_room_id = dto.defaultRoomId;
    if (dto.defaultCapacity !== undefined) patch.default_capacity = dto.defaultCapacity;
    if (dto.active !== undefined) patch.active = dto.active;
    return this.repo.updateModality(this.companyId(auth), id, patch);
  }

  listSchedules(
    auth: AuthContext,
    filters: {
      from?: string;
      to?: string;
      type?: string;
      teacherId?: string;
      roomId?: string;
      modalityId?: string;
      view?: string;
    } = {},
  ) {
    return this.repo.listSchedules(this.companyId(auth), {
      unitId: auth.defaultUnitId,
      from: filters.from,
      to: filters.to,
      type: filters.type,
      teacherId: filters.teacherId,
      roomId: filters.roomId,
      modalityId: filters.modalityId,
    });
  }

  getSchedule(auth: AuthContext, id: string) {
    return this.repo.getSchedule(this.companyId(auth), id);
  }

  async createSchedule(user: AuthUser, auth: AuthContext, dto: CreateScheduleDto) {
    const companyId = this.companyId(auth);
    const isBlock = Boolean(dto.isBlock) || dto.type === 'maintenance';
    await this.assertNoConflicts(
      companyId,
      dto.startAt,
      dto.endAt,
      dto.teacherId,
      dto.roomId,
    );
    const schedule = await this.repo.createSchedule({
      company_id: companyId,
      unit_id: dto.unitId,
      title: dto.title,
      type: dto.type,
      start_at: dto.startAt,
      end_at: dto.endAt,
      teacher_id: dto.teacherId || null,
      room_id: dto.roomId || null,
      modality_id: dto.modalityId || null,
      color: dto.color || null,
      recurrence_rule: dto.recurrenceRule || null,
      series_id: dto.seriesId || null,
      is_block: isBlock,
      equipment_notes: dto.equipmentNotes || null,
      max_capacity: isBlock ? 0 : (dto.maxCapacity ?? 20),
      status: 'scheduled',
      notes: dto.notes || null,
      created_by: user.id,
    });
    await this.repo.insertScheduleAudit({
      company_id: companyId,
      schedule_id: schedule.id,
      actor_id: user.id,
      action: 'create',
      diff: { after: schedule },
    });
    this.events.emit(SCHEDULE_CREATED, {
      companyId: schedule.companyId,
      scheduleId: schedule.id,
    });
    return schedule;
  }

  async updateSchedule(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: UpdateScheduleDto,
  ) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getSchedule(companyId, id);
    if (!existing) throw new NotFoundException('Schedule not found');

    const startAt = dto.startAt ?? existing.startAt;
    const endAt = dto.endAt ?? existing.endAt;
    const teacherId = dto.teacherId !== undefined ? dto.teacherId : existing.teacherId;
    const roomId = dto.roomId !== undefined ? dto.roomId : existing.roomId;
    await this.assertNoConflicts(companyId, startAt, endAt, teacherId, roomId, id);

    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.type !== undefined) patch.type = dto.type;
    if (dto.startAt !== undefined) patch.start_at = dto.startAt;
    if (dto.endAt !== undefined) patch.end_at = dto.endAt;
    if (dto.teacherId !== undefined) patch.teacher_id = dto.teacherId;
    if (dto.roomId !== undefined) patch.room_id = dto.roomId;
    if (dto.maxCapacity !== undefined) patch.max_capacity = dto.maxCapacity;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.modalityId !== undefined) patch.modality_id = dto.modalityId;
    if (dto.color !== undefined) patch.color = dto.color;
    if (dto.recurrenceRule !== undefined) patch.recurrence_rule = dto.recurrenceRule;
    if (dto.seriesId !== undefined) patch.series_id = dto.seriesId;
    if (dto.isBlock !== undefined) patch.is_block = dto.isBlock;
    if (dto.equipmentNotes !== undefined) patch.equipment_notes = dto.equipmentNotes;

    const updated = await this.repo.updateSchedule(companyId, id, patch);
    await this.repo.insertScheduleAudit({
      company_id: companyId,
      schedule_id: id,
      actor_id: user.id,
      action: 'update',
      diff: { before: existing, after: updated },
    });
    return updated;
  }

  async cancelSchedule(user: AuthUser, auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.getSchedule(companyId, id);
    if (!existing) throw new NotFoundException('Schedule not found');
    const updated = await this.repo.updateSchedule(companyId, id, { status: 'cancelled' });
    await this.repo.insertScheduleAudit({
      company_id: companyId,
      schedule_id: id,
      actor_id: user.id,
      action: 'cancel',
      diff: { before: existing, after: updated },
    });
    this.events.emit(SCHEDULE_CANCELLED, { companyId, scheduleId: id });
    return updated;
  }

  async copyWeek(user: AuthUser, auth: AuthContext, dto: CopyWeekDto) {
    const companyId = this.companyId(auth);
    const sourceStart = new Date(dto.sourceWeekStart);
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setDate(sourceEnd.getDate() + 7);
    const targetStart = new Date(dto.targetWeekStart);
    const deltaMs = targetStart.getTime() - sourceStart.getTime();

    const source = await this.repo.listSchedules(companyId, {
      unitId: dto.unitId || auth.defaultUnitId,
      from: sourceStart.toISOString(),
      to: sourceEnd.toISOString(),
    });
    const seriesId = randomUUID();
    const created = [];
    for (const s of source) {
      if (s.status === 'cancelled') continue;
      const startAt = new Date(new Date(s.startAt).getTime() + deltaMs).toISOString();
      const endAt = new Date(new Date(s.endAt).getTime() + deltaMs).toISOString();
      try {
        await this.assertNoConflicts(companyId, startAt, endAt, s.teacherId, s.roomId);
      } catch {
        continue;
      }
      const row = await this.repo.createSchedule({
        company_id: companyId,
        unit_id: s.unitId,
        title: s.title,
        type: s.type,
        start_at: startAt,
        end_at: endAt,
        teacher_id: s.teacherId,
        room_id: s.roomId,
        modality_id: s.modalityId,
        color: s.color,
        recurrence_rule: s.recurrenceRule,
        series_id: seriesId,
        is_block: s.isBlock,
        equipment_notes: s.equipmentNotes,
        max_capacity: s.maxCapacity,
        status: 'scheduled',
        notes: s.notes,
        created_by: user.id,
      });
      created.push(row);
    }
    return { seriesId, created: created.length, items: created };
  }

  async fromTemplate(user: AuthUser, auth: AuthContext, dto: FromTemplateDto) {
    const companyId = this.companyId(auth);
    const weekStart = new Date(dto.weekStart);
    const seriesId = randomUUID();
    const created = [];
    for (const t of dto.templates || []) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + Number(t.weekday || 0));
      const [sh, sm] = String(t.startTime || '08:00').split(':').map(Number);
      const [eh, em] = String(t.endTime || '09:00').split(':').map(Number);
      const startAt = new Date(day);
      startAt.setHours(sh || 8, sm || 0, 0, 0);
      const endAt = new Date(day);
      endAt.setHours(eh || 9, em || 0, 0, 0);
      await this.assertNoConflicts(
        companyId,
        startAt.toISOString(),
        endAt.toISOString(),
        t.teacherId,
        t.roomId,
      );
      const row = await this.repo.createSchedule({
        company_id: companyId,
        unit_id: dto.unitId,
        title: t.title,
        type: t.type || 'class',
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        teacher_id: t.teacherId || null,
        room_id: t.roomId || null,
        modality_id: t.modalityId || null,
        color: t.color || null,
        series_id: seriesId,
        is_block: false,
        max_capacity: t.maxCapacity ?? 20,
        status: 'scheduled',
        created_by: user.id,
      });
      created.push(row);
    }
    return { seriesId, created: created.length, items: created };
  }

  listClassEnrollments(auth: AuthContext, scheduleId: string) {
    return this.repo.listClassEnrollments(scheduleId);
  }

  async enroll(auth: AuthContext, scheduleId: string, dto: EnrollClassDto) {
    const companyId = this.companyId(auth);
    const schedule = await this.repo.getSchedule(companyId, scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.status === 'cancelled') throw new BadRequestException('Schedule cancelled');
    if (schedule.isBlock) throw new BadRequestException('Cannot enroll in block');

    const existing = await this.repo.findClassEnrollment(scheduleId, dto.studentId);
    if (existing && existing.status !== 'cancelled') {
      throw new BadRequestException('Student already enrolled');
    }

    const counts = await this.repo.countEnrollments(scheduleId);
    let status: 'reserved' | 'waitlist' = 'reserved';
    let waitlistPosition: number | null = null;

    if (isClassFull(counts.reserved, schedule.maxCapacity)) {
      status = 'waitlist';
      const positions = await this.repo.waitlistPositions(scheduleId);
      waitlistPosition = nextWaitlistPosition(positions);
    }

    const enrollment = existing
      ? await this.repo.updateClassEnrollment(existing.id, {
          status,
          waitlist_position: waitlistPosition,
          cancelled_at: null,
          source: 'manual',
        })
      : await this.repo.createClassEnrollment({
          company_id: companyId,
          schedule_id: scheduleId,
          student_id: dto.studentId,
          status,
          waitlist_position: waitlistPosition,
          source: 'manual',
        });

    this.events.emit(status === 'waitlist' ? CLASS_WAITLISTED : CLASS_ENROLLED, {
      companyId,
      scheduleId,
      studentId: dto.studentId,
      enrollmentId: enrollment.id,
      status,
    });

    return enrollment;
  }

  async cancelEnroll(auth: AuthContext, scheduleId: string, studentId: string) {
    const companyId = this.companyId(auth);
    const existing = await this.repo.findClassEnrollment(scheduleId, studentId);
    if (!existing) throw new NotFoundException('Enrollment not found');

    const updated = await this.repo.updateClassEnrollment(existing.id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      waitlist_position: null,
    });

    this.events.emit(CLASS_ENROLLMENT_CANCELLED, {
      companyId,
      scheduleId,
      studentId,
      enrollmentId: updated.id,
    });

    if (existing.status === 'reserved' || existing.status === 'checked_in') {
      const promoted = await this.repo.firstWaitlisted(scheduleId);
      if (promoted) {
        const promo = await this.repo.updateClassEnrollment(promoted.id, {
          status: 'reserved',
          waitlist_position: null,
        });
        this.events.emit(WAITLIST_PROMOTED, {
          companyId,
          scheduleId,
          studentId: promoted.studentId,
          enrollmentId: promo.id,
        });
      }
    }

    return updated;
  }

  async updateEnrollment(
    user: AuthUser,
    auth: AuthContext,
    scheduleId: string,
    enrollmentId: string,
    dto: UpdateEnrollmentDto,
  ) {
    const companyId = this.companyId(auth);
    const enrollment = await this.repo.getEnrollment(companyId, scheduleId, enrollmentId);
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    const patch: Record<string, unknown> = { status: dto.status, marked_by: user.id };
    if (dto.status === 'checked_in') {
      patch.checkin_at = new Date().toISOString();
      patch.attended_at = new Date().toISOString();
      patch.source = 'manual';
    }
    if (dto.status === 'no_show') {
      patch.attended_at = null;
    }
    if (dto.status === 'cancelled') {
      patch.cancelled_at = new Date().toISOString();
      patch.waitlist_position = null;
    }
    return this.repo.updateClassEnrollment(enrollmentId, patch);
  }

  async attendanceBatch(
    user: AuthUser,
    auth: AuthContext,
    scheduleId: string,
    dto: AttendanceBatchDto,
  ) {
    const companyId = this.companyId(auth);
    const schedule = await this.repo.getSchedule(companyId, scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');
    const results = [];
    for (const item of dto.items || []) {
      const enrollment = await this.repo.getEnrollment(companyId, scheduleId, item.enrollmentId);
      if (!enrollment) continue;
      const patch: Record<string, unknown> = {
        status: item.status,
        marked_by: user.id,
        source: 'manual',
      };
      if (item.status === 'checked_in') {
        patch.checkin_at = new Date().toISOString();
        patch.attended_at = new Date().toISOString();
      }
      results.push(await this.repo.updateClassEnrollment(item.enrollmentId, patch));
    }
    this.events.emit(ATTENDANCE_MARKED, {
      companyId,
      scheduleId,
      count: results.length,
      actorId: user.id,
    });
    return { updated: results.length, items: results };
  }

  async completeClass(user: AuthUser, auth: AuthContext, scheduleId: string) {
    const companyId = this.companyId(auth);
    const schedule = await this.repo.getSchedule(companyId, scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');
    const updated = await this.repo.updateSchedule(companyId, scheduleId, {
      status: 'completed',
    });
    const enrollments = await this.repo.listClassEnrollments(scheduleId);
    const checkedIn = enrollments.filter((e) => e.status === 'checked_in').length;

    const log = await this.repo.insertPartnerApiLog({
      company_id: companyId,
      provider: 'wellhub',
      endpoint: 'partners.recordClassConsumption',
      status: 'stub_ok',
      http_status: 200,
      error: null,
      payload: {
        scheduleId,
        title: schedule.title,
        checkedIn,
        note: 'G-8 stub — Wellhub/TotalPass consumption not billed',
      },
      payload_hash: null,
      duration_ms: 1,
    });

    this.events.emit(CLASS_COMPLETED, {
      companyId,
      scheduleId,
      actorId: user.id,
      partnerLogId: String(log.id),
    });

    return { schedule: updated, partnerLog: { id: log.id, status: log.status, httpStatus: 200 } };
  }

  agendaDashboard(auth: AuthContext) {
    return this.repo.agendaDashboard(this.companyId(auth), auth.defaultUnitId);
  }

  agendaKpis(auth: AuthContext, from?: string, to?: string) {
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 3600_000);
    return this.repo.agendaKpis(this.companyId(auth), start.toISOString(), end.toISOString());
  }

  teacherAgenda(auth: AuthContext, from?: string, to?: string) {
    return this.repo.listSchedules(this.companyId(auth), {
      unitId: auth.defaultUnitId,
      teacherId: auth.userId,
      from,
      to,
    });
  }

  agendaSuggestions(auth: AuthContext) {
    return this.repo.agendaSuggestions(this.companyId(auth));
  }

  async portalAgenda(auth: AuthContext) {
    const companyId = this.companyId(auth);
    const email = (auth.email || '').trim();
    if (!email) throw new BadRequestException('email required');
    const student = await this.repo.findStudentByEmail(companyId, email);
    if (!student) throw new NotFoundException('Ficha de aluno não encontrada para este usuário');
    const studentId = String(student.id);
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 30 * 24 * 3600_000).toISOString();
    const schedules = await this.repo.listSchedules(companyId, { from, to });
    const enrolledUpcoming = [];
    for (const s of schedules) {
      const enrollment = await this.repo.findClassEnrollment(s.id, studentId);
      if (enrollment && enrollment.status !== 'cancelled') {
        enrolledUpcoming.push({
          schedule: s,
          enrollment,
          kind: s.type,
          canCancel: canCancelClassReservation(s.startAt),
          cancelBlockedReason: classCancelBlockMessage(s.startAt),
          cancelCutoffMinutes: CLASS_CANCEL_CUTOFF_MINUTES,
        });
      }
    }
    const enrolledIds = new Set(enrolledUpcoming.map((x) => x.schedule.id));
    return {
      student: {
        id: studentId,
        fullName: String(student.full_name),
        email: student.email ? String(student.email) : null,
      },
      upcoming: enrolledUpcoming,
      openClasses: schedules
        .filter(
          (s) =>
            s.type === 'class' &&
            s.status === 'scheduled' &&
            !s.isBlock &&
            !enrolledIds.has(s.id),
        )
        .slice(0, 20),
      cancelCutoffMinutes: CLASS_CANCEL_CUTOFF_MINUTES,
    };
  }

  async portalEnroll(auth: AuthContext, scheduleId: string) {
    const companyId = this.companyId(auth);
    const email = (auth.email || '').trim();
    if (!email) throw new BadRequestException('email required');
    const student = await this.repo.findStudentByEmail(companyId, email);
    if (!student) throw new NotFoundException('Ficha de aluno não encontrada');
    return this.enroll(auth, scheduleId, { studentId: String(student.id) });
  }

  async portalCancelEnroll(auth: AuthContext, scheduleId: string) {
    const companyId = this.companyId(auth);
    const email = (auth.email || '').trim();
    if (!email) throw new BadRequestException('email required');
    const student = await this.repo.findStudentByEmail(companyId, email);
    if (!student) throw new NotFoundException('Ficha de aluno não encontrada');

    const schedule = await this.repo.getSchedule(companyId, scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');
    const blocked = classCancelBlockMessage(schedule.startAt);
    if (blocked) throw new BadRequestException(blocked);

    return this.cancelEnroll(auth, scheduleId, String(student.id));
  }

  generateQr(auth: AuthContext, dto: GenerateQrDto) {
    const companyId = this.companyId(auth);
    const unitId = this.unitId(auth, dto.unitId);
    if (!unitId) throw new BadRequestException('unitId required');
    const payload = buildQrPayload(dto.studentId, companyId, unitId, QR_TTL_SECONDS);
    const token = signQrToken(payload, this.qrSecret());
    return {
      token,
      expiresIn: QR_TTL_SECONDS,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      payload,
    };
  }

  async validateAccess(auth: AuthContext, dto: ValidateAccessDto) {
    const companyId = this.companyId(auth);
    let studentId = dto.studentId;
    let unitId = this.unitId(auth, dto.unitId);
    if (!unitId) throw new BadRequestException('unitId required');

    if (dto.qrToken) {
      const verified = verifyQrToken(dto.qrToken, this.qrSecret());
      if (!verified.ok) {
        const reasonLabel = humanizeDenyReason(verified.issue);
        await this.repo.insertAccessLog({
          company_id: companyId,
          unit_id: unitId,
          student_id: studentId || null,
          device_id: dto.deviceId || null,
          result: 'denied',
          reason: verified.issue,
          reason_label: reasonLabel,
          method: 'qr',
        });
        this.events.emit(ACCESS_DENIED, { companyId, studentId, reason: verified.issue });
        throw new ForbiddenException({ code: verified.issue, message: reasonLabel });
      }
      studentId = verified.payload.studentId;
      if (verified.payload.companyId !== companyId) {
        throw new ForbiddenException({ code: 'qr_invalid', message: humanizeDenyReason('qr_invalid') });
      }
      unitId = verified.payload.unitId;
    }

    if (!studentId) {
      throw new BadRequestException('studentId required');
    }

    const rules = await this.repo.getAccessRules(companyId, unitId);
    const scheduleIssue = assertWithinSchedule(rules);
    if (scheduleIssue) {
      await this.logDeny(companyId, unitId, studentId, dto, scheduleIssue);
      throw new ForbiddenException({
        code: scheduleIssue,
        message: humanizeDenyReason(scheduleIssue),
      });
    }

    const student = await this.repo.getStudent(companyId, studentId);
    const inactive = assertStudentActive(student ? String(student.status) : null);
    if (inactive) {
      await this.logDeny(companyId, unitId, studentId, dto, inactive);
      throw new ForbiddenException({ code: inactive, message: humanizeDenyReason(inactive) });
    }

    const unitIssue = assertUnitMatch(
      student?.unit_id ? String(student.unit_id) : null,
      unitId,
    );
    if (unitIssue) {
      await this.logDeny(companyId, unitId, studentId, dto, unitIssue);
      throw new ForbiddenException({ code: unitIssue, message: humanizeDenyReason(unitIssue) });
    }

    if (rules.blockOverdue) {
      const days = await this.repo.overdueDays(companyId, studentId);
      if (days != null && days > (rules.graceDays || 0)) {
        await this.logDeny(companyId, unitId, studentId, dto, 'overdue_receivable', days);
        throw new ForbiddenException({
          code: 'overdue_receivable',
          message: humanizeDenyReason('overdue_receivable', days),
        });
      }
    }

    if (rules.blockFrozen && (await this.repo.hasFrozenEnrollment(companyId, studentId))) {
      await this.logDeny(companyId, unitId, studentId, dto, 'enrollment_frozen');
      throw new ForbiddenException({
        code: 'enrollment_frozen',
        message: humanizeDenyReason('enrollment_frozen'),
      });
    }

    const companyUsesEnrollments = await this.repo.companyHasAnyEnrollment(companyId);
    if (companyUsesEnrollments) {
      const active = await this.repo.getActiveEnrollmentEndDate(companyId, studentId);
      if (!active) {
        if (rules.blockExpiredPlan) {
          await this.logDeny(companyId, unitId, studentId, dto, 'no_active_enrollment');
          throw new ForbiddenException({
            code: 'no_active_enrollment',
            message: humanizeDenyReason('no_active_enrollment'),
          });
        }
      } else if (rules.blockExpiredPlan && active.end_date) {
        const end = new Date(active.end_date);
        const graceEnd = new Date(end);
        graceEnd.setDate(graceEnd.getDate() + (rules.graceDays || 0));
        if (graceEnd.getTime() < Date.now()) {
          await this.logDeny(companyId, unitId, studentId, dto, 'plan_expired');
          throw new ForbiddenException({
            code: 'plan_expired',
            message: humanizeDenyReason('plan_expired'),
          });
        }
      }
    }

    const checkinsToday = await this.repo.countCheckinsToday(companyId, studentId, unitId);
    if (checkinsToday >= rules.maxCheckinsPerDay) {
      await this.logDeny(companyId, unitId, studentId, dto, 'max_checkins_reached');
      throw new ForbiddenException({
        code: 'max_checkins_reached',
        message: humanizeDenyReason('max_checkins_reached'),
      });
    }

    if (await this.repo.recentCheckin(studentId, unitId, rules.minIntervalMinutes)) {
      await this.logDeny(companyId, unitId, studentId, dto, 'duplicate_checkin');
      throw new ForbiddenException({
        code: 'duplicate_checkin',
        message: humanizeDenyReason('duplicate_checkin'),
      });
    }

    const device = dto.deviceId ? await this.repo.getDevice(companyId, dto.deviceId) : null;
    const provider = getAccessProvider(device?.provider || 'stub');
    const hw = await provider.validate({
      studentId,
      companyId,
      unitId,
      deviceId: dto.deviceId,
      method: dto.method,
    });
    if (!hw.allowed) {
      await this.logDeny(companyId, unitId, studentId, dto, hw.reason || 'device_denied');
      throw new ForbiddenException({
        code: hw.reason || 'device_denied',
        message: humanizeDenyReason(hw.reason || 'device_denied'),
      });
    }

    const log = await this.repo.insertAccessLog({
      company_id: companyId,
      unit_id: unitId,
      student_id: studentId,
      device_id: dto.deviceId || null,
      result: 'allowed',
      reason: null,
      reason_label: null,
      method: dto.method || (dto.qrToken ? 'qr' : 'manual'),
      partner: dto.partner || null,
    });
    this.events.emit(ACCESS_ALLOWED, { companyId, studentId, unitId, logId: log.id });
    return {
      allowed: true,
      studentId,
      unitId,
      logId: log.id,
      studentName: student?.full_name ? String(student.full_name) : null,
    };
  }

  private async logDeny(
    companyId: string,
    unitId: string,
    studentId: string,
    dto: ValidateAccessDto,
    reason: string,
    overdueDays?: number,
  ) {
    const reasonLabel = humanizeDenyReason(reason, overdueDays);
    await this.repo.insertAccessLog({
      company_id: companyId,
      unit_id: unitId,
      student_id: studentId,
      device_id: dto.deviceId || null,
      result: 'denied',
      reason,
      reason_label: reasonLabel,
      method: dto.method || (dto.qrToken ? 'qr' : 'manual'),
      partner: dto.partner || null,
    });
    this.events.emit(ACCESS_DENIED, { companyId, studentId, reason, reasonLabel });
  }

  async openGate(auth: AuthContext, dto: OpenGateDto) {
    const companyId = this.companyId(auth);
    const device = await this.repo.getDevice(companyId, dto.deviceId);
    if (!device) throw new NotFoundException('Device not found');
    if (device.status !== 'active') throw new BadRequestException('Device offline');

    const provider = getAccessProvider(device.provider);
    const result = await provider.openGate({
      deviceId: device.id,
      companyId,
      unitId: device.unitId,
      studentId: dto.studentId,
    });
    return { ...result, provider: provider.name, deviceId: device.id };
  }

  async createCheckin(auth: AuthContext, dto: CreateCheckinDto) {
    const companyId = this.companyId(auth);
    let studentId = dto.studentId;

    if (!studentId && dto.cpf) {
      const byCpf = await this.repo.findStudentByCpf(companyId, dto.cpf);
      if (!byCpf) throw new NotFoundException('Aluno não encontrado para o CPF');
      studentId = String(byCpf.id);
    }
    if (!studentId && dto.code) {
      const byCode = await this.repo.findStudentByAccessCode(companyId, dto.code);
      if (!byCode) throw new NotFoundException('Aluno não encontrado para o código');
      studentId = String(byCode.id);
    }
    if (!studentId && !dto.qrToken) {
      throw new BadRequestException('studentId, cpf, code ou qrToken obrigatório');
    }

    const method =
      dto.method ||
      (dto.cpf ? 'cpf' : dto.code ? 'code' : dto.qrToken ? 'qr' : dto.partner ? 'partner' : 'manual');

    const validated = await this.validateAccess(auth, {
      studentId,
      unitId: dto.unitId,
      deviceId: dto.deviceId,
      method,
      qrToken: dto.qrToken,
      partner: dto.partner,
    });

    studentId = validated.studentId;
    const unitId = validated.unitId;

    const device = dto.deviceId ? await this.repo.getDevice(companyId, dto.deviceId) : null;
    const checkin = await this.repo.createCheckin({
      company_id: companyId,
      unit_id: unitId,
      student_id: studentId,
      schedule_id: dto.scheduleId || null,
      method,
      device: device?.name || null,
      device_id: dto.deviceId || null,
      direction: dto.direction || 'in',
      partner: dto.partner || null,
      external_checkin_id: dto.externalCheckinId || null,
    });

    if (dto.scheduleId) {
      const enrollment = await this.repo.findClassEnrollment(dto.scheduleId, studentId);
      if (enrollment && enrollment.status === 'reserved') {
        await this.repo.updateClassEnrollment(enrollment.id, {
          status: 'checked_in',
          checkin_at: checkin.createdAt,
        });
      }
    }

    if (dto.deviceId && (dto.direction || 'in') === 'in') {
      await this.openGate(auth, { deviceId: dto.deviceId, studentId });
    }

    this.events.emit(CHECKIN_CREATED, {
      companyId,
      unitId,
      studentId,
      checkinId: checkin.id,
      method: checkin.method,
      scheduleId: checkin.scheduleId,
    });

    return checkin;
  }

  async createCheckinByCpf(auth: AuthContext, dto: CheckinByCpfDto) {
    return this.createCheckin(auth, {
      cpf: dto.cpf,
      unitId: dto.unitId,
      direction: dto.direction,
      method: 'cpf',
    });
  }

  async createCheckinByCode(auth: AuthContext, dto: CheckinByCodeDto) {
    return this.createCheckin(auth, {
      code: dto.code,
      unitId: dto.unitId,
      direction: dto.direction,
      method: 'code',
    });
  }

  getAccessRules(auth: AuthContext, unitId?: string) {
    return this.repo.getAccessRules(this.companyId(auth), unitId || auth.defaultUnitId);
  }

  async updateAccessRules(auth: AuthContext, dto: UpdateAccessRulesDto) {
    const companyId = this.companyId(auth);
    const unitId = dto.unitId || auth.defaultUnitId || null;
    const current = await this.repo.getAccessRules(companyId, unitId);
    return this.repo.upsertAccessRules({
      company_id: companyId,
      unit_id: unitId,
      max_checkins_per_day: dto.maxCheckinsPerDay ?? current.maxCheckinsPerDay,
      min_interval_minutes: dto.minIntervalMinutes ?? current.minIntervalMinutes,
      block_overdue: dto.blockOverdue ?? current.blockOverdue,
      block_expired_plan: dto.blockExpiredPlan ?? current.blockExpiredPlan,
      block_frozen: dto.blockFrozen ?? current.blockFrozen,
      grace_days: dto.graceDays ?? current.graceDays,
      allowed_weekdays: dto.allowedWeekdays ?? current.allowedWeekdays,
      allowed_hours_json: dto.allowedHoursJson ?? current.allowedHoursJson,
      updated_at: new Date().toISOString(),
    });
  }

  liveAccess(auth: AuthContext, limit = 30) {
    return this.repo.listLiveAccess(this.companyId(auth), auth.defaultUnitId, limit);
  }

  presence(auth: AuthContext) {
    const unitId = auth.defaultUnitId;
    if (!unitId) throw new BadRequestException('unitId required');
    return this.repo.presence(this.companyId(auth), unitId);
  }

  agendaTimeline(auth: AuthContext, from?: string, to?: string) {
    const unitId = auth.defaultUnitId;
    if (!unitId) throw new BadRequestException('unitId required');
    const start = from || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    const end = to || new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
    return this.repo.agendaCheckins(this.companyId(auth), unitId, start, end);
  }

  operationsDashboard(auth: AuthContext) {
    const unitId = auth.defaultUnitId;
    if (!unitId) throw new BadRequestException('unitId required');
    return this.repo.operationsKpis(this.companyId(auth), unitId);
  }

  history(auth: AuthContext, studentId?: string) {
    return this.repo.listCheckins(this.companyId(auth), studentId, auth.defaultUnitId);
  }

  occupancy(auth: AuthContext) {
    const unitId = auth.defaultUnitId;
    if (!unitId) throw new BadRequestException('unitId required');
    return this.repo.dashboard(this.companyId(auth), unitId);
  }

  listDevices(auth: AuthContext) {
    return this.repo.listDevices(this.companyId(auth), auth.defaultUnitId);
  }

  async providerHealth(auth: AuthContext, deviceId?: string) {
    const companyId = this.companyId(auth);
    if (deviceId) {
      const device = await this.repo.getDevice(companyId, deviceId);
      if (!device) throw new NotFoundException('Device not found');
      return getAccessProvider(device.provider).health();
    }
    return getAccessProvider('stub').health();
  }

  listPartnerIntegrations(auth: AuthContext) {
    return this.repo.listPartnerIntegrations(this.companyId(auth));
  }

  async updatePartnerIntegration(auth: AuthContext, dto: UpdatePartnerIntegrationDto) {
    const companyId = this.companyId(auth);
    return this.repo.upsertPartnerIntegration({
      company_id: companyId,
      provider: dto.provider,
      enabled: dto.enabled ?? true,
      status: dto.enabled === false ? 'disconnected' : 'connected',
      external_gym_id: dto.externalGymId ?? null,
      notes: dto.notes ?? null,
      updated_at: new Date().toISOString(),
    });
  }

  listPartnerAccessRequests(auth: AuthContext, status?: string) {
    return this.repo.listPartnerAccessRequests(this.companyId(auth), status);
  }

  async createPartnerAccessRequest(auth: AuthContext, dto: CreatePartnerAccessRequestDto) {
    const companyId = this.companyId(auth);
    const integrations = await this.repo.listPartnerIntegrations(companyId);
    const integration = integrations.find((i) => i.provider === dto.provider);
    if (integration && !integration.enabled) {
      throw new BadRequestException(`${dto.provider} integration disabled`);
    }
    return this.repo.insertPartnerAccessRequest({
      company_id: companyId,
      unit_id: dto.unitId || this.unitId(auth) || null,
      provider: dto.provider,
      status: 'pending',
      member_name: dto.memberName,
      member_document: dto.memberDocument || null,
      member_email: dto.memberEmail || null,
      external_member_id: dto.externalMemberId || null,
      external_booking_id: dto.externalBookingId || null,
      student_id: dto.studentId || null,
      raw_payload: { source: 'ops_console' },
    });
  }

  async approvePartnerAccess(user: AuthUser, auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const req = await this.repo.getPartnerAccessRequest(companyId, id);
    if (!req) throw new NotFoundException('Partner access request not found');
    if (req.status !== 'pending') {
      throw new BadRequestException(`Request already ${req.status}`);
    }

    let checkinId: string | null = null;
    const unitId = req.unitId || this.unitId(auth);
    if (req.studentId && unitId) {
      try {
        const checkin = await this.createCheckin(auth, {
          studentId: req.studentId,
          unitId,
          method: 'partner',
          partner: req.provider,
        });
        checkinId = checkin.id;
      } catch (err) {
        // Partner guest may already be checked in; still allow approval.
        if (!(err instanceof BadRequestException)) throw err;
      }
    }

    return this.repo.updatePartnerAccessRequest(id, {
      status: 'approved',
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      checkin_id: checkinId,
      reject_reason: null,
    });
  }

  async rejectPartnerAccess(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: RejectPartnerAccessDto,
  ) {
    const companyId = this.companyId(auth);
    const req = await this.repo.getPartnerAccessRequest(companyId, id);
    if (!req) throw new NotFoundException('Partner access request not found');
    if (req.status !== 'pending') {
      throw new BadRequestException(`Request already ${req.status}`);
    }
    return this.repo.updatePartnerAccessRequest(id, {
      status: 'rejected',
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      reject_reason: dto.reason || 'Recusado na recepção',
    });
  }
}
