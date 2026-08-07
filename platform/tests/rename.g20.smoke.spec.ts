import { test, expect } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './helpers/e2eEnv';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('G-20 Rename Athena → Movvo smoke', () => {
  test('API health identifies movvo service', async ({ request }) => {
    const res = await request.get(`${API}/health`);
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(String(body.service || '')).toMatch(/movvo/i);
  });

  test('public branding is Movvo product', async ({ request }) => {
    const res = await request.get(`${API}/branding`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(String(body.name || body.shortName || '')).toMatch(/movvo/i);
  });

  test('login page shows Movvo brand shell', async ({ page }) => {
    await page.goto(`${WEB}/login`);
    await expect(page.getByTestId('login-form').or(page.getByTestId('login-card'))).toBeVisible({
      timeout: 20_000,
    });
    const html = await page.content();
    expect(html.toLowerCase()).not.toContain('logoathena');
    expect(html).not.toMatch(/Athena ERP/i);
  });

  test('demo credentials env resolves', async () => {
    expect(E2E_EMAIL).toBeTruthy();
    expect(E2E_PASSWORD).toBeTruthy();
    expect(E2E_EMAIL).toContain('@');
  });
});
