import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Landing Page home page
 * Tests verify that the home page loads and displays key sections
 */
test.describe('Landing Page - Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the welcome heading', async ({ page }) => {
    // Verify the welcome section is visible
    const welcomeHeading = page.locator('#welcome h1');
    await expect(welcomeHeading).toBeVisible();
    await expect(welcomeHeading).toContainText('Welcome landing');
  });

  test('should display the hero section', async ({ page }) => {
    // Verify the hero section exists and is visible
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();

    // Verify hero heading
    const heroHeading = page.locator('#hero h2');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText("You're up and running");
  });

  test('should display learning materials section', async ({ page }) => {
    // Verify learning materials section
    const learningSection = page.locator('#learning-materials');
    await expect(learningSection).toBeVisible();

    // Verify section heading
    const heading = learningSection.locator('h2');
    await expect(heading).toContainText('Learning materials');

    // Verify links are present
    const documentationLink = learningSection.getByRole('link', { name: /documentation/i });
    await expect(documentationLink).toBeVisible();

    const blogLink = learningSection.getByRole('link', { name: /blog/i });
    await expect(blogLink).toBeVisible();
  });

  test('should display commands section', async ({ page }) => {
    // Verify commands section
    const commandsSection = page.locator('#commands');
    await expect(commandsSection).toBeVisible();

    // Verify section heading
    const heading = commandsSection.locator('h2');
    await expect(heading).toContainText('Next steps');
  });

  test('should have external links with correct attributes', async ({ page }) => {
    // Verify external links have target="_blank" and rel="noreferrer"
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    // Should have multiple external links
    expect(count).toBeGreaterThan(0);

    // Check first external link has correct attributes
    const firstLink = externalLinks.first();
    await expect(firstLink).toHaveAttribute('rel', 'noreferrer');
  });

  test('should display Nx logo in hero section on larger screens', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Verify Nx logo SVG exists in hero section
    const nxLogo = page.locator('#hero .logo-container svg');
    await expect(nxLogo).toBeAttached();
  });

  test('should have footer with love message', async ({ page }) => {
    // Verify footer message
    const footer = page.locator('#love');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Carefully crafted with');
  });
});
