import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { IsUuidString } from '../../common/validators/is-uuid-string';

export class CreateReceivableDto {
  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  contractId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  subscriptionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  companyId?: string;
}

export class UpdateReceivableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  interest?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fine?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class RenegotiateDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  newAmount!: number;

  @ApiProperty()
  @IsDateString()
  newDueDate!: string;
}

export class InstallmentsDto {
  @ApiProperty()
  @IsNumber()
  @Min(2)
  count!: number;
}

export class CreatePayableDto {
  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsUuidString()
  studentId!: string;

  @ApiProperty()
  @IsUuidString()
  planId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  enrollmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  contractId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gateway?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recurrence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class CreatePixDto {
  @ApiProperty()
  @IsUUID()
  receivableId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gateway?: string;
}

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  bankName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  companyId?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pixKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateCostCenterDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class ReconciliationImportDto {
  @ApiProperty({ description: 'OFX or CSV content' })
  @IsString()
  content!: string;

  @ApiProperty({ enum: ['ofx', 'csv'] })
  @IsString()
  format!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  financialAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}
