import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'revenue' })
  @IsString()
  @IsIn(['checkins', 'revenue', 'sales', 'workouts'])
  source!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  fields!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groupBy?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shared?: boolean;
}

export class CreateExportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reportId?: string;

  @ApiProperty({ enum: ['excel', 'pdf', 'csv'] })
  @IsString()
  @IsIn(['excel', 'pdf', 'csv'])
  format!: 'excel' | 'pdf' | 'csv';

  @ApiPropertyOptional({ example: 'my_students' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  reportId!: string;

  @ApiProperty({ example: '0 8 * * 1' })
  @IsString()
  cron!: string;

  @ApiPropertyOptional({ enum: ['email', 'whatsapp', 'internal'] })
  @IsOptional()
  @IsString()
  @IsIn(['email', 'whatsapp', 'internal'])
  channel?: string;

  @ApiPropertyOptional({ enum: ['excel', 'pdf', 'csv'] })
  @IsOptional()
  @IsString()
  @IsIn(['excel', 'pdf', 'csv'])
  format?: 'excel' | 'pdf' | 'csv';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];
}

export class RunPredictionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn([
    'churn',
    'lead_conversion',
    'finance_risk',
    'revenue_month',
    'revenue_year',
    'cancellations',
    'enrollments',
    'cashflow',
    'frequency',
  ])
  type?: string;
}

export class AiInsightsDto {
  @ApiPropertyOptional({ example: 'Onde atacar a inadimplência?' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  question?: string;
}

export class AiChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsString()
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class AiChatDto {
  @ApiProperty({ example: 'Quanto faturei no mês?' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question!: string;

  @ApiPropertyOptional({ type: [AiChatHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiChatHistoryItemDto)
  history?: AiChatHistoryItemDto[];
}

export class CreateGoalDto {
  @ApiProperty({ example: 'revenue' })
  @IsString()
  @IsIn(['revenue', 'checkins', 'enrollments', 'renewals', 'profit'])
  metric!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  targetValue!: number;

  @ApiProperty({ example: '2026-08-01' })
  @IsString()
  periodStart!: string;

  @ApiProperty({ example: '2026-08-31' })
  @IsString()
  periodEnd!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;
}
