import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateApiClientDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ type: [String], example: ['students.read', 'finance.read'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  scopes!: string[];

  @ApiPropertyOptional({ enum: ['production', 'sandbox'] })
  @IsOptional()
  @IsIn(['production', 'sandbox'])
  environment?: 'production' | 'sandbox';
}

export class OauthTokenDto {
  @ApiProperty({ enum: ['client_credentials', 'refresh_token'] })
  @IsIn(['client_credentials', 'refresh_token'])
  grantType!: 'client_credentials' | 'refresh_token';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Space-separated scopes (optional subset)' })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://partner.example.com/hooks/athena' })
  @IsUrl({ require_tld: false })
  url!: string;

  @ApiProperty({ type: [String], example: ['student.created', 'payment.confirmed'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events!: string[];

  @ApiPropertyOptional({ enum: ['production', 'sandbox'] })
  @IsOptional()
  @IsIn(['production', 'sandbox'])
  environment?: 'production' | 'sandbox';
}

export class CreateCheckinPublicDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitId?: string;
}

export class InstallPluginDto {
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  config?: Record<string, unknown>;
}

export class ConfigurePluginDto {
  @ApiProperty({ type: Object })
  config!: Record<string, unknown>;
}

export class CreateSandboxDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;
}

export class PublicListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
