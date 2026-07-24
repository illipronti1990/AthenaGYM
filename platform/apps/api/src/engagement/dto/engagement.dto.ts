import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({ default: 'internal' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['push', 'email', 'whatsapp', 'sms', 'internal'] })
  @IsOptional()
  @IsIn(['push', 'email', 'whatsapp', 'sms', 'internal'])
  channel?: string;
}

export class CreateConversationDto {
  @ApiPropertyOptional({ default: 'direct' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: [String], description: 'Profile IDs of members' })
  @IsArray()
  memberIds!: string[];
}

export class CreateMessageDto {
  @ApiProperty()
  @IsUUID()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  content!: string;
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'winback' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ enum: ['push', 'email', 'whatsapp', 'sms', 'internal'] })
  @IsOptional()
  @IsIn(['push', 'email', 'whatsapp', 'sms', 'internal'])
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduleAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresMarketingConsent?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  audienceProfileIds?: string[];
}

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reward?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsReward?: number;
}

export class JoinChallengeDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;
}

export class AwardPointsDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ enum: ['checkin', 'workoutComplete', 'referral', 'earlyPayment', 'custom'] })
  @IsIn(['checkin', 'workoutComplete', 'referral', 'earlyPayment', 'custom'])
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  points?: number;
}

export class AiChatDto {
  @ApiProperty({ example: 'Qual treino tenho hoje?' })
  @IsString()
  question!: string;

  @ApiPropertyOptional({ enum: ['student', 'trainer', 'manager'] })
  @IsOptional()
  @IsIn(['student', 'trainer', 'manager'])
  role?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
