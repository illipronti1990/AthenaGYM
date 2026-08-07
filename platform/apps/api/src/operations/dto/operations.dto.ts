import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsUuidString } from '../../common/validators/is-uuid-string';

const SCHEDULE_TYPES = [
  'class',
  'assessment',
  'personal',
  'nutrition',
  'event',
  'maintenance',
  'reservation',
] as const;

export class CreateScheduleDto {
  @ApiProperty()
  @IsUuidString()
  unitId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: SCHEDULE_TYPES })
  @IsIn(SCHEDULE_TYPES)
  type!: (typeof SCHEDULE_TYPES)[number];

  @ApiProperty()
  @IsISO8601()
  startAt!: string;

  @ApiProperty()
  @IsISO8601()
  endAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  roomId?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  modalityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  seriesId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBlock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipmentNotes?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(SCHEDULE_TYPES)
  type?: (typeof SCHEDULE_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  endAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  teacherId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  roomId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['scheduled', 'cancelled', 'completed', 'in_progress'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  modalityId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recurrenceRule?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  seriesId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBlock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipmentNotes?: string | null;
}

export class CopyWeekDto {
  @ApiProperty()
  @IsISO8601()
  sourceWeekStart!: string;

  @ApiProperty()
  @IsISO8601()
  targetWeekStart!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class FromTemplateDto {
  @ApiProperty()
  @IsUuidString()
  unitId!: string;

  @ApiProperty()
  @IsISO8601()
  weekStart!: string;

  @ApiProperty({ type: 'array' })
  templates!: Array<{
    title: string;
    type?: string;
    weekday: number;
    startTime: string;
    endTime: string;
    teacherId?: string;
    roomId?: string;
    modalityId?: string;
    maxCapacity?: number;
    color?: string;
  }>;
}

export class CreateModalityDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  defaultTeacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  defaultRoomId?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultCapacity?: number;
}

export class UpdateModalityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  defaultTeacherId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  defaultRoomId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRoomDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['active', 'maintenance', 'inactive'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  equipmentJson?: unknown[];
}

export class UpdateEnrollmentDto {
  @ApiProperty({ enum: ['no_show', 'checked_in', 'reserved', 'cancelled'] })
  @IsIn(['no_show', 'checked_in', 'reserved', 'cancelled'])
  status!: string;
}

export class AttendanceItemDto {
  @ApiProperty()
  @IsUuidString()
  enrollmentId!: string;

  @ApiProperty({ enum: ['checked_in', 'no_show', 'reserved'] })
  @IsIn(['checked_in', 'no_show', 'reserved'])
  status!: 'checked_in' | 'no_show' | 'reserved';
}

export class AttendanceBatchDto {
  @ApiProperty({ type: [AttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  items!: AttendanceItemDto[];
}

export class EnrollClassDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;
}

export class CreateCheckinDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  scheduleId?: string;

  @ApiPropertyOptional({
    enum: ['qr', 'biometric', 'facial', 'manual', 'nfc', 'partner', 'cpf', 'code'],
  })
  @IsOptional()
  @IsIn(['qr', 'biometric', 'facial', 'manual', 'nfc', 'partner', 'cpf', 'code'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  deviceId?: string;

  @ApiPropertyOptional({ enum: ['in', 'out'] })
  @IsOptional()
  @IsIn(['in', 'out'])
  direction?: 'in' | 'out';

  @ApiPropertyOptional({ description: 'Signed QR token (method=qr)' })
  @IsOptional()
  @IsString()
  qrToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  code?: string;

  @ApiPropertyOptional({ enum: ['wellhub', 'totalpass'] })
  @IsOptional()
  @IsIn(['wellhub', 'totalpass'])
  partner?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalCheckinId?: string;
}

export class CheckinByCpfDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20)
  cpf!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional({ enum: ['in', 'out'] })
  @IsOptional()
  @IsIn(['in', 'out'])
  direction?: 'in' | 'out';
}

export class CheckinByCodeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional({ enum: ['in', 'out'] })
  @IsOptional()
  @IsIn(['in', 'out'])
  direction?: 'in' | 'out';
}

export class UpdateAccessRulesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxCheckinsPerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minIntervalMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blockOverdue?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blockExpiredPlan?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  blockFrozen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  graceDays?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  allowedWeekdays?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  allowedHoursJson?: { start: string; end: string };

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class GenerateQrDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class ValidateAccessDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['qr', 'biometric', 'facial', 'manual', 'nfc', 'partner', 'cpf', 'code'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['wellhub', 'totalpass'])
  partner?: string;
}

export class OpenGateDto {
  @ApiProperty()
  @IsUuidString()
  deviceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;
}

export class CreateRoomDto {
  @ApiProperty()
  @IsUuidString()
  unitId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;
}

const PARTNER_PROVIDERS = ['wellhub', 'totalpass'] as const;

export class CreatePartnerAccessRequestDto {
  @ApiProperty({ enum: PARTNER_PROVIDERS })
  @IsIn(PARTNER_PROVIDERS)
  provider!: (typeof PARTNER_PROVIDERS)[number];

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  memberName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  memberDocument?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  memberEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalMemberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalBookingId?: string;
}

export class RejectPartnerAccessDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class UpdatePartnerIntegrationDto {
  @ApiProperty({ enum: PARTNER_PROVIDERS })
  @IsIn(PARTNER_PROVIDERS)
  provider!: (typeof PARTNER_PROVIDERS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalGymId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
