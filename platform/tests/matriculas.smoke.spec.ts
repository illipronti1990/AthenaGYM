import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Matriculas G-4 smoke', () => {
  test('plans without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/sales/plans`);
    expect(res.status()).toBe(401);
  });

  test('enrollments without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/sales/enrollments`);
    expect(res.status()).toBe(401);
  });

  test('renewals-due without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/sales/enrollments/renewals-due`);
    expect(res.status()).toBe(401);
  });

  test('complete enrollment without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/sales/enrollments/complete`, {
      data: { planId: '00000000-0000-0000-0000-000000000000', fullName: 'Teste' },
    });
    expect(res.status()).toBe(401);
  });

  test('matriculas page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/matriculas`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test('matriculas/nova redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/matriculas/nova`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });

  test('legacy sales/enrollments redirects toward matriculas', async ({ page }) => {
    await page.goto(`${WEB}/app/sales/enrollments`);
    await expect(page).toHaveURL(/login|matriculas/, { timeout: 15_000 });
  });
});
