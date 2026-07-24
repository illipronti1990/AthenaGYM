import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Workouts smoke', () => {
  test('workouts without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/workouts`);
    expect(res.status()).toBe(401);
  });

  test('exercises without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/exercises`);
    expect(res.status()).toBe(401);
  });

  test('assessments without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/assessments`, {
      data: { studentId: '00000000-0000-0000-0000-000000000001', weight: 70, height: 170 },
    });
    expect(res.status()).toBe(401);
  });

  test('ai suggestions without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/ai/workout-suggestions`, {
      data: { studentId: '00000000-0000-0000-0000-000000000001' },
    });
    expect(res.status()).toBe(401);
  });

  test('workouts page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/workouts`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
