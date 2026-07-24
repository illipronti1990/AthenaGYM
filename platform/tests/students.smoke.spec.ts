import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Students smoke', () => {
  test('students without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/students`);
    expect(res.status()).toBe(401);
  });

  test('create without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/students`, {
      data: {
        unitId: '22222222-2222-2222-2222-222222222222',
        fullName: 'Teste',
        cpf: '111.111.111-11',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('students page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/students`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
