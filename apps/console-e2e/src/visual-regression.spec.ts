import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * Captures screenshots of key pages and compares against baselines.
 * Run: npx playwright test -c apps/console-e2e/playwright.config.ts visual-regression
 * Update baselines: npx playwright test -c apps/console-e2e/playwright.config.ts visual-regression --update-snapshots
 */

test.describe('Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[formcontrolname="email"]', 'hello@thunderphong.com');
    await page.fill('input[formcontrolname="password"]', '100100100pPp@');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('dashboard page', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('dashboard.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('categories page', async ({ page }) => {
    await page.goto('/categories');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('categories.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
