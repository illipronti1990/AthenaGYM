import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSavedFilterDto {
  @ApiProperty()
  @IsString()
  tableName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  filters!: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sort?: { id: string; desc: boolean } | null;
}

export class SaveTablePreferencesDto {
  @ApiProperty()
  @IsString()
  tableName!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  columns?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  columnOrder?: string[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  columnWidths?: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(200)
  pageSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sort?: { id: string; desc: boolean } | null;
}
