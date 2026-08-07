import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('G-15 SaaS smoke', () => {
  test('platform tenants without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/platform/tenants`);
    expect(res.status()).toBe(401);
  });

  test('saas billing dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/saas-billing/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('plans list may be gated 401 without auth', async ({ request }) => {
    const res = await request.get(`${API}/saas-billing/plans`);
    expect([200, 401]).toContain(res.status());
  });

  test('platform features endpoint is public', async ({ request }) => {
    const res = await request.get(`${API}/platform/features`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flags).toBeTruthy();
  });

  test('resolve-host is public', async ({ request }) => {
    const res = await request.get(`${API}/platform/resolve-host?hostname=example.invalid`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('companyId');
  });

  test('platform dashboard auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/platform/dashboard`);
    await page.waitForURL(/\/(login|app\/platform)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('saas-dashboard')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('bad token gets 401/403 on SaaS routes', async ({ request }) => {
    const headers = { Authorization: 'Bearer invalid-token' };
    for (const path of [
      '/platform/tenants',
      '/saas-billing/subscription',
      '/saas-billing/invoices',
      '/saas-billing/reports/tenants',
      '/platform/clients',
    ]) {
      const res = await request.get(`${API}${path}`, { headers });
      expect([401, 403]).toContain(res.status());
    }
  });
});
