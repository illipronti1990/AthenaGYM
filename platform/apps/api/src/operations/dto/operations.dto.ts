import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
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
  @IsUUID()
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
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
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
  @IsUUID()
  teacherId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
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
}

export class EnrollClassDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;
}

export class CreateCheckinDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  scheduleId?: string;

  @ApiPropertyOptional({ enum: ['qr', 'biometric', 'facial', 'manual', 'nfc'] })
  @IsOptional()
  @IsIn(['qr', 'biometric', 'facial', 'manual', 'nfc'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional({ enum: ['in', 'out'] })
  @IsOptional()
  @IsIn(['in', 'out'])
  direction?: 'in' | 'out';

  @ApiPropertyOptional({ description: 'Signed QR token (method=qr)' })
  @IsOptional()
  @IsString()
  qrToken?: string;
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
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['qr', 'biometric', 'facial', 'manual', 'nfc'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrToken?: string;
}

export class OpenGateDto {
  @ApiProperty()
  @IsUUID()
  deviceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;
}

export class CreateRoomDto {
  @ApiProperty()
  @IsUUID()
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
