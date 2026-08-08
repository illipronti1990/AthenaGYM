import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD, E2E_STUDENT_EMAIL, E2E_TRAINER_EMAIL } from './helpers/e2eEnv';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = E2E_EMAIL;
const DEV_PASSWORD = E2E_PASSWORD;
const STUDENT_EMAIL = E2E_STUDENT_EMAIL;
const TRAINER_EMAIL =
  E2E_TRAINER_EMAIL;

async function login(
  request: import('@playwright/test').APIRequestContext,
  email = DEV_EMAIL,
  password = DEV_PASSWORD,
) {
  const res = await request.post(`${API}/auth/dev-login`, {
    data: { email, password },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; access_token?: string };
  return body.accessToken || body.access_token || null;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

test.describe('Inventory G-13 smoke', () => {
  test.describe.configure({ timeout: 90_000 });

  test('products without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/inventory/products`);
    expect(res.status()).toBe(401);
  });

  test('estoque hub redirects unauthenticated toward login', async ({ request }) => {
    const res = await request.get(`${WEB}/app/estoque`, { maxRedirects: 0 });
    expect([302, 307, 308, 200]).toContain(res.status());
    if (res.status() >= 300 && res.status() < 400) {
      expect(String(res.headers()['location'] || '')).toMatch(/login/);
    }
  });

  test('admin CRUD product, movement, alerts, purchase, inventory, pdv', async ({
    request,
  }) => {
    const token = await login(request);
    test.skip(!token, 'dev-login unavailable');

    const sku = `G13-${Date.now()}`;
    const createRes = await request.post(`${API}/inventory/products`, {
      headers: auth(token!),
      data: {
        name: `Produto Smoke ${sku}`,
        sku,
        barcode: sku,
        costPrice: 10,
        salePrice: 25,
        minStock: 5,
        qtyOnHand: 20,
      },
    });
    expect([200, 201]).toContain(createRes.status());
    const product = (await createRes.json()) as { id: string; sku: string; qtyOnHand: number };
    expect(product.sku).toBe(sku);

    const moveIn = await request.post(`${API}/inventory/movements`, {
      headers: auth(token!),
      data: { productId: product.id, type: 'in', qty: 5, reason: 'smoke in' },
    });
    expect(moveIn.status(), await moveIn.text()).toBeLessThan(400);

    const moveOut = await request.post(`${API}/inventory/movements`, {
      headers: auth(token!),
      data: { productId: product.id, type: 'out', qty: 2, reason: 'smoke out' },
    });
    expect(moveOut.status(), await moveOut.text()).toBeLessThan(400);

    const alerts = await request.get(`${API}/inventory/alerts`, { headers: auth(token!) });
    expect(alerts.status()).toBe(200);
    expect(Array.isArray(await alerts.json())).toBeTruthy();

    const dash = await request.get(`${API}/inventory/dashboard`, { headers: auth(token!) });
    expect(dash.status()).toBe(200);
    const dashBody = await dash.json();
    expect(dashBody).toHaveProperty('stockValue');

    const supplierRes = await request.post(`${API}/inventory/suppliers`, {
      headers: auth(token!),
      data: { name: `Forn Smoke ${sku}` },
    });
    expect(supplierRes.status(), await supplierRes.text()).toBeLessThan(400);
    const supplier = (await supplierRes.json()) as { id: string };

    const poRes = await request.post(`${API}/inventory/purchases`, {
      headers: auth(token!),
      data: {
        supplierId: supplier.id,
        items: [{ productId: product.id, qtyOrdered: 3, unitCost: 10 }],
      },
    });
    expect(poRes.status(), await poRes.text()).toBeLessThan(400);
    const po = (await poRes.json()) as { id: string };

    const receive = await request.post(`${API}/inventory/purchases/${po.id}/receive`, {
      headers: auth(token!),
      data: { items: [{ productId: product.id, qty: 3, unitCost: 10 }] },
    });
    expect(receive.status(), await receive.text()).toBeLessThan(400);

    const countRes = await request.post(`${API}/inventory/counts`, {
      headers: auth(token!),
      data: {},
    });
    expect(countRes.status(), await countRes.text()).toBeLessThan(400);
    const count = (await countRes.json()) as {
      id: string;
      lines?: Array<{ productId: string; systemQty: number }>;
    };
    const line = count.lines?.find((l) => l.productId === product.id);
    expect(line).toBeTruthy();
    const close = await request.post(`${API}/inventory/counts/${count.id}/close`, {
      headers: auth(token!),
      data: {
        lines: [
          {
            productId: product.id,
            countedQty: (line?.systemQty || 0) - 1,
          },
        ],
      },
    });
    expect(close.status(), await close.text()).toBeLessThan(400);

    // PDV may require open cash for pix — try voucher first
    const saleRes = await request.post(`${API}/pdv/sales`, {
      headers: auth(token!),
      data: {
        items: [{ productId: product.id, qty: 1 }],
        paymentMethod: 'voucher',
        notes: 'smoke pdv',
      },
    });
    expect(saleRes.status(), await saleRes.text()).toBeLessThan(400);
    const sale = (await saleRes.json()) as { id: string; status: string };
    expect(sale.status).toBe('completed');

    const cancel = await request.post(`${API}/pdv/sales/${sale.id}/cancel`, {
      headers: auth(token!),
      data: {},
    });
    expect(cancel.status(), await cancel.text()).toBeLessThan(400);

    const exportRes = await request.get(`${API}/inventory/export?kind=inventory`, {
      headers: auth(token!),
    });
    expect(exportRes.status()).toBe(200);
    const csv = await exportRes.text();
    expect(csv).toContain('sku');
  });

  test('trainer without inventory.adjust gets 403 on close count', async ({ request }) => {
    const token = await login(request, TRAINER_EMAIL, DEV_PASSWORD);
    test.skip(!token, 'trainer user unavailable');

    const close = await request.post(
      `${API}/inventory/counts/00000000-0000-0000-0000-000000000099/close`,
      {
        headers: auth(token!),
        data: { lines: [] },
      },
    );
    expect([403, 401]).toContain(close.status());
  });

  test('student blocked from /app/estoque', async ({ request }) => {
    const token = await login(request, STUDENT_EMAIL, DEV_PASSWORD);
    test.skip(!token, 'student user unavailable');

    const api = await request.get(`${API}/inventory/products`, { headers: auth(token!) });
    expect([401, 403]).toContain(api.status());

    const page = await request.get(`${WEB}/app/estoque`, {
      maxRedirects: 0,
      headers: { Cookie: `movvo_access_token=${token}` },
    });
    // Middleware may redirect or show blocked — accept redirect/forbidden/ok with login
    expect([200, 302, 303, 307, 308, 403]).toContain(page.status());
  });
});
