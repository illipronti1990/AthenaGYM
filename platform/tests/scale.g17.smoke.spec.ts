import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('G-17 Scale / observability smoke', () => {
  test('health + cache endpoints respond', async ({ request }) => {
    const health = await request.get(`${API}/health`);
    expect([200, 503]).toContain(health.status());
    const body = await health.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');

    const cache = await request.get(`${API}/health/cache`);
    expect([200, 503]).toContain(cache.status());
    const cacheBody = await cache.json();
    expect(cacheBody).toHaveProperty('status');
    expect(cacheBody).toHaveProperty('check', 'cache');
  });

  test('queues health is reachable', async ({ request }) => {
    const res = await request.get(`${API}/health/queues`);
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('check', 'queues');
    expect(body).toHaveProperty('status');
  });

  test('metrics exposition is text/plain', async ({ request }) => {
    const res = await request.get(`${API}/metrics`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('movvo_http_requests_total');
  });

  test('observability status requires auth (401 ok)', async ({ request }) => {
    const res = await request.get(`${API}/observability/status`);
    expect(res.status()).toBe(401);
  });

  test('rum endpoint accepts payload', async ({ request }) => {
    const res = await request.post(`${API}/observability/rum`, {
      data: {
        url: 'http://localhost/smoke',
        samples: [{ name: 'LCP', value: 1200, rating: 'good' }],
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty('ok', true);
  });

  test('bad token gets 401/403 on observability status', async ({ request }) => {
    const res = await request.get(`${API}/observability/status`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('observability page auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/platform/observability`);
    await page.waitForURL(/\/(login|app\/platform)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('platform-observability')).toBeVisible({
        timeout: 15_000,
      });
    }
  });
});
