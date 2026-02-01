import { test, expect } from '@playwright/test';

/**
 * Basic smoke test to verify Playwright setup
 * This test ensures the landing page loads successfully
 */
test.describe('Landing Page Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    await expect(page).toHaveTitle(/.*/);
  });

  test('should have a visible viewport', async ({ page }) => {
    await page.goto('/');

    // Check that the page has content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
