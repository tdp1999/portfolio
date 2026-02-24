import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ddl/layout');
    await page.waitForLoadState('networkidle');
  });

  test('renders with header, content, and footer visible', async ({ page }) => {
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('sidebar-header')).toBeVisible();
    await expect(page.getByTestId('platform-group')).toBeVisible();
    await expect(page.getByTestId('sidebar-footer')).toBeVisible();
    await expect(page.getByTestId('main-content')).toBeVisible();
  });

  test('click trigger toggles sidebar open/closed', async ({ page }) => {
    const trigger = page.getByTestId('inset-trigger');
    const header = page.getByTestId('sidebar-header');

    await expect(header).toBeVisible();

    // Close sidebar via inset trigger button
    await trigger.locator('button').click();
    // The sidebar uses width transition — check that the aside collapses
    const aside = page.locator('ui-sidebar aside');
    await expect(aside).toHaveCSS('width', '0px');

    // Re-open sidebar
    await trigger.locator('button').click();
    await expect(header).toBeVisible();
  });

  test('keyboard shortcut Ctrl+B toggles sidebar', async ({ page }) => {
    const aside = page.locator('ui-sidebar aside');

    // Sidebar should be open initially
    const initialWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
    expect(initialWidth).toBeGreaterThan(0);

    // Toggle closed
    await page.keyboard.press('Control+b');
    await expect(aside).toHaveCSS('width', '0px');

    // Toggle open
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300); // wait for transition
    const reopenedWidth = await aside.evaluate((el) => el.getBoundingClientRect().width);
    expect(reopenedWidth).toBeGreaterThan(0);
  });

  test('submenu expands and collapses on click', async ({ page }) => {
    const projectsBtn = page.getByTestId('menu-projects');
    const submenu = page.getByTestId('projects-submenu');

    // Submenu should be collapsed initially
    const gridWrapper = submenu.locator('div');
    await expect(gridWrapper).toHaveCSS('grid-template-rows', '0px');

    // Click to expand
    await projectsBtn.click();
    await page.waitForTimeout(300);
    const expandedRows = await gridWrapper.evaluate((el) => getComputedStyle(el).gridTemplateRows);
    expect(parseInt(expandedRows)).toBeGreaterThan(0);
    await expect(submenu.locator('ul li').first()).toBeVisible();

    // Click to collapse
    await projectsBtn.click();
    await page.waitForTimeout(300);
    await expect(gridWrapper).toHaveCSS('grid-template-rows', '0px');
  });

  test('active route is highlighted in menu', async ({ page }) => {
    // The "Dashboard" link points to /ddl/layout which is the current route
    const dashboardBtn = page.getByTestId('menu-dashboard');
    await expect(dashboardBtn).toHaveClass(/font-semibold/);
  });

  test('dark mode renders correctly', async ({ page }) => {
    const darkToggle = page.getByTestId('dark-toggle');

    // Enable dark mode
    await darkToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Disable dark mode
    await darkToggle.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('Sidebar - mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/ddl/layout');
    await page.waitForLoadState('networkidle');
  });

  test('mobile viewport activates overlay mode with backdrop', async ({ page }) => {
    const aside = page.locator('ui-sidebar aside');

    // Sidebar should be closed on mobile initially
    await expect(aside).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -280, 0)');

    // Open sidebar via trigger (trigger should still be accessible in inset area)
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);

    // Sidebar should be visible and overlay should appear
    await expect(aside).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

    // Backdrop should be visible
    const backdrop = page.locator('ui-sidebar > div.fixed.inset-0');
    await expect(backdrop).toBeVisible();
  });

  test('backdrop click closes mobile sidebar', async ({ page }) => {
    const aside = page.locator('ui-sidebar aside');

    // Open sidebar
    await page.keyboard.press('Control+b');
    await page.waitForTimeout(300);
    await expect(aside).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');

    // Click backdrop — click to the right of the 280px sidebar
    const backdrop = page.locator('ui-sidebar > div.fixed.inset-0');
    await backdrop.click({ position: { x: 350, y: 300 } });
    await page.waitForTimeout(300);

    // Sidebar should be closed
    await expect(aside).toHaveCSS('transform', 'matrix(1, 0, 0, 1, -280, 0)');
  });
});
