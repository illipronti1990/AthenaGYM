import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Engagement smoke', () => {
  test('notifications without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/notifications`);
    expect(res.status()).toBe(401);
  });

  test('messages without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/messages?conversationId=00000000-0000-0000-0000-000000000001`);
    expect(res.status()).toBe(401);
  });

  test('campaigns without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/campaigns`);
    expect(res.status()).toBe(401);
  });

  test('loyalty without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/loyalty`);
    expect(res.status()).toBe(401);
  });

  test('ranking without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/ranking`);
    expect(res.status()).toBe(401);
  });

  test('challenges without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/challenges`, {
      data: {
        title: 'Sprint challenge',
        description: 'smoke',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        reward: '100 pts',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('ai chat without token get 401', async ({ request }) => {
    const res = await request.post(`${API}/ai/chat`, {
      data: { question: 'Qual treino tenho hoje?' },
    });
    expect(res.status()).toBe(401);
  });

  test('engagement dashboard without token get 401', async ({ request }) => {
    const res = await request.get(`${API}/engagement/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('engagement page redirects unauthenticated to login', async ({ page }) => {
    await page.goto(`${WEB}/app/engagement`);
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });
  });
});
