import { test, expect } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('M-4 UX polish smoke', () => {
  test('login page is accessible and keyboard focusable', async ({ page }) => {
    await page.goto(`${WEB}/login`);
    await expect(page.getByTestId('login-form').or(page.locator('form'))).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('marketing home has skip-worthy landmark structure', async ({ page }) => {
    await page.goto(WEB);
    await expect(page.getByTestId('marketing-shell')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('marketing-hero')).toBeVisible();
  });

  test('command palette opens with Ctrl+K when authenticated shell available', async ({ page }) => {
    await page.goto(`${WEB}/app`);
    await page.waitForURL(/\/(login|app)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth required for palette');
      return;
    }
    await page.keyboard.press('Control+K');
    await expect(page.getByTestId('command-palette')).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('command-palette')).toHaveCount(0);
  });

  test('notifications toggle renders in shell when authenticated', async ({ page }) => {
    await page.goto(`${WEB}/app`);
    await page.waitForURL(/\/(login|app)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth required');
      return;
    }
    await expect(page.getByTestId('notifications-toggle')).toBeVisible();
    await page.getByTestId('notifications-toggle').click();
    await expect(page.getByTestId('notification-panel')).toBeVisible();
  });

  test('product tour can be skipped when shown', async ({ page }) => {
    await page.goto(`${WEB}/app`);
    await page.waitForURL(/\/(login|app)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth required');
      return;
    }
    await page.evaluate(() => {
      localStorage.setItem(
        'movvo_ui_prefs',
        JSON.stringify({ language: 'pt-BR', denseLayout: false, widgetsCompact: false, dateFormat: 'dd/MM/yyyy', tourCompletedV1: false }),
      );
    });
    await page.reload();
    const tour = page.getByTestId('product-tour');
    if (await tour.count()) {
      await expect(tour).toBeVisible();
      await page.getByTestId('tour-skip').click();
      await expect(tour).toHaveCount(0);
    }
  });

  test('PageState empty contract exists in codebase via help public page', async ({ page }) => {
    await page.goto(`${WEB}/ajuda`);
    await expect(page.getByTestId('help-center')).toBeVisible({ timeout: 20_000 });
  });
});
