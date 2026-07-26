import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Sprint 11 polish smoke', () => {
  test('search without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/search?q=jo`);
    expect(res.status()).toBe(401);
  });

  test('favorites without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/favorites`);
    expect(res.status()).toBe(401);
  });

  test('timeline without token get 401', async ({ request }) => {
    const res = await request.get(
      `${API}/timeline/student/00000000-0000-0000-0000-000000000001`,
    );
    expect(res.status()).toBe(401);
  });

  test('logs without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/logs`);
    expect(res.status()).toBe(401);
  });

  test('exports students without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/exports/students?format=csv`);
    expect(res.status()).toBe(401);
  });

  test('health is public and returns checks', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('api');
  });

  test('help page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/help`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test('admin health redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/admin/health`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
