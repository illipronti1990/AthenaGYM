import { test, expect } from '@playwright/test';
import { DesignTokens } from '../packages/theme/src/design-tokens';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('Movvo branding M-1+ smoke', () => {
  test('login page shows Movvo product brand', async ({ page }) => {
    await page.goto(`${WEB}/login`);
    await expect(page.getByTestId('login-page')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('logo-movvo').first()).toBeVisible();
    await expect(page.getByTestId('login-brand')).toContainText(/Movvo/i);
    await expect(page.getByTestId('login-brand')).toContainText(/Movimente sua gestão/i);
    await expect(page.getByTestId('login-footer')).toContainText(/Movvo ERP/i);
    await expect(page.getByTestId('login-footer')).toContainText(/0\.7\.0-beta/i);
    await expect(page.getByTestId('login-footer')).toContainText(/Build 2026\.08/i);
    await expect(page.getByTestId('login-footer')).toContainText(/Athena Academia/i);
  });

  test('document title is Movvo ERP', async ({ page }) => {
    await page.goto(`${WEB}/login`);
    await expect(page).toHaveTitle(/Movvo ERP/i);
  });

  test('brand assets are served', async ({ request }) => {
    for (const path of [
      '/brand/logo.svg',
      '/brand/logo-mark.svg',
      '/brand/favicon.svg',
      '/brand/manifest.webmanifest',
      '/brand/social-preview.png',
      '/brand/movvo-ai.svg',
      '/brand/movvo-ai-32.png',
      '/brand/movvo-ai-64.png',
    ]) {
      const res = await request.get(`${WEB}${path}`);
      expect(res.status(), path).toBe(200);
    }
  });

  test('Brand API returns Movvo product schema', async ({ request }) => {
    const res = await request.get(`${API}/branding`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toMatch(/Movvo/i);
    expect(body.slogan).toMatch(/Movimente sua gestão/i);
    expect(body.version).toBe('0.7.0-beta');
    expect(body.buildLabel).toBe('2026.08');
    expect(body.aiName).toMatch(/Movvo AI/i);
    expect(body.colors?.primary).toBeTruthy();
    expect(body.logo || body.assets?.logo).toBeTruthy();
    expect(body.domain).toMatch(/movvoerp/i);
  });

  test('feature flags endpoint returns 200 with known keys', async ({ request }) => {
    const res = await request.get(`${API}/platform/features`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.flags).toBeTruthy();
    for (const key of [
      'inventory',
      'crm',
      'ai',
      'bi',
      'pdv',
      'marketplace',
      'whiteLabel',
      'mobile',
    ]) {
      expect(typeof body.flags[key]).toBe('boolean');
    }
  });

  test('chart design tokens export semantic palette', async () => {
    expect(DesignTokens.charts.revenue).toMatch(/^#/i);
    expect(DesignTokens.charts.expense).toMatch(/^#/i);
    expect(DesignTokens.charts.wellhub).toMatch(/^#/i);
    expect(DesignTokens.charts.totalPass).toMatch(/^#/i);
    expect(DesignTokens.charts.goal).toMatch(/^#/i);
    expect(DesignTokens.charts.checkins).toMatch(/^#/i);
    expect(DesignTokens.motion.fast).toBe(150);
    expect(DesignTokens.icons.stroke).toBe(2);
  });

  test('API swagger title mentions Movvo when docs available', async ({ request }) => {
    const res = await request.get(`${API.replace(/\/api\/v1$/, '')}/api/docs-json`).catch(() => null);
    if (!res || !res.ok()) {
      test.skip(true, 'swagger json unavailable');
    }
    const body = (await res!.json()) as { info?: { title?: string } };
    expect(String(body.info?.title || '')).toMatch(/Movvo/i);
  });
});
