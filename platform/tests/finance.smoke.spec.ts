import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Finance smoke', () => {
  test('dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/finance/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('receivables without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/finance/receivables`);
    expect(res.status()).toBe(401);
  });

  test('finance page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/finance`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
