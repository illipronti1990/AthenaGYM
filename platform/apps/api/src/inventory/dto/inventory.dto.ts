import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsUuidString } from '../../common/validators/is-uuid-string';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  qtyOnHand?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tracksStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProductDto extends CreateProductDto {}

export class CreateStockMovementDto {
  @ApiProperty()
  @IsUuidString()
  productId!: string;

  @ApiProperty({ enum: ['in', 'out', 'adjust', 'loss', 'internal_consume'] })
  @IsIn(['in', 'out', 'adjust', 'loss', 'internal_consume'])
  type!: 'in' | 'out' | 'adjust' | 'loss' | 'internal_consume';

  @ApiProperty()
  @IsNumber()
  qty!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class PosSaleItemDto {
  @ApiProperty()
  @IsUuidString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  qty!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreatePosSaleDto {
  @ApiProperty({ type: [PosSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosSaleItemDto)
  items!: PosSaleItemDto[];

  @ApiProperty({ enum: ['pix', 'card', 'cash', 'internal_credit', 'voucher'] })
  @IsIn(['pix', 'card', 'cash', 'internal_credit', 'voucher'])
  paymentMethod!: 'pix' | 'card' | 'cash' | 'internal_credit' | 'voucher';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class CreateSupplierDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSupplierDto extends CreateSupplierDto {}

export class PurchaseOrderItemDto {
  @ApiProperty()
  @IsUuidString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  qtyOrdered!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsUuidString()
  supplierId!: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUuidString()
  unitId?: string;
}

export class ReceivePurchaseItemDto {
  @ApiProperty()
  @IsUuidString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  qty!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class ReceivePurchaseDto {
  @ApiProperty({ type: [ReceivePurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseItemDto)
  items!: ReceivePurchaseItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InventoryCountLineDto {
  @ApiProperty()
  @IsUuidString()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  countedQty!: number;
}

export class CloseInventoryCountDto {
  @ApiProperty({ type: [InventoryCountLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryCountLineDto)
  lines!: InventoryCountLineDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
