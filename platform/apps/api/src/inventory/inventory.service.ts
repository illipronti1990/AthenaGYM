import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthContext } from '@athena/shared';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/auth.types';
import { FinanceService } from '../finance/finance.service';
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
import { InventoryRepository } from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly finance: FinanceService,
    private readonly audit: AuditService,
  ) {}

  private companyId(auth: AuthContext) {
    if (!auth.companyId) throw new BadRequestException('companyId required');
    return auth.companyId;
  }

  listCategories(auth: AuthContext) {
    return this.repo.listCategories(this.companyId(auth));
  }

  listProducts(auth: AuthContext, q?: string, active?: boolean) {
    return this.repo.listProducts(this.companyId(auth), { q, active });
  }

  async getProduct(auth: AuthContext, id: string) {
    const p = await this.repo.getProduct(this.companyId(auth), id);
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  lookupProduct(auth: AuthContext, code: string) {
    return this.repo.findProductByCode(this.companyId(auth), code);
  }

  async createProduct(user: AuthUser, auth: AuthContext, dto: CreateProductDto) {
    const companyId = this.companyId(auth);
    const product = await this.repo.insertProduct({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId,
      category_id: dto.categoryId || null,
      supplier_id: dto.supplierId || null,
      name: dto.name,
      sku: dto.sku,
      barcode: dto.barcode || null,
      brand: dto.brand || null,
      uom: dto.uom || 'un',
      cost_price: dto.costPrice ?? 0,
      sale_price: dto.salePrice ?? 0,
      min_stock: dto.minStock ?? 0,
      qty_on_hand: dto.qtyOnHand ?? 0,
      photo_url: dto.photoUrl || null,
      description: dto.description || null,
      expiry_date: dto.expiryDate || null,
      tracks_stock: dto.tracksStock !== false,
      active: dto.active !== false,
      created_by: user.id,
    });
    if ((dto.qtyOnHand || 0) > 0) {
      await this.repo.insertMovement({
        company_id: companyId,
        unit_id: product.unitId,
        product_id: product.id,
        type: 'in',
        qty: dto.qtyOnHand,
        unit_cost: dto.costPrice ?? 0,
        reason: 'Saldo inicial',
        actor_id: user.id,
        ref_type: 'product_create',
        ref_id: product.id,
      });
    }
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'inventory',
      action: 'create_product',
      entity: 'product',
      entityId: product.id,
    });
    return product;
  }

  async updateProduct(user: AuthUser, auth: AuthContext, id: string, dto: UpdateProductDto) {
    const companyId = this.companyId(auth);
    await this.getProduct(auth, id);
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.sku !== undefined) patch.sku = dto.sku;
    if (dto.barcode !== undefined) patch.barcode = dto.barcode;
    if (dto.categoryId !== undefined) patch.category_id = dto.categoryId;
    if (dto.supplierId !== undefined) patch.supplier_id = dto.supplierId;
    if (dto.unitId !== undefined) patch.unit_id = dto.unitId;
    if (dto.brand !== undefined) patch.brand = dto.brand;
    if (dto.uom !== undefined) patch.uom = dto.uom;
    if (dto.costPrice !== undefined) patch.cost_price = dto.costPrice;
    if (dto.salePrice !== undefined) patch.sale_price = dto.salePrice;
    if (dto.minStock !== undefined) patch.min_stock = dto.minStock;
    if (dto.photoUrl !== undefined) patch.photo_url = dto.photoUrl;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.expiryDate !== undefined) patch.expiry_date = dto.expiryDate;
    if (dto.tracksStock !== undefined) patch.tracks_stock = dto.tracksStock;
    if (dto.active !== undefined) patch.active = dto.active;
    const updated = await this.repo.updateProduct(companyId, id, patch);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'inventory',
      action: 'update_product',
      entity: 'product',
      entityId: id,
    });
    return updated;
  }

  async deleteProduct(user: AuthUser, auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    await this.getProduct(auth, id);
    await this.repo.softDeleteProduct(companyId, id);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'inventory',
      action: 'delete_product',
      entity: 'product',
      entityId: id,
    });
    return { ok: true };
  }

  listMovements(auth: AuthContext) {
    return this.repo.listMovements(this.companyId(auth));
  }

  async createMovement(user: AuthUser, auth: AuthContext, dto: CreateStockMovementDto) {
    const companyId = this.companyId(auth);
    if (dto.type === 'adjust' || dto.type === 'loss') {
      if (!auth.permissions?.includes('inventory.adjust') && !auth.isSuperAdmin) {
        throw new ForbiddenException('inventory.adjust required');
      }
    }
    const product = await this.getProduct(auth, dto.productId);
    if (product.tracksStock && (dto.type === 'out' || dto.type === 'loss' || dto.type === 'internal_consume')) {
      if (product.qtyOnHand < Math.abs(dto.qty)) {
        throw new BadRequestException('Estoque insuficiente');
      }
    }
    const movement = await this.repo.insertMovement({
      company_id: companyId,
      unit_id: dto.unitId || product.unitId || auth.defaultUnitId,
      product_id: dto.productId,
      type: dto.type,
      qty: Math.abs(dto.qty),
      unit_cost: dto.unitCost ?? product.costPrice,
      reason: dto.reason || null,
      actor_id: user.id,
    });
    await this.repo.applyStockDelta(companyId, dto.productId, dto.type, dto.qty);
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'inventory',
      action: `stock_${dto.type}`,
      entity: 'stock_movement',
      entityId: movement.id,
    });
    return this.repo.getProduct(companyId, dto.productId);
  }

  async createSale(user: AuthUser, auth: AuthContext, dto: CreatePosSaleDto) {
    const companyId = this.companyId(auth);
    if (!dto.items?.length) throw new BadRequestException('Informe itens');
    const needsCash = ['pix', 'card', 'cash'].includes(dto.paymentMethod);
    if (needsCash) {
      const session = await this.finance.currentCashSession(auth, auth.defaultUnitId || undefined);
      if (!session) {
        throw new BadRequestException('Abra o caixa antes de vender com PIX/cartão/dinheiro');
      }
    }

    const lines: Array<{
      productId: string;
      productName: string;
      qty: number;
      unitPrice: number;
      unitCost: number;
      lineTotal: number;
      tracksStock: boolean;
    }> = [];

    for (const item of dto.items) {
      const product = await this.getProduct(auth, item.productId);
      if (!product.active) throw new BadRequestException(`Produto inativo: ${product.name}`);
      if (product.tracksStock && product.qtyOnHand < item.qty) {
        throw new BadRequestException(`Estoque insuficiente: ${product.name}`);
      }
      const unitPrice = item.unitPrice ?? product.salePrice;
      lines.push({
        productId: product.id,
        productName: product.name,
        qty: item.qty,
        unitPrice,
        unitCost: product.costPrice,
        lineTotal: Number((unitPrice * item.qty).toFixed(2)),
        tracksStock: product.tracksStock,
      });
    }

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const discount = Math.min(dto.discount || 0, subtotal);
    const total = Number((subtotal - discount).toFixed(2));
    const costTotal = Number(
      lines.reduce((s, l) => s + l.unitCost * l.qty, 0).toFixed(2),
    );

    const saleRow = await this.repo.insertSale({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId,
      student_id: dto.studentId || null,
      cashier_id: user.id,
      status: 'completed',
      payment_method: dto.paymentMethod,
      discount,
      subtotal,
      total,
      cost_total: costTotal,
      notes: dto.notes || null,
    });
    const saleId = String(saleRow.id);

    await this.repo.insertSaleItems(
      lines.map((l) => ({
        sale_id: saleId,
        product_id: l.productId,
        product_name: l.productName,
        qty: l.qty,
        unit_price: l.unitPrice,
        unit_cost: l.unitCost,
        line_total: l.lineTotal,
      })),
    );

    for (const l of lines) {
      if (!l.tracksStock) continue;
      await this.repo.insertMovement({
        company_id: companyId,
        unit_id: dto.unitId || auth.defaultUnitId,
        product_id: l.productId,
        type: 'out',
        qty: l.qty,
        unit_cost: l.unitCost,
        reason: `Venda PDV ${saleId.slice(0, 8)}`,
        actor_id: user.id,
        ref_type: 'pos_sale',
        ref_id: saleId,
      });
      await this.repo.applyStockDelta(companyId, l.productId, 'out', l.qty);
    }

    const payment = await this.finance.registerPosSalePayment(user, auth, {
      studentId: dto.studentId,
      description: `Venda PDV #${saleId.slice(0, 8)}`,
      amount: total,
      discount,
      unitId: dto.unitId || auth.defaultUnitId,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
    });

    const sale = await this.repo.updateSale(companyId, saleId, {
      receivable_id: payment.receivable.id,
    });

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'pdv',
      action: 'sale',
      entity: 'pos_sale',
      entityId: saleId,
    });
    return sale;
  }

  async cancelSale(user: AuthUser, auth: AuthContext, id: string) {
    const companyId = this.companyId(auth);
    const sale = await this.repo.getSale(companyId, id);
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status === 'cancelled') throw new BadRequestException('Venda já cancelada');

    for (const item of sale.items || []) {
      const product = await this.repo.getProduct(companyId, item.productId);
      if (product?.tracksStock) {
        await this.repo.insertMovement({
          company_id: companyId,
          unit_id: sale.unitId,
          product_id: item.productId,
          type: 'in',
          qty: item.qty,
          unit_cost: item.unitCost,
          reason: `Estorno PDV ${id.slice(0, 8)}`,
          actor_id: user.id,
          ref_type: 'pos_sale_cancel',
          ref_id: id,
        });
        await this.repo.applyStockDelta(companyId, item.productId, 'in', item.qty);
      }
    }

    if (sale.receivableId) {
      try {
        await this.finance.updateReceivable(auth, sale.receivableId, { status: 'cancelled' });
      } catch {
        /* ignore */
      }
    }

    const updated = await this.repo.updateSale(companyId, id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'pdv',
      action: 'cancel',
      entity: 'pos_sale',
      entityId: id,
    });
    return updated;
  }

  listSuppliers(auth: AuthContext) {
    return this.repo.listSuppliers(this.companyId(auth));
  }

  async createSupplier(user: AuthUser, auth: AuthContext, dto: CreateSupplierDto) {
    const companyId = this.companyId(auth);
    const s = await this.repo.insertSupplier({
      company_id: companyId,
      name: dto.name,
      document: dto.document || null,
      email: dto.email || null,
      phone: dto.phone || null,
      contact_name: dto.contactName || null,
      address: dto.address || null,
      notes: dto.notes || null,
      active: dto.active !== false,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'purchases',
      action: 'create_supplier',
      entity: 'supplier',
      entityId: s.id,
    });
    return s;
  }

  async updateSupplier(auth: AuthContext, id: string, dto: UpdateSupplierDto) {
    const companyId = this.companyId(auth);
    return this.repo.updateSupplier(companyId, id, {
      name: dto.name,
      document: dto.document,
      email: dto.email,
      phone: dto.phone,
      contact_name: dto.contactName,
      address: dto.address,
      notes: dto.notes,
      active: dto.active,
    });
  }

  listPurchaseOrders(auth: AuthContext) {
    return this.repo.listPurchaseOrders(this.companyId(auth));
  }

  async createPurchaseOrder(user: AuthUser, auth: AuthContext, dto: CreatePurchaseOrderDto) {
    const companyId = this.companyId(auth);
    if (!dto.items?.length) throw new BadRequestException('Informe itens');
    let total = 0;
    for (const item of dto.items) {
      const product = await this.getProduct(auth, item.productId);
      const cost = item.unitCost ?? product.costPrice;
      total += cost * item.qtyOrdered;
    }
    const po = await this.repo.insertPurchaseOrder({
      company_id: companyId,
      unit_id: dto.unitId || auth.defaultUnitId,
      supplier_id: dto.supplierId,
      status: 'ordered',
      expected_at: dto.expectedAt || null,
      notes: dto.notes || null,
      total: Number(total.toFixed(2)),
      created_by: user.id,
    });
    const poId = String(po.id);
    await this.repo.insertPurchaseOrderItems(
      dto.items.map((item) => ({
        purchase_order_id: poId,
        product_id: item.productId,
        qty_ordered: item.qtyOrdered,
        qty_received: 0,
        unit_cost: item.unitCost ?? 0,
      })),
    );
    return this.repo.getPurchaseOrder(companyId, poId);
  }

  async receivePurchase(
    user: AuthUser,
    auth: AuthContext,
    purchaseOrderId: string,
    dto: ReceivePurchaseDto,
  ) {
    const companyId = this.companyId(auth);
    const po = await this.repo.getPurchaseOrder(companyId, purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status === 'cancelled' || po.status === 'received') {
      throw new BadRequestException('Pedido não pode ser recebido');
    }
    if (!dto.items?.length) throw new BadRequestException('Informe itens');

    let total = 0;
    for (const item of dto.items) {
      const product = await this.getProduct(auth, item.productId);
      const unitCost = item.unitCost ?? product.costPrice;
      total += unitCost * item.qty;
      await this.repo.insertMovement({
        company_id: companyId,
        unit_id: po.unitId || auth.defaultUnitId,
        product_id: item.productId,
        type: 'in',
        qty: item.qty,
        unit_cost: unitCost,
        reason: `Recebimento compra ${purchaseOrderId.slice(0, 8)}`,
        actor_id: user.id,
        ref_type: 'purchase_receipt',
        ref_id: purchaseOrderId,
      });
      await this.repo.applyStockDelta(companyId, item.productId, 'in', item.qty);
      const line = po.items?.find((i) => i.productId === item.productId);
      if (line) {
        await this.repo.updatePurchaseOrderItem(line.id, {
          qty_received: Number(line.qtyReceived) + item.qty,
          unit_cost: unitCost,
        });
      }
      if (unitCost !== product.costPrice) {
        await this.repo.updateProduct(companyId, item.productId, { cost_price: unitCost });
      }
    }

    const payable = await this.finance.createPayableForPurchase(user, auth, {
      supplierId: po.supplierId,
      description: `Compra estoque #${purchaseOrderId.slice(0, 8)}`,
      amount: Number(total.toFixed(2)),
      unitId: po.unitId,
      notes: dto.notes,
    });

    const receipt = await this.repo.insertReceipt({
      company_id: companyId,
      purchase_order_id: purchaseOrderId,
      payable_id: payable.id,
      received_by: user.id,
      notes: dto.notes || null,
      total: Number(total.toFixed(2)),
    });
    await this.repo.insertReceiptItems(
      dto.items.map((i) => ({
        receipt_id: String(receipt.id),
        product_id: i.productId,
        qty: i.qty,
        unit_cost: i.unitCost ?? 0,
      })),
    );

    const refreshed = await this.repo.getPurchaseOrder(companyId, purchaseOrderId);
    const allReceived = (refreshed?.items || []).every(
      (i) => i.qtyReceived >= i.qtyOrdered,
    );
    await this.repo.updatePurchaseOrder(companyId, purchaseOrderId, {
      status: allReceived ? 'received' : 'partial',
      total: Number(
        ((refreshed?.items || []).reduce((s, i) => s + i.qtyReceived * i.unitCost, 0)).toFixed(
          2,
        ),
      ),
    });

    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'purchases',
      action: 'receive',
      entity: 'purchase_order',
      entityId: purchaseOrderId,
    });
    return this.repo.getPurchaseOrder(companyId, purchaseOrderId);
  }

  async startInventoryCount(user: AuthUser, auth: AuthContext) {
    const companyId = this.companyId(auth);
    const products = await this.repo.listProducts(companyId, { active: true });
    const count = await this.repo.insertInventoryCount({
      company_id: companyId,
      unit_id: auth.defaultUnitId,
      status: 'open',
      created_by: user.id,
    });
    const countId = String(count.id);
    await this.repo.insertInventoryCountLines(
      products
        .filter((p) => p.tracksStock)
        .map((p) => ({
          count_id: countId,
          product_id: p.id,
          system_qty: p.qtyOnHand,
          counted_qty: null,
          difference: null,
        })),
    );
    return this.repo.getInventoryCount(companyId, countId);
  }

  listInventoryCounts(auth: AuthContext) {
    return this.repo.listInventoryCounts(this.companyId(auth));
  }

  async closeInventoryCount(
    user: AuthUser,
    auth: AuthContext,
    id: string,
    dto: CloseInventoryCountDto,
  ) {
    const companyId = this.companyId(auth);
    if (!auth.permissions?.includes('inventory.adjust') && !auth.isSuperAdmin) {
      throw new ForbiddenException('inventory.adjust required');
    }
    const count = await this.repo.getInventoryCount(companyId, id);
    if (!count) throw new NotFoundException('Inventory count not found');
    if (count.status !== 'open') throw new BadRequestException('Contagem já fechada');

    for (const line of dto.lines) {
      const existing = count.lines?.find((l) => l.productId === line.productId);
      const systemQty = existing?.systemQty ?? 0;
      const diff = Number((line.countedQty - systemQty).toFixed(3));
      if (existing) {
        await this.repo.updateInventoryCountLine(existing.id, {
          counted_qty: line.countedQty,
          difference: diff,
        });
      }
      if (diff !== 0) {
        await this.repo.insertMovement({
          company_id: companyId,
          unit_id: count.unitId || auth.defaultUnitId,
          product_id: line.productId,
          type: 'adjust',
          qty: diff,
          unit_cost: 0,
          reason: `Inventário ${id.slice(0, 8)}`,
          actor_id: user.id,
          ref_type: 'inventory_count',
          ref_id: id,
        });
        await this.repo.applyStockDelta(companyId, line.productId, 'adjust', diff);
      }
    }

    await this.repo.updateInventoryCount(companyId, id, {
      status: 'closed',
      closed_by: user.id,
      closed_at: new Date().toISOString(),
      notes: dto.notes || count.notes,
    });
    await this.audit.log({
      companyId,
      userId: user.id,
      module: 'inventory',
      action: 'close_count',
      entity: 'inventory_count',
      entityId: id,
    });
    return this.repo.getInventoryCount(companyId, id);
  }

  alerts(auth: AuthContext) {
    return this.repo.buildAlerts(this.companyId(auth));
  }

  dashboard(auth: AuthContext) {
    return this.repo.buildDashboard(this.companyId(auth));
  }

  async exportCsv(
    auth: AuthContext,
    kind: 'inventory' | 'top_sellers' | 'stale' | 'purchases',
  ) {
    if (kind === 'inventory') {
      const products = await this.listProducts(auth, undefined, true);
      const header = 'sku,name,category,qty,cost,sale,min_stock';
      const lines = products.map((p) =>
        [p.sku, p.name, p.categoryName || '', p.qtyOnHand, p.costPrice, p.salePrice, p.minStock]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      return [header, ...lines].join('\n');
    }
    if (kind === 'top_sellers') {
      const dash = await this.dashboard(auth);
      const header = 'product,qty,revenue';
      const lines = dash.topProducts.map((p) =>
        [p.name, p.qty, p.revenue]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      return [header, ...lines].join('\n');
    }
    if (kind === 'stale') {
      const alerts = (await this.alerts(auth)).filter((a) => a.kind === 'no_movement');
      const header = 'sku,name,qty,message';
      const lines = alerts.map((a) =>
        [a.sku, a.productName, a.qtyOnHand, a.message]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      );
      return [header, ...lines].join('\n');
    }
    const orders = await this.listPurchaseOrders(auth);
    const header = 'id,supplier,status,total,created_at';
    const lines = orders.map((o) =>
      [o.id, o.supplierName || o.supplierId, o.status, o.total, o.createdAt]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    return [header, ...lines].join('\n');
  }
}
