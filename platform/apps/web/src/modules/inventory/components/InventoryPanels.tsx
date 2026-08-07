'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type {
  InventoryCount,
  InventoryDashboard,
  PosPaymentMethod,
  Product,
  ProductCategory,
  PurchaseOrder,
  StockAlert,
  StockMovement,
  StockMovementType,
  Supplier,
} from '@movvo/shared';
import { productMargin } from '@movvo/shared';
import { Button } from '@movvo/ui';
import { listAlunos } from '@/modules/alunos/services/alunosApi';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { inventoryApi } from '../services/inventoryApi';

function money(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function InventoryDashboardPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [data, setData] = useState<InventoryDashboard | null>(null);

  useEffect(() => {
    inventoryApi
      .dashboard(accessToken)
      .then(setData)
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Falha no dashboard', 'error');
        setData({
          stockValue: 0,
          lowStockCount: 0,
          ruptureCount: 0,
          salesToday: 0,
          salesMonth: 0,
          profitMonth: 0,
          avgTicket: 0,
          topProducts: [],
          salesByCategory: [],
          purchasesMonth: 0,
        });
      });
  }, [accessToken, push]);

  if (!data) return <TableSkeleton rows={4} />;

  const kpis = [
    ['Valor em estoque', money(data.stockValue)],
    ['Baixo estoque', String(data.lowStockCount)],
    ['Ruptura', String(data.ruptureCount)],
    ['Vendas hoje', money(data.salesToday)],
    ['Vendas no mês', money(data.salesMonth)],
    ['Lucro loja (mês)', money(data.profitMonth)],
    ['Ticket médio', money(data.avgTicket)],
    ['Compras no mês', money(data.purchasesMonth)],
  ] as const;

  return (
    <div className="space-y-6" data-testid="inventory-dashboard">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted)]">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Top vendidos</h3>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sem vendas no período.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.topProducts.map((p) => (
              <li key={p.productId} className="flex justify-between gap-4">
                <span>
                  {p.name} · {p.qty} un
                </span>
                <span>{money(p.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Vendas por categoria</h3>
        {data.salesByCategory.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sem dados.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {data.salesByCategory.map((c) => (
              <li key={c.category} className="flex justify-between gap-4">
                <span>{c.category}</span>
                <span>{money(c.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function ProductsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    costPrice: '0',
    salePrice: '0',
    minStock: '5',
    qtyOnHand: '0',
    photoUrl: '',
  });

  async function load() {
    try {
      const [list, cats] = await Promise.all([
        inventoryApi.products(accessToken, q || undefined),
        inventoryApi.categories(accessToken),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar produtos', 'error');
      setProducts([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await inventoryApi.createProduct(accessToken, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim() || undefined,
        categoryId: form.categoryId || undefined,
        costPrice: Number(form.costPrice) || 0,
        salePrice: Number(form.salePrice) || 0,
        minStock: Number(form.minStock) || 0,
        qtyOnHand: Number(form.qtyOnHand) || 0,
        photoUrl: form.photoUrl.trim() || undefined,
      });
      push('Produto criado');
      setForm({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        costPrice: '0',
        salePrice: '0',
        minStock: '5',
        qtyOnHand: '0',
        photoUrl: '',
      });
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao criar', 'error');
    }
  }

  return (
    <div className="space-y-8" data-testid="products-panel">
      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          data-testid="product-name"
          className="movvo-input"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          data-testid="product-sku"
          className="movvo-input"
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          required
        />
        <input
          data-testid="product-barcode"
          className="movvo-input"
          placeholder="Código de barras"
          value={form.barcode}
          onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
        />
        <select
          data-testid="product-category"
          className="movvo-input"
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
        >
          <option value="">Categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          data-testid="product-cost"
          className="movvo-input"
          type="number"
          step="0.01"
          placeholder="Custo"
          value={form.costPrice}
          onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
        />
        <input
          data-testid="product-sale"
          className="movvo-input"
          type="number"
          step="0.01"
          placeholder="Venda"
          value={form.salePrice}
          onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
        />
        <input
          data-testid="product-min"
          className="movvo-input"
          type="number"
          placeholder="Estoque mín."
          value={form.minStock}
          onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
        />
        <input
          data-testid="product-qty"
          className="movvo-input"
          type="number"
          placeholder="Qtd inicial"
          value={form.qtyOnHand}
          onChange={(e) => setForm((f) => ({ ...f, qtyOnHand: e.target.value }))}
        />
        <input
          data-testid="product-photo"
          className="movvo-input"
          placeholder="URL da foto"
          value={form.photoUrl}
          onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
        />
        <div className="sm:col-span-2 lg:col-span-3">
          <Button type="submit" data-testid="product-create">
            Criar produto
          </Button>
        </div>
      </form>

      <div className="flex gap-2">
        <input
          data-testid="product-search"
          className="movvo-input max-w-sm"
          placeholder="Buscar nome/SKU/barcode"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={() => void load()} data-testid="product-search-btn">
          Buscar
        </Button>
      </div>

      {!products ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="products-table">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2">Produto</th>
                <th>SKU</th>
                <th>Estoque</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Margem</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-[var(--border)]" data-testid={`product-row-${p.sku}`}>
                  <td className="py-2">{p.name}</td>
                  <td>{p.sku}</td>
                  <td>
                    {p.qtyOnHand} {p.uom}
                    {p.qtyOnHand <= p.minStock ? (
                      <span className="ml-2 text-xs text-amber-600">mín.</span>
                    ) : null}
                  </td>
                  <td>{money(p.costPrice)}</td>
                  <td>{money(p.salePrice)}</td>
                  <td>{productMargin(p.salePrice, p.costPrice)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  in: 'Entrada',
  out: 'Saída',
  adjust: 'Ajuste',
  loss: 'Perda',
  internal_consume: 'Consumo interno',
};

export function StockMovementsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<StockMovement[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<StockMovementType>('in');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');

  async function load() {
    try {
      const [movs, prods] = await Promise.all([
        inventoryApi.movements(accessToken),
        inventoryApi.products(accessToken),
      ]);
      setItems(movs);
      setProducts(prods);
      if (!productId && prods[0]) setProductId(prods[0].id);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao carregar movimentações', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await inventoryApi.createMovement(accessToken, {
        productId,
        type,
        qty: type === 'adjust' ? Number(qty) : Math.abs(Number(qty)),
        reason: reason || undefined,
      });
      push('Movimentação registrada');
      setReason('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha na movimentação', 'error');
    }
  }

  return (
    <div className="space-y-6" data-testid="movements-panel">
      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          data-testid="movement-product"
          className="movvo-input"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          <option value="">Produto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.qtyOnHand})
            </option>
          ))}
        </select>
        <select
          data-testid="movement-type"
          className="movvo-input"
          value={type}
          onChange={(e) => setType(e.target.value as StockMovementType)}
        >
          {(Object.keys(MOVEMENT_LABELS) as StockMovementType[]).map((k) => (
            <option key={k} value={k}>
              {MOVEMENT_LABELS[k]}
            </option>
          ))}
        </select>
        <input
          data-testid="movement-qty"
          className="movvo-input"
          type="number"
          step="0.001"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          required
        />
        <input
          data-testid="movement-reason"
          className="movvo-input"
          placeholder="Motivo"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button type="submit" data-testid="movement-submit">
          Registrar
        </Button>
      </form>

      {!items ? (
        <TableSkeleton rows={5} />
      ) : (
        <table className="w-full text-sm" data-testid="movements-table">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Data</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-[var(--border)]">
                <td className="py-2">{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                <td>{m.productName || m.productId.slice(0, 8)}</td>
                <td>{MOVEMENT_LABELS[m.type] || m.type}</td>
                <td>{m.qty}</td>
                <td>{m.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

type CartLine = { productId: string; name: string; qty: number; unitPrice: number };

export function PdvWorkstation({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [code, setCode] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('pix');
  const [studentId, setStudentId] = useState('');
  const [studentQ, setStudentQ] = useState('');
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((s, l) => s + l.qty * l.unitPrice, 0),
    [cart],
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  async function addByCode(e: FormEvent) {
    e.preventDefault();
    try {
      const product = await inventoryApi.lookup(accessToken, code.trim());
      if (!product) {
        push('Produto não encontrado', 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((l) => l.productId === product.id);
        if (existing) {
          return prev.map((l) =>
            l.productId === product.id ? { ...l, qty: l.qty + 1 } : l,
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            qty: 1,
            unitPrice: product.salePrice,
          },
        ];
      });
      setCode('');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha no lookup', 'error');
    }
  }

  async function searchStudents() {
    try {
      const res = await listAlunos(accessToken, { q: studentQ, limit: '10' });
      setStudents(
        (res.items || []).map((s) => ({
          id: s.id,
          name: s.fullName || s.id,
        })),
      );
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao buscar alunos', 'error');
    }
  }

  async function finalize() {
    if (!cart.length) {
      push('Carrinho vazio', 'error');
      return;
    }
    if (paymentMethod === 'internal_credit' && !studentId) {
      push('Selecione o aluno para crédito interno', 'error');
      return;
    }
    setBusy(true);
    try {
      const sale = await inventoryApi.createSale(accessToken, {
        items: cart.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
        paymentMethod,
        discount: Number(discount) || 0,
        studentId: studentId || undefined,
      });
      setLastSaleId(sale.id);
      setCart([]);
      setDiscount('0');
      push(`Venda ${sale.id.slice(0, 8)} concluída · ${money(sale.total)}`);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha na venda', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function cancelLast() {
    if (!lastSaleId) return;
    setBusy(true);
    try {
      await inventoryApi.cancelSale(accessToken, lastSaleId);
      push('Venda cancelada');
      setLastSaleId(null);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao cancelar', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="pdv-workstation">
      <form onSubmit={addByCode} className="flex flex-wrap gap-2">
        <input
          data-testid="pdv-code"
          className="movvo-input min-w-[220px] flex-1"
          placeholder="SKU ou código de barras"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" data-testid="pdv-add">
          Adicionar
        </Button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="pdv-cart">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Item</th>
              <th>Qtd</th>
              <th>Preço</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cart.map((l) => (
              <tr key={l.productId} className="border-t border-[var(--border)]">
                <td className="py-2">{l.name}</td>
                <td>
                  <input
                    className="movvo-input w-20"
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={l.qty}
                    onChange={(e) =>
                      setCart((prev) =>
                        prev.map((x) =>
                          x.productId === l.productId
                            ? { ...x, qty: Number(e.target.value) || 0 }
                            : x,
                        ),
                      )
                    }
                  />
                </td>
                <td>{money(l.unitPrice)}</td>
                <td>{money(l.qty * l.unitPrice)}</td>
                <td>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() =>
                      setCart((prev) => prev.filter((x) => x.productId !== l.productId))
                    }
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          data-testid="pdv-discount"
          className="movvo-input"
          type="number"
          min={0}
          step={0.01}
          placeholder="Desconto"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />
        <select
          data-testid="pdv-payment"
          className="movvo-input"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PosPaymentMethod)}
        >
          <option value="pix">PIX</option>
          <option value="card">Cartão</option>
          <option value="cash">Dinheiro</option>
          <option value="internal_credit">Crédito interno</option>
          <option value="voucher">Voucher</option>
        </select>
        <div className="flex gap-2 sm:col-span-2">
          <input
            data-testid="pdv-student-q"
            className="movvo-input flex-1"
            placeholder="Buscar aluno"
            value={studentQ}
            onChange={(e) => setStudentQ(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={() => void searchStudents()}>
            Buscar
          </Button>
        </div>
        {students.length > 0 ? (
          <select
            data-testid="pdv-student"
            className="movvo-input sm:col-span-2"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Aluno (opcional)</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-sm text-[var(--muted)]">Subtotal {money(subtotal)}</p>
          <p className="text-2xl font-semibold" data-testid="pdv-total">
            {money(total)}
          </p>
        </div>
        <div className="flex gap-2">
          {lastSaleId ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void cancelLast()}
              data-testid="pdv-cancel"
            >
              Cancelar última
            </Button>
          ) : null}
          <Button type="button" disabled={busy} onClick={() => void finalize()} data-testid="pdv-finalize">
            Finalizar venda
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SuppliersPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [items, setItems] = useState<Supplier[] | null>(null);
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  async function load() {
    try {
      setItems(await inventoryApi.suppliers(accessToken));
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha fornecedores', 'error');
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      await inventoryApi.createSupplier(accessToken, {
        name: name.trim(),
        document: document.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      push('Fornecedor criado');
      setName('');
      setDocument('');
      setPhone('');
      setEmail('');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao criar', 'error');
    }
  }

  return (
    <div className="space-y-6" data-testid="suppliers-panel">
      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          data-testid="supplier-name"
          className="movvo-input"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="movvo-input"
          placeholder="CNPJ/CPF"
          value={document}
          onChange={(e) => setDocument(e.target.value)}
        />
        <input
          className="movvo-input"
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="movvo-input"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" data-testid="supplier-create">
          Criar fornecedor
        </Button>
      </form>
      {!items ? (
        <TableSkeleton rows={4} />
      ) : (
        <table className="w-full text-sm" data-testid="suppliers-table">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Nome</th>
              <th>Documento</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} className="border-t border-[var(--border)]">
                <td className="py-2">{s.name}</td>
                <td>{s.document || '—'}</td>
                <td>{s.phone || s.email || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function PurchaseOrdersPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [orders, setOrders] = useState<PurchaseOrder[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('10');

  async function load() {
    try {
      const [pos, sups, prods] = await Promise.all([
        inventoryApi.purchases(accessToken),
        inventoryApi.suppliers(accessToken),
        inventoryApi.products(accessToken),
      ]);
      setOrders(pos);
      setSuppliers(sups);
      setProducts(prods);
      if (!supplierId && sups[0]) setSupplierId(sups[0].id);
      if (!productId && prods[0]) setProductId(prods[0].id);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha compras', 'error');
      setOrders([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      const product = products.find((p) => p.id === productId);
      await inventoryApi.createPurchase(accessToken, {
        supplierId,
        items: [
          {
            productId,
            qtyOrdered: Number(qty) || 1,
            unitCost: product?.costPrice ?? 0,
          },
        ],
      });
      push('Pedido criado');
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Falha ao criar pedido', 'error');
    }
  }

  async function onReceive(order: PurchaseOrder) {
    try {
      const items = (order.items || []).map((i) => ({
        productId: i.productId,
        qty: i.qtyOrdered - i.qtyReceived,
        unitCost: i.unitCost,
      })).filter((i) => i.qty > 0);
      if (!items.length) {
        push('Nada a receber', 'error');
        return;
      }
      await inventoryApi.receivePurchase(accessToken, order.id, { items });
      push('Recebimento registrado');
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha no recebimento', 'error');
    }
  }

  return (
    <div className="space-y-6" data-testid="purchases-panel">
      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          data-testid="purchase-supplier"
          className="movvo-input"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          required
        >
          <option value="">Fornecedor</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          data-testid="purchase-product"
          className="movvo-input"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          <option value="">Produto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          data-testid="purchase-qty"
          className="movvo-input"
          type="number"
          min={0.001}
          step={0.001}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <Button type="submit" data-testid="purchase-create">
          Criar pedido
        </Button>
      </form>

      {!orders ? (
        <TableSkeleton rows={4} />
      ) : (
        <table className="w-full text-sm" data-testid="purchases-table">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="py-2">Fornecedor</th>
              <th>Status</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-[var(--border)]">
                <td className="py-2">{o.supplierName || o.supplierId.slice(0, 8)}</td>
                <td>{o.status}</td>
                <td>{money(o.total)}</td>
                <td>
                  {o.status !== 'received' && o.status !== 'cancelled' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      data-testid={`purchase-receive-${o.id}`}
                      onClick={() => void onReceive(o)}
                    >
                      Receber
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function InventoryCountWizard({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [counts, setCounts] = useState<InventoryCount[] | null>(null);
  const [open, setOpen] = useState<InventoryCount | null>(null);
  const [qtys, setQtys] = useState<Record<string, string>>({});

  async function load() {
    try {
      const list = await inventoryApi.counts(accessToken);
      setCounts(list);
      const current = list.find((c) => c.status === 'open') || null;
      setOpen(current);
      if (current?.lines) {
        const map: Record<string, string> = {};
        for (const line of current.lines) {
          map[line.productId] = String(line.countedQty ?? line.systemQty);
        }
        setQtys(map);
      }
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha inventário', 'error');
      setCounts([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function start() {
    try {
      const count = await inventoryApi.startCount(accessToken);
      push('Contagem iniciada');
      setOpen(count);
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao iniciar', 'error');
    }
  }

  async function close() {
    if (!open) return;
    try {
      await inventoryApi.closeCount(accessToken, open.id, {
        lines: Object.entries(qtys).map(([productId, countedQty]) => ({
          productId,
          countedQty: Number(countedQty),
        })),
      });
      push('Inventário fechado com ajustes');
      setOpen(null);
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha ao fechar', 'error');
    }
  }

  return (
    <div className="space-y-6" data-testid="inventory-count-wizard">
      {!open ? (
        <Button type="button" onClick={() => void start()} data-testid="inventory-start">
          Iniciar contagem física
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Contagem aberta · sistema vs físico
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="py-2">Produto</th>
                <th>Sistema</th>
                <th>Contado</th>
              </tr>
            </thead>
            <tbody>
              {(open.lines || []).map((line) => (
                <tr key={line.id} className="border-t border-[var(--border)]">
                  <td className="py-2">{line.productName || line.productId.slice(0, 8)}</td>
                  <td>{line.systemQty}</td>
                  <td>
                    <input
                      data-testid={`count-qty-${line.productId}`}
                      className="movvo-input w-28"
                      type="number"
                      step={0.001}
                      value={qtys[line.productId] ?? ''}
                      onChange={(e) =>
                        setQtys((prev) => ({ ...prev, [line.productId]: e.target.value }))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button type="button" onClick={() => void close()} data-testid="inventory-close">
            Fechar e ajustar estoque
          </Button>
        </div>
      )}

      {counts && counts.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Histórico</h3>
          <ul className="space-y-1 text-sm">
            {counts.map((c) => (
              <li key={c.id}>
                {c.status} · {new Date(c.createdAt).toLocaleString('pt-BR')}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function StockAlertsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [alerts, setAlerts] = useState<StockAlert[] | null>(null);

  useEffect(() => {
    inventoryApi
      .alerts(accessToken)
      .then(setAlerts)
      .catch((e) => {
        push(e instanceof Error ? e.message : 'Falha alertas', 'error');
        setAlerts([]);
      });
  }, [accessToken, push]);

  if (!alerts) return <TableSkeleton rows={4} />;

  return (
    <div data-testid="stock-alerts-panel">
      {alerts.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhum alerta no momento.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={`${a.kind}-${a.productId}`}
              className="rounded-lg border border-[var(--border)] p-3 text-sm"
              data-testid={`alert-${a.kind}-${a.sku}`}
            >
              <span className="font-medium uppercase text-xs text-[var(--muted)]">{a.kind}</span>
              <p className="mt-1">
                {a.productName} ({a.sku}) — {a.message}
              </p>
              <p className="text-[var(--muted)]">
                Estoque {a.qtyOnHand} · mín. {a.minStock}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function InventoryReportsPanel({ accessToken }: { accessToken: string }) {
  const { push } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function download(kind: string) {
    setBusy(kind);
    try {
      const csv = await inventoryApi.exportCsv(accessToken, kind);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estoque-${kind}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      push('CSV baixado');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Falha no export', 'error');
    } finally {
      setBusy(null);
    }
  }

  const kinds = [
    ['inventory', 'Inventário atual'],
    ['top_sellers', 'Mais vendidos'],
    ['stale', 'Parados'],
    ['purchases', 'Compras por fornecedor'],
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="inventory-reports">
      {kinds.map(([kind, label]) => (
        <Button
          key={kind}
          type="button"
          variant="secondary"
          disabled={busy === kind}
          onClick={() => void download(kind)}
          data-testid={`export-${kind}`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
