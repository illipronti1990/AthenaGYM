import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
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

  @ApiPropertyOptional({ example: 'revenue' })
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
  @ApiPropertyOptional({ enum: ['churn', 'lead_conversion', 'finance_risk'] })
  @IsOptional()
  @IsString()
  @IsIn(['churn', 'lead_conversion', 'finance_risk'])
  type?: string;
}

export class AiInsightsDto {
  @ApiProperty({ example: 'Qual unidade teve maior inadimplência?' })
  @IsString()
  @MinLength(3)
  question!: string;
}
