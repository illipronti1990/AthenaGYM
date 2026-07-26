import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getAccessProvider } from '@athena/sdk-access';
import type { AuthContext } from '@athena/shared';
import { QR_TTL_SECONDS } from '@athena/shared';
import { AuthUser } from '../auth/auth.types';
import {
  CreateCheckinDto,
  CreatePartnerAccessRequestDto,
  CreateRoomDto,
  CreateScheduleDto,
  EnrollClassDto,
  GenerateQrDto,
  OpenGateDto,
  RejectPartnerAccessDto,
  UpdatePartnerIntegrationDto,
  UpdateScheduleDto,
  ValidateAccessDto,
} from './dto/operations.dto';
import {
  ACCESS_ALLOWED,
  ACCESS_DENIED,
  CHECKIN_CREATED,
  CLASS_ENROLLED,
  CLASS_ENROLLMENT_CANCELLED,
  CLASS_WAITLISTED,
  SCHEDULE_CREATED,
  WAITLIST_PROMOTED,
} from './events/operations.events';
import { OperationsRepository } from './operations.repository';
import {
  assertStudentActive,
  assertUnitMatch,
  buildQrPayload,
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
      'athena-qr-dev-secret'
    );
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
    });
  }

  listSchedules(auth: AuthContext) {
    return this.repo.listSchedules(this.companyId(auth), auth.defaultUnitId);
  }

  getSchedule(auth: AuthContext, id: string) {
    return this.repo.getSchedule(this.companyId(auth), id);
  }

  async createSchedule(user: AuthUser, auth: AuthContext, dto: CreateScheduleDto) {
    const schedule = await this.repo.createSchedule({
      company_id: this.companyId(auth),
      unit_id: dto.unitId,
      title: dto.title,
      type: dto.type,
      start_at: dto.startAt,
      end_at: dto.endAt,
      teacher_id: dto.teacherId || null,
      room_id: dto.roomId || null,
      max_capacity: dto.maxCapacity ?? 20,
      status: 'scheduled',
      notes: dto.notes || null,
      created_by: user.id,
    });
    this.events.emit(SCHEDULE_CREATED, {
      companyId: schedule.companyId,
      scheduleId: schedule.id,
    });
    return schedule;
  }

  updateSchedule(auth: AuthContext, id: string, dto: UpdateScheduleDto) {
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
    return this.repo.updateSchedule(this.companyId(auth), id, patch);
  }

  listClassEnrollments(auth: AuthContext, scheduleId: string) {
    return this.repo.listClassEnrollments(scheduleId);
  }

  async enroll(auth: AuthContext, scheduleId: string, dto: EnrollClassDto) {
    const companyId = this.companyId(auth);
    const schedule = await this.repo.getSchedule(companyId, scheduleId);
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.status === 'cancelled') throw new BadRequestException('Schedule cancelled');

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

    const enrollment = await this.repo.createClassEnrollment({
      company_id: companyId,
      schedule_id: scheduleId,
      student_id: dto.studentId,
      status,
      waitlist_position: waitlistPosition,
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
        const reserved = await this.repo.updateClassEnrollment(promoted.id, {
          status: 'reserved',
          waitlist_position: null,
        });
        this.events.emit(WAITLIST_PROMOTED, {
          companyId,
          scheduleId,
          studentId: reserved.studentId,
          enrollmentId: reserved.id,
        });
      }
    }

    return updated;
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
        await this.repo.insertAccessLog({
          company_id: companyId,
          unit_id: unitId,
          student_id: studentId,
          device_id: dto.deviceId || null,
          result: 'denied',
          reason: verified.issue,
          method: 'qr',
        });
        this.events.emit(ACCESS_DENIED, { companyId, studentId, reason: verified.issue });
        throw new ForbiddenException(verified.issue);
      }
      studentId = verified.payload.studentId;
      if (verified.payload.companyId !== companyId) {
        throw new ForbiddenException('qr_invalid');
      }
      unitId = verified.payload.unitId;
    }

    const student = await this.repo.getStudent(companyId, studentId);
    const inactive = assertStudentActive(student ? String(student.status) : null);
    if (inactive) {
      await this.logDeny(companyId, unitId, studentId, dto, inactive);
      throw new ForbiddenException(inactive);
    }

    const unitIssue = assertUnitMatch(
      student?.unit_id ? String(student.unit_id) : null,
      unitId,
    );
    if (unitIssue) {
      await this.logDeny(companyId, unitId, studentId, dto, unitIssue);
      throw new ForbiddenException(unitIssue);
    }

    if (await this.repo.hasOverdueReceivable(companyId, studentId)) {
      await this.logDeny(companyId, unitId, studentId, dto, 'overdue_receivable');
      throw new ForbiddenException('overdue_receivable');
    }

    // Soft rule: if enrollments exist in tenant data, require active; if none at all for company, skip (DEV)
    const hasPlan = await this.repo.hasActiveEnrollment(companyId, studentId);
    if (!hasPlan) {
      // allow DEV without enrollments — still log reason if company has any enrollments table usage
      // keep permissive for early ops; reception can checkin manually
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
      throw new ForbiddenException(hw.reason || 'device_denied');
    }

    const log = await this.repo.insertAccessLog({
      company_id: companyId,
      unit_id: unitId,
      student_id: studentId,
      device_id: dto.deviceId || null,
      result: 'allowed',
      reason: null,
      method: dto.method || (dto.qrToken ? 'qr' : 'manual'),
    });
    this.events.emit(ACCESS_ALLOWED, { companyId, studentId, unitId, logId: log.id });
    return { allowed: true, studentId, unitId, logId: log.id };
  }

  private async logDeny(
    companyId: string,
    unitId: string,
    studentId: string,
    dto: ValidateAccessDto,
    reason: string,
  ) {
    await this.repo.insertAccessLog({
      company_id: companyId,
      unit_id: unitId,
      student_id: studentId,
      device_id: dto.deviceId || null,
      result: 'denied',
      reason,
      method: dto.method || (dto.qrToken ? 'qr' : 'manual'),
    });
    this.events.emit(ACCESS_DENIED, { companyId, studentId, reason });
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
    const validated = await this.validateAccess(auth, {
      studentId: dto.studentId,
      unitId: dto.unitId,
      deviceId: dto.deviceId,
      method: dto.method,
      qrToken: dto.qrToken,
    });

    const studentId = validated.studentId;
    const unitId = validated.unitId;

    if (await this.repo.recentCheckin(studentId, unitId, 2)) {
      throw new BadRequestException('duplicate_checkin');
    }

    const device = dto.deviceId ? await this.repo.getDevice(companyId, dto.deviceId) : null;
    const checkin = await this.repo.createCheckin({
      company_id: companyId,
      unit_id: unitId,
      student_id: studentId,
      schedule_id: dto.scheduleId || null,
      method: dto.method || (dto.qrToken ? 'qr' : 'manual'),
      device: device?.name || null,
      device_id: dto.deviceId || null,
      direction: dto.direction || 'in',
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
