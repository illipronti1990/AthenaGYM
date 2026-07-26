import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class DashboardLayoutItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsBoolean()
  visible!: boolean;

  @ApiProperty()
  @IsNumber()
  order!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  collapsed?: boolean;
}

export class PatchDashboardLayoutDto {
  @ApiProperty({ type: [DashboardLayoutItemDto] })
  @IsArray()
  layout!: DashboardLayoutItemDto[];
}
