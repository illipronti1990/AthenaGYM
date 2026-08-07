import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthContext } from '@athena/shared';
import { CurrentAuth, CurrentUser } from '../common/decorators/current.decorators';
import { Permissions } from '../common/decorators/rbac.decorators';
import {
  CompanyGuard,
  PermissionsGuard,
  UnitGuard,
} from '../common/guards/rbac.guards';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CloseInventoryCountDto,
  CreatePosSaleDto,
  CreateProductDto,
  CreatePurchaseOrderDto,
  CreateStockMovementDto,
  CreateSupplierDto,
  ReceivePurchaseDto,
  UpdateProductDto,
  UpdateSupplierDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, CompanyGuard, UnitGuard)
@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('inventory/categories')
  @Permissions('inventory.read')
  categories(@CurrentAuth() auth: AuthContext) {
    return this.inventory.listCategories(auth);
  }

  @Get('inventory/products')
  @Permissions('inventory.read')
  products(
    @CurrentAuth() auth: AuthContext,
    @Query('q') q?: string,
    @Query('active') active?: string,
  ) {
    return this.inventory.listProducts(
      auth,
      q,
      active == null ? undefined : active === 'true',
    );
  }

  @Get('inventory/products/lookup')
  @Permissions('inventory.read', 'pdv.sell')
  lookup(@CurrentAuth() auth: AuthContext, @Query('code') code = '') {
    return this.inventory.lookupProduct(auth, code);
  }

  @Get('inventory/products/:id')
  @Permissions('inventory.read')
  product(@CurrentAuth() auth: AuthContext, @Param('id') id: string) {
    return this.inventory.getProduct(auth, id);
  }

  @Post('inventory/products')
  @Permissions('inventory.manage')
  createProduct(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateProductDto,
  ) {
    return this.inventory.createProduct(user, auth, dto);
  }

  @Patch('inventory/products/:id')
  @Permissions('inventory.manage')
  updateProduct(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventory.updateProduct(user, auth, id, dto);
  }

  @Delete('inventory/products/:id')
  @Permissions('inventory.manage')
  deleteProduct(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.inventory.deleteProduct(user, auth, id);
  }

  @Get('inventory/movements')
  @Permissions('inventory.read')
  movements(@CurrentAuth() auth: AuthContext) {
    return this.inventory.listMovements(auth);
  }

  @Post('inventory/movements')
  @Permissions('inventory.manage', 'inventory.adjust')
  createMovement(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.inventory.createMovement(user, auth, dto);
  }

  @Post('pdv/sales')
  @Permissions('pdv.sell')
  createSale(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePosSaleDto,
  ) {
    return this.inventory.createSale(user, auth, dto);
  }

  @Post('pdv/sales/:id/cancel')
  @Permissions('pdv.cancel')
  cancelSale(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
  ) {
    return this.inventory.cancelSale(user, auth, id);
  }

  @Get('inventory/suppliers')
  @Permissions('purchases.read', 'inventory.read')
  suppliers(@CurrentAuth() auth: AuthContext) {
    return this.inventory.listSuppliers(auth);
  }

  @Post('inventory/suppliers')
  @Permissions('purchases.manage')
  createSupplier(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.inventory.createSupplier(user, auth, dto);
  }

  @Patch('inventory/suppliers/:id')
  @Permissions('purchases.manage')
  updateSupplier(
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.inventory.updateSupplier(auth, id, dto);
  }

  @Get('inventory/purchases')
  @Permissions('purchases.read')
  purchases(@CurrentAuth() auth: AuthContext) {
    return this.inventory.listPurchaseOrders(auth);
  }

  @Post('inventory/purchases')
  @Permissions('purchases.manage')
  createPurchase(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.inventory.createPurchaseOrder(user, auth, dto);
  }

  @Post('inventory/purchases/:id/receive')
  @Permissions('purchases.manage')
  receivePurchase(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseDto,
  ) {
    return this.inventory.receivePurchase(user, auth, id, dto);
  }

  @Get('inventory/counts')
  @Permissions('inventory.read')
  counts(@CurrentAuth() auth: AuthContext) {
    return this.inventory.listInventoryCounts(auth);
  }

  @Post('inventory/counts')
  @Permissions('inventory.adjust', 'inventory.manage')
  startCount(@CurrentUser() user: AuthUser, @CurrentAuth() auth: AuthContext) {
    return this.inventory.startInventoryCount(user, auth);
  }

  @Post('inventory/counts/:id/close')
  @Permissions('inventory.adjust')
  closeCount(
    @CurrentUser() user: AuthUser,
    @CurrentAuth() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: CloseInventoryCountDto,
  ) {
    return this.inventory.closeInventoryCount(user, auth, id, dto);
  }

  @Get('inventory/alerts')
  @Permissions('inventory.read')
  alerts(@CurrentAuth() auth: AuthContext) {
    return this.inventory.alerts(auth);
  }

  @Get('inventory/dashboard')
  @Permissions('inventory.read')
  dashboard(@CurrentAuth() auth: AuthContext) {
    return this.inventory.dashboard(auth);
  }

  @Get('inventory/export')
  @Permissions('inventory.read', 'reports.export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @ApiOperation({ summary: 'Export CSV estoque/vendas/compras' })
  exportCsv(
    @CurrentAuth() auth: AuthContext,
    @Query('kind') kind: 'inventory' | 'top_sellers' | 'stale' | 'purchases' = 'inventory',
  ) {
    return this.inventory.exportCsv(auth, kind);
  }
}
