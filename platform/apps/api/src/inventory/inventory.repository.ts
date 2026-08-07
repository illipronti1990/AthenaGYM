import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type {
  InventoryCount,
  InventoryDashboard,
  PosSale,
  Product,
  ProductCategory,
  PurchaseOrder,
  StockAlert,
  StockMovement,
  Supplier,
} from '@athena/shared';
import { isLowStock, isRupture, signedStockDelta } from '@athena/shared';

@Injectable()
export class InventoryRepository {
  constructor(private readonly supabase: SupabaseService) {}

  private admin() {
    return this.supabase.getAdmin();
  }

  mapCategory(row: Record<string, unknown>): ProductCategory {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      slug: String(row.slug),
      name: String(row.name),
      active: Boolean(row.active),
    };
  }

  mapProduct(row: Record<string, unknown>, categoryName?: string | null): Product {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      categoryId: row.category_id ? String(row.category_id) : null,
      categoryName: categoryName ?? null,
      supplierId: row.supplier_id ? String(row.supplier_id) : null,
      name: String(row.name),
      sku: String(row.sku),
      barcode: row.barcode ? String(row.barcode) : null,
      brand: row.brand ? String(row.brand) : null,
      uom: String(row.uom || 'un'),
      costPrice: Number(row.cost_price || 0),
      salePrice: Number(row.sale_price || 0),
      minStock: Number(row.min_stock || 0),
      qtyOnHand: Number(row.qty_on_hand || 0),
      photoUrl: row.photo_url ? String(row.photo_url) : null,
      description: row.description ? String(row.description) : null,
      expiryDate: row.expiry_date ? String(row.expiry_date).slice(0, 10) : null,
      tracksStock: row.tracks_stock !== false,
      active: row.active !== false,
      createdAt: String(row.created_at),
    };
  }

  mapMovement(row: Record<string, unknown>, productName?: string): StockMovement {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      productId: String(row.product_id),
      productName,
      type: row.type as StockMovement['type'],
      qty: Number(row.qty),
      unitCost: Number(row.unit_cost || 0),
      reason: row.reason ? String(row.reason) : null,
      actorId: row.actor_id ? String(row.actor_id) : null,
      refType: row.ref_type ? String(row.ref_type) : null,
      refId: row.ref_id ? String(row.ref_id) : null,
      createdAt: String(row.created_at),
    };
  }

  mapSupplier(row: Record<string, unknown>): Supplier {
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      name: String(row.name),
      document: row.document ? String(row.document) : null,
      email: row.email ? String(row.email) : null,
      phone: row.phone ? String(row.phone) : null,
      contactName: row.contact_name ? String(row.contact_name) : null,
      address: row.address ? String(row.address) : null,
      notes: row.notes ? String(row.notes) : null,
      active: row.active !== false,
    };
  }

  async listCategories(companyId: string) {
    const { data, error } = await this.admin()
      .from('product_categories')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapCategory(r as Record<string, unknown>));
  }

  async listProducts(companyId: string, filters: { q?: string; active?: boolean } = {}) {
    let q = this.admin()
      .from('products')
      .select('*, product_categories(name)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (filters.active != null) q = q.eq('active', filters.active);
    if (filters.q) {
      const term = `%${filters.q}%`;
      q = q.or(`name.ilike.${term},sku.ilike.${term},barcode.ilike.${term}`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown> & {
        product_categories?: { name?: string } | null;
      };
      return this.mapProduct(row, row.product_categories?.name || null);
    });
  }

  async getProduct(companyId: string, id: string) {
    const { data, error } = await this.admin()
      .from('products')
      .select('*, product_categories(name)')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Record<string, unknown> & {
      product_categories?: { name?: string } | null;
    };
    return this.mapProduct(row, row.product_categories?.name || null);
  }

  async findProductByCode(companyId: string, code: string) {
    const { data, error } = await this.admin()
      .from('products')
      .select('*, product_categories(name)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .eq('active', true)
      .or(`sku.eq.${code},barcode.eq.${code}`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const row = data as Record<string, unknown> & {
      product_categories?: { name?: string } | null;
    };
    return this.mapProduct(row, row.product_categories?.name || null);
  }

  async insertProduct(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('products').insert(row).select('*').single();
    if (error) throw error;
    return this.mapProduct(data as Record<string, unknown>);
  }

  async updateProduct(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('products')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapProduct(data as Record<string, unknown>);
  }

  async softDeleteProduct(companyId: string, id: string) {
    const { error } = await this.admin()
      .from('products')
      .update({ deleted_at: new Date().toISOString(), active: false })
      .eq('company_id', companyId)
      .eq('id', id);
    if (error) throw error;
  }

  async insertMovement(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('stock_movements')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapMovement(data as Record<string, unknown>);
  }

  async listMovements(companyId: string, limit = 100) {
    const { data, error } = await this.admin()
      .from('stock_movements')
      .select('*, products(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map((r) => {
      const row = r as Record<string, unknown> & { products?: { name?: string } | null };
      return this.mapMovement(row, row.products?.name);
    });
  }

  async applyStockDelta(
    companyId: string,
    productId: string,
    type: StockMovement['type'],
    qty: number,
  ) {
    const product = await this.getProduct(companyId, productId);
    if (!product) throw new Error('Product not found');
    if (!product.tracksStock) return product;
    const delta = signedStockDelta(type, qty);
    const next = Number((product.qtyOnHand + delta).toFixed(3));
    return this.updateProduct(companyId, productId, { qty_on_hand: next });
  }

  async insertSale(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('pos_sales').insert(row).select('*').single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async insertSaleItems(rows: Record<string, unknown>[]) {
    const { data, error } = await this.admin().from('pos_sale_items').insert(rows).select('*');
    if (error) throw error;
    return data || [];
  }

  async getSale(companyId: string, id: string): Promise<PosSale | null> {
    const { data, error } = await this.admin()
      .from('pos_sales')
      .select('*, pos_sale_items(*)')
      .eq('company_id', companyId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.mapSale(data as Record<string, unknown>);
  }

  mapSale(row: Record<string, unknown>): PosSale {
    const items = (row.pos_sale_items as Record<string, unknown>[] | undefined) || [];
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      studentId: row.student_id ? String(row.student_id) : null,
      cashierId: row.cashier_id ? String(row.cashier_id) : null,
      status: row.status as PosSale['status'],
      paymentMethod: row.payment_method as PosSale['paymentMethod'],
      discount: Number(row.discount || 0),
      subtotal: Number(row.subtotal || 0),
      total: Number(row.total || 0),
      costTotal: Number(row.cost_total || 0),
      receivableId: row.receivable_id ? String(row.receivable_id) : null,
      notes: row.notes ? String(row.notes) : null,
      createdAt: String(row.created_at),
      items: items.map((i) => ({
        id: String(i.id),
        saleId: String(i.sale_id),
        productId: String(i.product_id),
        productName: String(i.product_name),
        qty: Number(i.qty),
        unitPrice: Number(i.unit_price),
        unitCost: Number(i.unit_cost || 0),
        lineTotal: Number(i.line_total),
      })),
    };
  }

  async updateSale(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('pos_sales')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*, pos_sale_items(*)')
      .single();
    if (error) throw error;
    return this.mapSale(data as Record<string, unknown>);
  }

  async listSuppliers(companyId: string) {
    const { data, error } = await this.admin()
      .from('suppliers')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return (data || []).map((r) => this.mapSupplier(r as Record<string, unknown>));
  }

  async insertSupplier(row: Record<string, unknown>) {
    const { data, error } = await this.admin().from('suppliers').insert(row).select('*').single();
    if (error) throw error;
    return this.mapSupplier(data as Record<string, unknown>);
  }

  async updateSupplier(companyId: string, id: string, patch: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('suppliers')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return this.mapSupplier(data as Record<string, unknown>);
  }

  async insertPurchaseOrder(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('purchase_orders')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async insertPurchaseOrderItems(rows: Record<string, unknown>[]) {
    const { error } = await this.admin().from('purchase_order_items').insert(rows);
    if (error) throw error;
  }

  async getPurchaseOrder(companyId: string, id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await this.admin()
      .from('purchase_orders')
      .select('*, purchase_order_items(*), suppliers(name)')
      .eq('company_id', companyId)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.mapPurchaseOrder(data as Record<string, unknown>);
  }

  mapPurchaseOrder(row: Record<string, unknown>): PurchaseOrder {
    const items = (row.purchase_order_items as Record<string, unknown>[] | undefined) || [];
    const supplier = row.suppliers as { name?: string } | null;
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      supplierId: String(row.supplier_id),
      supplierName: supplier?.name,
      status: row.status as PurchaseOrder['status'],
      expectedAt: row.expected_at ? String(row.expected_at).slice(0, 10) : null,
      notes: row.notes ? String(row.notes) : null,
      total: Number(row.total || 0),
      createdAt: String(row.created_at),
      items: items.map((i) => ({
        id: String(i.id),
        purchaseOrderId: String(i.purchase_order_id),
        productId: String(i.product_id),
        qtyOrdered: Number(i.qty_ordered),
        qtyReceived: Number(i.qty_received || 0),
        unitCost: Number(i.unit_cost || 0),
      })),
    };
  }

  async listPurchaseOrders(companyId: string) {
    const { data, error } = await this.admin()
      .from('purchase_orders')
      .select('*, purchase_order_items(*), suppliers(name)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => this.mapPurchaseOrder(r as Record<string, unknown>));
  }

  async updatePurchaseOrder(companyId: string, id: string, patch: Record<string, unknown>) {
    const { error } = await this.admin()
      .from('purchase_orders')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id);
    if (error) throw error;
  }

  async updatePurchaseOrderItem(id: string, patch: Record<string, unknown>) {
    const { error } = await this.admin()
      .from('purchase_order_items')
      .update(patch)
      .eq('id', id);
    if (error) throw error;
  }

  async insertReceipt(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('purchase_receipts')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async insertReceiptItems(rows: Record<string, unknown>[]) {
    const { error } = await this.admin().from('purchase_receipt_items').insert(rows);
    if (error) throw error;
  }

  async insertInventoryCount(row: Record<string, unknown>) {
    const { data, error } = await this.admin()
      .from('inventory_counts')
      .insert(row)
      .select('*')
      .single();
    if (error) throw error;
    return data as Record<string, unknown>;
  }

  async insertInventoryCountLines(rows: Record<string, unknown>[]) {
    const { error } = await this.admin().from('inventory_count_lines').insert(rows);
    if (error) throw error;
  }

  async getInventoryCount(companyId: string, id: string): Promise<InventoryCount | null> {
    const { data, error } = await this.admin()
      .from('inventory_counts')
      .select('*, inventory_count_lines(*, products(name))')
      .eq('company_id', companyId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.mapInventoryCount(data as Record<string, unknown>);
  }

  mapInventoryCount(row: Record<string, unknown>): InventoryCount {
    const lines = (row.inventory_count_lines as Record<string, unknown>[] | undefined) || [];
    return {
      id: String(row.id),
      companyId: String(row.company_id),
      unitId: row.unit_id ? String(row.unit_id) : null,
      status: row.status as InventoryCount['status'],
      notes: row.notes ? String(row.notes) : null,
      createdAt: String(row.created_at),
      closedAt: row.closed_at ? String(row.closed_at) : null,
      lines: lines.map((l) => {
        const p = l.products as { name?: string } | null;
        return {
          id: String(l.id),
          countId: String(l.count_id),
          productId: String(l.product_id),
          productName: p?.name,
          systemQty: Number(l.system_qty || 0),
          countedQty: l.counted_qty == null ? null : Number(l.counted_qty),
          difference: l.difference == null ? null : Number(l.difference),
        };
      }),
    };
  }

  async updateInventoryCount(companyId: string, id: string, patch: Record<string, unknown>) {
    const { error } = await this.admin()
      .from('inventory_counts')
      .update(patch)
      .eq('company_id', companyId)
      .eq('id', id);
    if (error) throw error;
  }

  async updateInventoryCountLine(id: string, patch: Record<string, unknown>) {
    const { error } = await this.admin()
      .from('inventory_count_lines')
      .update(patch)
      .eq('id', id);
    if (error) throw error;
  }

  async listInventoryCounts(companyId: string) {
    const { data, error } = await this.admin()
      .from('inventory_counts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((r) => this.mapInventoryCount(r as Record<string, unknown>));
  }

  async buildAlerts(companyId: string): Promise<StockAlert[]> {
    const products = await this.listProducts(companyId, { active: true });
    const alerts: StockAlert[] = [];
    const now = Date.now();
    for (const p of products) {
      if (isRupture(p.qtyOnHand, p.tracksStock)) {
        alerts.push({
          kind: 'rupture',
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          qtyOnHand: p.qtyOnHand,
          minStock: p.minStock,
          message: `Ruptura: ${p.name} sem estoque`,
        });
      } else if (isLowStock(p.qtyOnHand, p.minStock, p.tracksStock)) {
        alerts.push({
          kind: 'low_stock',
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          qtyOnHand: p.qtyOnHand,
          minStock: p.minStock,
          message: `Estoque baixo: ${p.name} (${p.qtyOnHand} / mín ${p.minStock})`,
        });
      }
      if (p.expiryDate) {
        const exp = new Date(p.expiryDate).getTime();
        if (exp - now < 30 * 86400000) {
          alerts.push({
            kind: 'expiring',
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            qtyOnHand: p.qtyOnHand,
            minStock: p.minStock,
            message: `Validade próxima: ${p.name} (${p.expiryDate})`,
          });
        }
      }
    }

    const since = new Date(Date.now() - 45 * 86400000).toISOString();
    const { data: recent } = await this.admin()
      .from('stock_movements')
      .select('product_id')
      .eq('company_id', companyId)
      .gte('created_at', since);
    const moved = new Set((recent || []).map((r) => String((r as { product_id: string }).product_id)));
    for (const p of products) {
      if (p.tracksStock && p.qtyOnHand > 0 && !moved.has(p.id)) {
        alerts.push({
          kind: 'no_movement',
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          qtyOnHand: p.qtyOnHand,
          minStock: p.minStock,
          message: `Sem movimentação há 45+ dias: ${p.name}`,
        });
      }
    }
    return alerts;
  }

  async buildDashboard(companyId: string): Promise<InventoryDashboard> {
    const products = await this.listProducts(companyId, { active: true });
    const stockValue = products.reduce((s, p) => s + p.qtyOnHand * p.costPrice, 0);
    const lowStockCount = products.filter((p) => isLowStock(p.qtyOnHand, p.minStock, p.tracksStock))
      .length;
    const ruptureCount = products.filter((p) => isRupture(p.qtyOnHand, p.tracksStock)).length;

    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);
    const startDay = new Date();
    startDay.setHours(0, 0, 0, 0);

    const { data: sales } = await this.admin()
      .from('pos_sales')
      .select('*, pos_sale_items(*)')
      .eq('company_id', companyId)
      .eq('status', 'completed')
      .gte('created_at', startMonth.toISOString());

    const monthSales = (sales || []) as Record<string, unknown>[];
    const salesMonth = monthSales.reduce((s, r) => s + Number(r.total || 0), 0);
    const profitMonth = monthSales.reduce(
      (s, r) => s + (Number(r.total || 0) - Number(r.cost_total || 0)),
      0,
    );
    const salesToday = monthSales
      .filter((r) => new Date(String(r.created_at)).getTime() >= startDay.getTime())
      .reduce((s, r) => s + Number(r.total || 0), 0);
    const avgTicket = monthSales.length ? salesMonth / monthSales.length : 0;

    const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
    const byCategory = new Map<string, number>();
    for (const sale of monthSales) {
      const items = (sale.pos_sale_items as Record<string, unknown>[]) || [];
      for (const i of items) {
        const pid = String(i.product_id);
        const cur = byProduct.get(pid) || {
          name: String(i.product_name),
          qty: 0,
          revenue: 0,
        };
        cur.qty += Number(i.qty);
        cur.revenue += Number(i.line_total);
        byProduct.set(pid, cur);
      }
    }
    for (const p of products) {
      const sold = byProduct.get(p.id);
      if (sold) {
        const cat = p.categoryName || 'Outros';
        byCategory.set(cat, (byCategory.get(cat) || 0) + sold.revenue);
      }
    }

    const { data: pos } = await this.admin()
      .from('purchase_orders')
      .select('total, status, created_at')
      .eq('company_id', companyId)
      .gte('created_at', startMonth.toISOString());
    const purchasesMonth = ((pos || []) as Array<{ total: number; status: string }>)
      .filter((p) => p.status === 'received' || p.status === 'partial')
      .reduce((s, p) => s + Number(p.total || 0), 0);

    const topProducts = [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      stockValue: Number(stockValue.toFixed(2)),
      lowStockCount,
      ruptureCount,
      salesToday: Number(salesToday.toFixed(2)),
      salesMonth: Number(salesMonth.toFixed(2)),
      profitMonth: Number(profitMonth.toFixed(2)),
      avgTicket: Number(avgTicket.toFixed(2)),
      topProducts,
      salesByCategory: [...byCategory.entries()].map(([category, revenue]) => ({
        category,
        revenue: Number(revenue.toFixed(2)),
      })),
      purchasesMonth: Number(purchasesMonth.toFixed(2)),
    };
  }
}
