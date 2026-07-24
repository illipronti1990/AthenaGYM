import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Operations smoke', () => {
  test('schedule without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/schedule`);
    expect(res.status()).toBe(401);
  });

  test('checkins without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/checkins`, {
      data: {
        studentId: '00000000-0000-0000-0000-000000000001',
        unitId: '22222222-2222-2222-2222-222222222222',
        method: 'manual',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('access validate without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/access/validate`, {
      data: {
        studentId: '00000000-0000-0000-0000-000000000001',
        unitId: '22222222-2222-2222-2222-222222222222',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('occupancy without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/occupancy`);
    expect(res.status()).toBe(401);
  });

  test('operations page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/operations`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
