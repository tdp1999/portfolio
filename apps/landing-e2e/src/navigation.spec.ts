import { test, expect } from '@playwright/test';

/**
 * E2E tests for navigation functionality
 * Tests verify that navigation works correctly
 */
test.describe('Landing Page - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have router outlet present', async ({ page }) => {
    // Verify router outlet exists for future navigation
    const routerOutlet = page.locator('router-outlet');
    await expect(routerOutlet).toBeAttached();
  });

  test('should navigate using in-page anchor links', async ({ page }) => {
    // Click on "What's next?" link in hero section
    const whatsNextLink = page.getByRole('link', { name: /what's next/i });
    await expect(whatsNextLink).toBeVisible();
    await whatsNextLink.click();

    // Verify URL contains the anchor
    expect(page.url()).toContain('#commands');

    // Verify commands section is in viewport
    const commandsSection = page.locator('#commands');
    await expect(commandsSection).toBeInViewport();
  });

  test('should maintain app structure on refresh', async ({ page }) => {
    // Verify initial structure
    await expect(page.locator('app-root')).toBeAttached();
    await expect(page.locator('#welcome')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify structure is maintained after reload
    await expect(page.locator('app-root')).toBeAttached();
    await expect(page.locator('#welcome')).toBeVisible();
  });

  test('should handle 404 routes gracefully', async ({ page }) => {
    // Navigate to a non-existent route
    const response = await page.goto('/non-existent-route');

    // The app should still respond (even if route doesn't exist)
    // Since routes are empty, the app loads with the default component
    expect(response?.status()).toBeLessThan(500);
  });

  test('should preserve state when navigating back and forward', async ({ page }) => {
    // Scroll to a specific section
    const commandsSection = page.locator('#commands');
    await commandsSection.scrollIntoViewIfNeeded();

    // Navigate to an external link's href (without following it)
    const currentUrl = page.url();

    // Go back and forward
    await page.goBack();
    await page.goForward();

    // Verify we're still on the same page
    expect(page.url()).toBe(currentUrl);
    await expect(page.locator('app-root')).toBeAttached();
  });

  test('should have working external navigation links', async ({ page }) => {
    // Get all external links
    const externalLinks = page.locator('a[href^="http"]');
    const count = await externalLinks.count();

    // Verify we have external links
    expect(count).toBeGreaterThan(0);

    // Check that external links are clickable (without actually clicking)
    const firstExternalLink = externalLinks.first();
    await expect(firstExternalLink).toBeVisible();
    await expect(firstExternalLink).toHaveAttribute('href', /^https?:\/\//);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Focus on the first interactive element
    await page.keyboard.press('Tab');

    // Verify an element received focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeAttached();
  });

  test('should maintain scroll position within single page', async ({ page }) => {
    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY);
    expect(initialScroll).toBe(0);

    // Scroll to commands section
    await page.locator('#commands').scrollIntoViewIfNeeded();

    // Verify scroll position changed
    const scrolledPosition = await page.evaluate(() => window.scrollY);
    expect(scrolledPosition).toBeGreaterThan(0);

    // Scroll back to top
    await page.locator('#welcome').scrollIntoViewIfNeeded();

    // Verify we're near the top
    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBeLessThan(scrolledPosition);
  });
});
