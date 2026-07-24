import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Analytics smoke', () => {
  test('analytics dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/analytics/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('kpis without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/analytics/kpis`);
    expect(res.status()).toBe(401);
  });

  test('churn without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/analytics/churn`);
    expect(res.status()).toBe(401);
  });

  test('predictions without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/analytics/predictions`);
    expect(res.status()).toBe(401);
  });

  test('executive without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/executive`);
    expect(res.status()).toBe(401);
  });

  test('reports without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/reports`, {
      data: {
        name: 'Smoke',
        source: 'revenue',
        fields: ['date', 'profit'],
      },
    });
    expect(res.status()).toBe(401);
  });

  test('exports without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/exports`, {
      data: { format: 'csv', source: 'revenue' },
    });
    expect(res.status()).toBe(401);
  });

  test('ai insights without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/ai/insights`, {
      data: { question: 'Qual a receita do mês?' },
    });
    expect(res.status()).toBe(401);
  });

  test('analytics page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/analytics`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
