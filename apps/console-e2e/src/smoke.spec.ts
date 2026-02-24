import { test, expect } from '@playwright/test';

test.describe('Console App Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/.*/);
  });

  test('should have a visible viewport', async ({ page }) => {
    await page.goto('/');

    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
