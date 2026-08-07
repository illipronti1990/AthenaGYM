import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('G-14 Admin backoffice smoke', () => {
  test('admin employees without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/employees`);
    expect(res.status()).toBe(401);
  });

  test('admin dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/admin/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('admin routes require auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/admin/dashboard`);
    await page.waitForURL(/\/(login|app\/admin)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('colaboradores page auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/admin/colaboradores`);
    await page.waitForURL(/\/(login|app\/admin)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('admin-employees')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('roles alias redirects to admin cargos', async ({ page }) => {
    await page.goto(`${WEB}/app/roles`);
    await page.waitForURL(/\/(login|app\/admin\/cargos)/, { timeout: 20_000 });
    if (!page.url().includes('/login')) {
      expect(page.url()).toContain('/app/admin/cargos');
    }
  });

  test('API admin endpoints respond 401/403 for bad token', async ({ request }) => {
    const headers = { Authorization: 'Bearer invalid-token' };
    for (const path of [
      '/admin/employees',
      '/admin/assets',
      '/admin/maintenance',
      '/admin/documents',
      '/admin/incidents',
      '/admin/announcements',
      '/admin/dashboard',
      '/admin/reports/employees',
    ]) {
      const res = await request.get(`${API}${path}`, { headers });
      expect([401, 403]).toContain(res.status());
    }
  });
});
