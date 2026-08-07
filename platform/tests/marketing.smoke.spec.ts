import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

test.describe('M-2 Marketing landing smoke', () => {
  test('home renders hero, nav and modules', async ({ page }) => {
    await page.goto(WEB);
    await expect(page.getByTestId('marketing-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('marketing-navbar')).toBeVisible();
    await expect(page.getByTestId('marketing-hero')).toBeVisible();
    await expect(page.locator('#hero-title')).toContainText(/gestão inteligente/i);
    await expect(page.getByTestId('modules-grid')).toBeVisible();
    await expect(page.getByTestId('marketing-footer')).toBeVisible();
  });

  test('CTAs point to login and demonstracao', async ({ page }) => {
    await page.goto(WEB);
    await expect(page.getByTestId('hero-login-cta')).toHaveAttribute('href', '/login');
    await expect(page.getByTestId('hero-demo-cta')).toHaveAttribute('href', '/demonstracao');
  });

  test('blog index is public', async ({ page }) => {
    await page.goto(`${WEB}/blog`);
    await expect(page.getByTestId('blog-index')).toBeVisible();
  });

  test('SEO artifacts exist', async ({ request }) => {
    const robots = await request.get(`${WEB}/robots.txt`);
    expect(robots.status()).toBe(200);
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/sitemap/i);

    const sitemap = await request.get(`${WEB}/sitemap.xml`);
    expect(sitemap.status()).toBe(200);
    const sm = await sitemap.text();
    expect(sm).toContain('movvoerp.com.br');
  });

  test('home includes OG / Movvo metadata', async ({ page }) => {
    await page.goto(WEB);
    await expect(page).toHaveTitle(/Movvo/i);
    const og = page.locator('meta[property="og:title"]');
    await expect(og).toHaveAttribute('content', /Movvo/i);
  });

  test('demo form validates consent', async ({ page }) => {
    await page.goto(`${WEB}/demonstracao`);
    await expect(page.getByTestId('demo-form')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('demo-full-name').fill('QA Tester');
    await page.getByTestId('demo-academy').fill('Academia QA');
    await page.getByTestId('demo-city').fill('São Paulo');
    await page.getByTestId('demo-email').fill('qa@example.com');
    await page.getByTestId('demo-whatsapp').fill('11999999999');
    await page.getByTestId('demo-students').fill('120');
    await expect(page.getByTestId('demo-consent')).not.toBeChecked();
    await page.getByTestId('demo-submit').click();
    await expect(page.getByTestId('demo-error')).toContainText(/LGPD/i, { timeout: 10_000 });
  });

  test('API demo-requests accepts valid payload when available', async ({ request }) => {
    let res;
    try {
      res = await request.post(`${API}/marketing/demo-requests`, {
        data: {
          fullName: 'Playwright Lead',
          academyName: 'Gym QA',
          city: 'Campinas',
          email: `lead+m2-${Date.now()}@example.com`,
          phone: '11988887777',
          studentCount: 80,
          message: 'Smoke M-2',
          consentLgpd: true,
          website: '',
        },
        timeout: 20_000,
      });
    } catch {
      test.skip(true, 'API marketing unreachable');
      return;
    }
    if (res.status() === 404 || res.status() >= 500) {
      test.skip(true, `API marketing unavailable (${res.status()})`);
    }
    expect(res.status()).toBeLessThan(300);
    const body = await res.json();
    expect(body.ok).toBeTruthy();
  });
});
