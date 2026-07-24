import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Sales smoke', () => {
  test('leads without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/sales/leads`);
    expect(res.status()).toBe(401);
  });

  test('dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/sales/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('sales page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/sales`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
