import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEV_EMAIL = process.env.ATHENA_E2E_EMAIL || 'admin@athena.gym';
const DEV_PASSWORD = process.env.ATHENA_E2E_PASSWORD || 'Admin@123';

async function login(request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API}/auth/login`, {
    data: { email: DEV_EMAIL, password: DEV_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; access_token?: string };
  return body.accessToken || body.access_token || null;
}

test.describe('Financeiro G-5 smoke', () => {
  test('dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/finance/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('receivables without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/finance/receivables`);
    expect(res.status()).toBe(401);
  });

  test('financeiro page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/financeiro`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test('legacy /app/finance redirects toward financeiro when unauthenticated', async ({ page }) => {
    await page.goto(`${WEB}/app/finance`);
    await expect(page).toHaveURL(/login|financeiro/, { timeout: 15_000 });
  });

  test('authenticated finance flows: receber, pagar, caixa, delinquency, health', async ({
    request,
  }) => {
    const token = await login(request);
    test.skip(!token, 'Dev login unavailable');

    const headers = { Authorization: `Bearer ${token}` };

    const dash = await request.get(`${API}/finance/dashboard`, { headers });
    expect(dash.status()).toBe(200);
    const dashBody = await dash.json();
    expect(dashBody).toHaveProperty('monthRevenue');
    expect(dashBody).toHaveProperty('health');
    expect(dashBody.health).toHaveProperty('score');
    expect(typeof dashBody.health.score).toBe('number');

    const due = `2099-12-31`;
    const createRec = await request.post(`${API}/finance/receivables`, {
      headers,
      data: {
        description: 'Smoke G5 mensalidade',
        amount: 100,
        dueDate: due,
        discount: 0,
        addition: 5,
      },
    });
    expect(createRec.status()).toBeLessThan(300);
    const receivable = await createRec.json();
    expect(receivable.id).toBeTruthy();

    const partial = await request.post(`${API}/finance/receivables/${receivable.id}/receive`, {
      headers,
      data: { amount: 40, interest: 0, fine: 0 },
    });
    expect(partial.status()).toBeLessThan(300);
    const partialBody = await partial.json();
    expect(partialBody.status).toBe('partial');

    const full = await request.post(`${API}/finance/receivables/${receivable.id}/receive`, {
      headers,
      data: { amount: 65 },
    });
    expect(full.status()).toBeLessThan(300);
    const fullBody = await full.json();
    expect(fullBody.status).toBe('paid');

    const createPay = await request.post(`${API}/finance/payables`, {
      headers,
      data: {
        description: 'Smoke G5 luz',
        amount: 200,
        dueDate: due,
        category: 'luz',
        supplierName: 'Fornecedor Smoke',
      },
    });
    expect(createPay.status()).toBeLessThan(300);
    const payable = await createPay.json();

    const pay = await request.post(`${API}/finance/payables/${payable.id}/pay`, { headers });
    expect(pay.status()).toBeLessThan(300);

    const open = await request.post(`${API}/finance/sessions/open`, {
      headers,
      data: { openingAmount: 50 },
    });
    // may already be open from previous run
    expect([200, 201, 400]).toContain(open.status());

    const current = await request.get(`${API}/finance/sessions/current`, { headers });
    expect(current.status()).toBe(200);
    const session = await current.json();
    if (session?.id) {
      const sangria = await request.post(`${API}/finance/sessions/${session.id}/sangria`, {
        headers,
        data: { amount: 10, notes: 'smoke' },
      });
      expect(sangria.status()).toBeLessThan(300);

      const close = await request.post(`${API}/finance/sessions/${session.id}/close`, {
        headers,
        data: { countedAmount: 30 },
      });
      expect(close.status()).toBeLessThan(300);
      const closed = await close.json();
      expect(closed.status).toBe('closed');
      expect(closed).toHaveProperty('difference');
    }

    const summary = await request.get(`${API}/finance/cashflow/summary?range=month`, { headers });
    expect(summary.status()).toBe(200);
    const sumBody = await summary.json();
    expect(sumBody).toHaveProperty('openingBalance');
    expect(sumBody).toHaveProperty('closingBalance');

    const delinq = await request.get(`${API}/finance/delinquency`, { headers });
    expect(delinq.status()).toBe(200);
    const delinqBody = await delinq.json();
    expect(delinqBody).toHaveProperty('count');
    expect(delinqBody).toHaveProperty('items');

    const alerts = await request.get(`${API}/finance/receivables/due-alerts?days=30,15,7,3,1`, {
      headers,
    });
    expect(alerts.status()).toBe(200);

    const renew = await request.post(`${API}/finance/subscriptions/renew-due`, { headers });
    expect(renew.status()).toBeLessThan(300);

    const noPay = await request.post(`${API}/finance/receivables/${receivable.id}/receive`, {
      headers: {},
      data: { amount: 1 },
    });
    expect(noPay.status()).toBe(401);
  });
});
