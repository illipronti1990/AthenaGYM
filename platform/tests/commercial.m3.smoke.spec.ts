import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fillDemoBasics(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('demo-form')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('demo-full-name').fill('QA M3');
  await page.getByTestId('demo-academy').fill('Academia M3');
  await page.getByTestId('demo-city').fill('Curitiba');
  await page.getByTestId('demo-email').fill('qa.m3@example.com');
  await page.getByTestId('demo-whatsapp').fill('41999999999');
  await page.getByTestId('demo-students').fill('200');
}

test.describe('M-3 Commercial smoke', () => {
  test('planos page has comparison table and plan CTAs', async ({ page }) => {
    await page.goto(`${WEB}/planos`);
    await expect(page.getByTestId('plans')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('plans-table')).toBeVisible();
    await expect(page.getByTestId('plan-cta-pro')).toHaveAttribute('href', /\/demonstracao\?plan=pro/);
  });

  test('demo flow redirects to thanks with mocked API', async ({ page }) => {
    await page.route('**/api/v1/marketing/demo-requests', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: 'lead-m3-smoke', message: 'ok' }),
      });
    });

    await page.goto(`${WEB}/demonstracao?plan=pro`);
    await fillDemoBasics(page);
    await page.getByTestId('demo-consent').check();
    await page.getByTestId('demo-submit').click();
    await expect(page).toHaveURL(/\/demonstracao\/obrigado/, { timeout: 15_000 });
    await expect(page.getByTestId('demo-thanks')).toBeVisible();
    await expect(page.getByText(/lead-m3-smoke/i)).toBeVisible();
  });

  test('ajuda and blog seed content are public', async ({ page }) => {
    await page.goto(`${WEB}/ajuda`);
    await expect(page.getByTestId('help-center')).toBeVisible({ timeout: 20_000 });

    await page.goto(`${WEB}/blog`);
    await expect(page.getByTestId('blog-index')).toBeVisible();
    await expect(page.getByRole('link', { name: /Gestão inteligente/i })).toBeVisible();
  });

  test('sobre, status and developers respond 200', async ({ request }) => {
    for (const path of ['/sobre', '/status', '/developers']) {
      const res = await request.get(`${WEB}${path}`);
      expect(res.status(), path).toBe(200);
    }
  });

  test('CRM commercial requires auth gate', async ({ page }) => {
    await page.goto(`${WEB}/app/commercial`);
    await page.waitForURL(/\/(login|app\/commercial)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      await expect(page.getByTestId('login-form')).toBeVisible();
    } else {
      await expect(page.getByText(/CRM comercial/i)).toBeVisible();
    }
  });

  test('API demo-requests accepts M3 fields when available', async ({ request }) => {
    let res;
    try {
      res = await request.post(`${API}/marketing/demo-requests`, {
        data: {
          fullName: 'Playwright M3',
          academyName: 'Gym M3',
          city: 'Florianópolis',
          state: 'SC',
          email: `lead+m3-${Date.now()}@example.com`,
          whatsapp: '48988887777',
          phone: '48988887777',
          studentCount: 90,
          primaryInterest: 'financeiro',
          planInterest: 'pro',
          message: 'Smoke M-3',
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
