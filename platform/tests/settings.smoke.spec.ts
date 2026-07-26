import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Settings / Sprint 10 smoke', () => {
  test('settings without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/settings`);
    expect(res.status()).toBe(401);
  });

  test('dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('audit without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/audit`);
    expect(res.status()).toBe(401);
  });

  test('backup without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/backup`);
    expect(res.status()).toBe(401);
  });

  test('prints student without token get 401', async ({ request }) => {
    const res = await request.get(
      `${API}/prints/student/00000000-0000-0000-0000-000000000001`,
    );
    expect(res.status()).toBe(401);
  });

  test('prints contract without token get 401', async ({ request }) => {
    const res = await request.get(
      `${API}/prints/contract/00000000-0000-0000-0000-000000000001`,
    );
    expect(res.status()).toBe(401);
  });

  test('settings page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/settings`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test('dashboard page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
