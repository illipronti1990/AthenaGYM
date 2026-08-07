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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string>),
  };
  if (init?.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  if (res.headers.get('content-type')?.includes('text/csv')) {
    return (await res.text()) as T;
  }
  return res.json() as Promise<T>;
}

export const inventoryApi = {
  categories: (t: string) => apiFetch<ProductCategory[]>('/inventory/categories', t),
  products: (t: string, q?: string) =>
    apiFetch<Product[]>(`/inventory/products${q ? `?q=${encodeURIComponent(q)}` : ''}`, t),
  lookup: (t: string, code: string) =>
    apiFetch<Product | null>(`/inventory/products/lookup?code=${encodeURIComponent(code)}`, t),
  createProduct: (t: string, body: Record<string, unknown>) =>
    apiFetch<Product>('/inventory/products', t, { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<Product>(`/inventory/products/${id}`, t, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  movements: (t: string) => apiFetch<StockMovement[]>('/inventory/movements', t),
  createMovement: (t: string, body: Record<string, unknown>) =>
    apiFetch<Product>('/inventory/movements', t, { method: 'POST', body: JSON.stringify(body) }),
  createSale: (t: string, body: Record<string, unknown>) =>
    apiFetch<PosSale>('/pdv/sales', t, { method: 'POST', body: JSON.stringify(body) }),
  cancelSale: (t: string, id: string) =>
    apiFetch<PosSale>(`/pdv/sales/${id}/cancel`, t, { method: 'POST', body: '{}' }),
  suppliers: (t: string) => apiFetch<Supplier[]>('/inventory/suppliers', t),
  createSupplier: (t: string, body: Record<string, unknown>) =>
    apiFetch<Supplier>('/inventory/suppliers', t, { method: 'POST', body: JSON.stringify(body) }),
  purchases: (t: string) => apiFetch<PurchaseOrder[]>('/inventory/purchases', t),
  createPurchase: (t: string, body: Record<string, unknown>) =>
    apiFetch<PurchaseOrder>('/inventory/purchases', t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  receivePurchase: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<PurchaseOrder>(`/inventory/purchases/${id}/receive`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  counts: (t: string) => apiFetch<InventoryCount[]>('/inventory/counts', t),
  startCount: (t: string) =>
    apiFetch<InventoryCount>('/inventory/counts', t, { method: 'POST', body: '{}' }),
  closeCount: (t: string, id: string, body: Record<string, unknown>) =>
    apiFetch<InventoryCount>(`/inventory/counts/${id}/close`, t, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  alerts: (t: string) => apiFetch<StockAlert[]>('/inventory/alerts', t),
  dashboard: (t: string) => apiFetch<InventoryDashboard>('/inventory/dashboard', t),
  exportCsv: async (t: string, kind: string) => {
    const res = await fetch(`${API_URL}/inventory/export?kind=${kind}`, {
      headers: { Authorization: `Bearer ${t}`, Accept: 'text/csv' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`export failed (${res.status})`);
    return res.text();
  },
};
