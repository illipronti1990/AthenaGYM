import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class AutosaveDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  formKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  kind!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  payload!: Record<string, unknown>;
}

export class SignatureDto {
  @ApiProperty()
  @IsString()
  dataUrl!: string;

  @ApiProperty()
  @IsString()
  entityType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;
}
