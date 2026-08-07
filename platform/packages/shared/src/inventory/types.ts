export type ProductUom = 'un' | 'kg' | 'g' | 'l' | 'ml' | 'cx' | 'pct';

export type StockMovementType = 'in' | 'out' | 'adjust' | 'loss' | 'internal_consume';

export type PosPaymentMethod = 'pix' | 'card' | 'cash' | 'internal_credit' | 'voucher';

export type PosSaleStatus = 'completed' | 'cancelled';

export type PurchaseOrderStatus =
  | 'draft'
  | 'ordered'
  | 'partial'
  | 'received'
  | 'cancelled';

export type InventoryCountStatus = 'open' | 'closed' | 'cancelled';

export type StockAlertKind = 'low_stock' | 'rupture' | 'no_movement' | 'expiring';

export type ProductCategory = {
  id: string;
  companyId: string;
  slug: string;
  name: string;
  active: boolean;
};

export type Product = {
  id: string;
  companyId: string;
  unitId: string | null;
  categoryId: string | null;
  categoryName?: string | null;
  supplierId: string | null;
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  uom: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  qtyOnHand: number;
  photoUrl: string | null;
  description: string | null;
  expiryDate: string | null;
  tracksStock: boolean;
  active: boolean;
  createdAt: string;
};

export type StockMovement = {
  id: string;
  companyId: string;
  unitId: string | null;
  productId: string;
  productName?: string;
  type: StockMovementType;
  qty: number;
  unitCost: number;
  reason: string | null;
  actorId: string | null;
  refType: string | null;
  refId: string | null;
  createdAt: string;
};

export type PosSaleItem = {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
};

export type PosSale = {
  id: string;
  companyId: string;
  unitId: string | null;
  studentId: string | null;
  cashierId: string | null;
  status: PosSaleStatus;
  paymentMethod: PosPaymentMethod;
  discount: number;
  subtotal: number;
  total: number;
  costTotal: number;
  receivableId: string | null;
  notes: string | null;
  items?: PosSaleItem[];
  createdAt: string;
};

export type PurchaseOrderItem = {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName?: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  companyId: string;
  unitId: string | null;
  supplierId: string;
  supplierName?: string;
  status: PurchaseOrderStatus;
  expectedAt: string | null;
  notes: string | null;
  total: number;
  items?: PurchaseOrderItem[];
  createdAt: string;
};

export type InventoryCountLine = {
  id: string;
  countId: string;
  productId: string;
  productName?: string;
  systemQty: number;
  countedQty: number | null;
  difference: number | null;
};

export type InventoryCount = {
  id: string;
  companyId: string;
  unitId: string | null;
  status: InventoryCountStatus;
  notes: string | null;
  lines?: InventoryCountLine[];
  createdAt: string;
  closedAt: string | null;
};

export type StockAlert = {
  kind: StockAlertKind;
  productId: string;
  productName: string;
  sku: string;
  qtyOnHand: number;
  minStock: number;
  message: string;
};

export type InventoryDashboard = {
  stockValue: number;
  lowStockCount: number;
  ruptureCount: number;
  salesToday: number;
  salesMonth: number;
  profitMonth: number;
  avgTicket: number;
  topProducts: Array<{ productId: string; name: string; qty: number; revenue: number }>;
  salesByCategory: Array<{ category: string; revenue: number }>;
  purchasesMonth: number;
};

export function productMargin(salePrice: number, costPrice: number): number {
  if (salePrice <= 0) return 0;
  return Number((((salePrice - costPrice) / salePrice) * 100).toFixed(2));
}

export function isLowStock(qtyOnHand: number, minStock: number, tracksStock = true): boolean {
  if (!tracksStock) return false;
  return qtyOnHand > 0 && qtyOnHand <= minStock;
}

export function isRupture(qtyOnHand: number, tracksStock = true): boolean {
  if (!tracksStock) return false;
  return qtyOnHand <= 0;
}

export function signedStockDelta(type: StockMovementType, qty: number): number {
  const q = Math.abs(qty);
  if (type === 'in') return q;
  if (type === 'out' || type === 'loss' || type === 'internal_consume') return -q;
  return qty; // adjust: signed as provided
}
