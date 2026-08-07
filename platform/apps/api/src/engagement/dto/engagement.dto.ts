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
  IsNumber,
} from 'class-validator';
import { IsUuidString } from '../../common/validators/is-uuid-string';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  goalValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  ownerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  segmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;
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

// ---------- G-9 DTOs ----------

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ enum: ['whatsapp', 'email', 'sms', 'push'] })
  @IsOptional()
  @IsIn(['whatsapp', 'email', 'sms', 'push'])
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  variables?: string[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  variables?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SendTemplateDto {
  @ApiProperty({ description: 'Target profile/student ID' })
  @IsUUID()
  recipientId!: string;

  @ApiPropertyOptional({ description: 'Variable substitutions' })
  @IsOptional()
  variables?: Record<string, string>;
}

export class CreateReferralDto {
  @ApiProperty()
  @IsUUID()
  referrerStudentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referredLeadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referredStudentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RewardReferralDto {
  @ApiPropertyOptional({ description: 'Override benefit type' })
  @IsOptional()
  @IsString()
  benefitType?: string;

  @ApiPropertyOptional({ description: 'Override benefit value' })
  @IsOptional()
  @IsNumber()
  benefitValue?: number;
}

export class EarnLoyaltyDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ description: 'Earn rule event slug' })
  @IsString()
  event!: string;
}

export class RedeemLoyaltyDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty()
  @IsUuidString()
  rewardId!: string;
}

export class CreateNpsSurveyDto {
  @ApiPropertyOptional({ default: 'Pesquisa NPS' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  question?: string;
}

export class CreateNpsResponseDto {
  @ApiProperty()
  @IsUuidString()
  surveyId!: string;

  @ApiProperty({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  score!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ default: 'app' })
  @IsOptional()
  @IsString()
  channel?: string;
}

export class CreateSegmentDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  rules?: Record<string, unknown>;
}

export class UpdateSegmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  rules?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateAutomationFlowDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'lead_created' })
  @IsString()
  triggerEvent!: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  steps?: unknown[];
}

export class UpdateAutomationFlowDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  steps?: unknown[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class PortalNpsResponseDto {
  @ApiProperty({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  score!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class PortalReferralDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referredName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referredPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
