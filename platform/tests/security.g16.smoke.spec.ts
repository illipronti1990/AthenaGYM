import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('G-16 Security smoke', () => {
  test('health endpoints respond', async ({ request }) => {
    const health = await request.get(`${API}/health`);
    expect([200, 503]).toContain(health.status());
    const body = await health.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');

    for (const path of ['/health/db', '/health/cache', '/health/integrations']) {
      const res = await request.get(`${API}${path}`);
      expect([200, 503]).toContain(res.status());
    }
  });

  test('security routes require auth', async ({ request }) => {
    for (const path of [
      '/security/dashboard',
      '/security/sessions',
      '/security/mfa',
      '/security/lgpd/requests',
      '/security/retention',
      '/security/backups',
    ]) {
      const res = await request.get(`${API}${path}`);
      expect(res.status()).toBe(401);
    }
  });

  test('login-events accepts payload and may rate-limit', async ({ request }) => {
    const res = await request.post(`${API}/auth/login-events`, {
      data: { email: 'security-smoke@example.com', success: false, reason: 'smoke' },
    });
    expect([200, 401, 429]).toContain(res.status());
  });

  test('bad token gets 401/403 on security routes', async ({ request }) => {
    const headers = { Authorization: 'Bearer invalid-token' };
    for (const path of ['/security/dashboard', '/security/sessions', '/audit']) {
      const res = await request.get(`${API}${path}`, { headers });
      expect([401, 403]).toContain(res.status());
    }
  });

  test('security dashboard auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/security/dashboard`);
    await page.waitForURL(/\/(login|app\/security)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('security-dashboard')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('sessions page auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/security/sessions`);
    await page.waitForURL(/\/(login|app\/security)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('security-sessions')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('lgpd page auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/security/lgpd`);
    await page.waitForURL(/\/(login|app\/security)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    }
  });
});
