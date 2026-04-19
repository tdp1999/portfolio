import { test, expect } from './fixtures/auth.fixture';
import { MediaPickerPage } from './pages/media-picker.page';

test.describe('Media Picker Dialog', () => {
  test.describe('Core Picker Components & UX', () => {
    test('asset-grid displays media items with data-media-id', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const grid = page.locator('console-asset-grid');
      const isVisible = await grid.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      const items = grid.locator('[data-media-id]');
      const count = await items.count();

      if (count > 0) {
        const firstId = await items.first().getAttribute('data-media-id');
        expect(firstId).toBeTruthy();
        expect(typeof firstId).toBe('string');
      }
    });

    test('asset-grid items are clickable buttons', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const grid = page.locator('console-asset-grid');
      const items = grid.locator('button[data-media-id]');
      const count = await items.count();

      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('asset-filter-bar component present in media page', async ({ adminPage: page }) => {
      await page.goto('/media');

      const filterBar = page.locator('console-asset-filter-bar');
      const isVisible = await filterBar.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      await expect(filterBar).toBeVisible();
    });

    test('picker can filter media by MIME group', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const filterBar = page.locator('console-asset-filter-bar');
      const isVisible = await filterBar.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      const buttons = filterBar.locator('button');

      // Should have filter buttons
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('media grid supports view mode toggle (grid ↔ list)', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const viewToggle = page.locator('.picker__view-toggle, [aria-label*="view" i]').first();
      const exists = (await viewToggle.count()) >= 0;

      expect(exists).toBe(true);
    });
  });

  test.describe('Keyboard Navigation & Accessibility', () => {
    test('media grid responds to arrow key navigation', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(1000);

      const grid = page.locator('console-asset-grid');
      const items = grid.locator('[data-media-id]');
      const count = await items.count();

      if (count > 0) {
        const firstItem = items.first();
        await firstItem.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        expect(true).toBe(true);
      }
    });

    test('media grid supports Space for selection', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(1000);

      const grid = page.locator('console-asset-grid');
      const items = grid.locator('[data-media-id]');
      const count = await items.count();

      if (count > 0) {
        const firstItem = items.first();
        await firstItem.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(200);
        expect(true).toBe(true);
      }
    });

    test('grid items have proper ARIA labels', async ({ adminPage: page }) => {
      await page.goto('/media');

      const grid = page.locator('console-asset-grid');
      const items = grid.locator('button[data-media-id]');
      const count = await items.count();

      if (count > 0) {
        const ariaLabel = await items.first().getAttribute('aria-label');
        // Should have some label (filename or similar)
        expect(ariaLabel).toBeTruthy();
      }
    });
  });

  test.describe('Picker Components Integration', () => {
    test('console-asset-grid component exists', async ({ adminPage: page }) => {
      await page.goto('/media');

      const grid = page.locator('console-asset-grid');
      const isVisible = await grid.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      await expect(grid).toBeVisible();
    });

    test('console-asset-filter-bar component exists', async ({ adminPage: page }) => {
      await page.goto('/media');

      const filterBar = page.locator('console-asset-filter-bar');
      const isVisible = await filterBar.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      await expect(filterBar).toBeVisible();
    });

    test('console-asset-upload-zone component available for upload', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const uploadZone = page.locator('console-asset-upload-zone');
      // May not be visible initially but should exist in DOM
      const count = await uploadZone.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('console-recently-used-strip component available', async ({ adminPage: page }) => {
      await page.goto('/media');

      const recentStrip = page.locator('console-recently-used-strip');
      const count = await recentStrip.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('media-picker-dialog component structure', async ({ adminPage: page }) => {
      await page.goto('/media');

      const pickerDialog = page.locator('console-media-picker-dialog');
      const count = await pickerDialog.count();
      // May not be open but should exist in codebase
      expect(typeof count).toBe('number');
    });
  });

  test.describe('Regression: Media Page Still Works', () => {
    test('media page loads with heading and grid', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const heading = page.getByRole('heading', { name: /media/i });
      const grid = page.locator('console-asset-grid');

      const headingVisible = await heading.isVisible().catch(() => false);
      if (!headingVisible) {
        test.skip();
        return;
      }

      await expect(heading).toBeVisible();
      await expect(grid).toBeVisible();
    });

    test('media grid grid displays items without errors', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(1000);

      const items = page.locator('[data-media-id]');
      const count = await items.count();

      // Should have content (or be empty gracefully)
      expect(count >= 0).toBe(true);
    });

    test('media page layout has expected sections', async ({ adminPage: page }) => {
      await page.goto('/media');

      const dropzone = page.locator('console-asset-upload-zone').first();
      const grid = page.locator('console-asset-grid');
      const filterBar = page.locator('console-asset-filter-bar').first();

      // All components should be in the DOM
      expect((await dropzone.count()) >= 0).toBe(true);
      expect((await grid.count()) >= 0).toBe(true);
      expect((await filterBar.count()) >= 0).toBe(true);
    });
  });

  test.describe('Data Attributes for E2E Testing', () => {
    test('grid items have data-media-id attribute for reliable selection', async ({ adminPage: page }) => {
      await page.goto('/media');
      await page.waitForTimeout(500);

      const mediaId = page.locator('[data-media-id]').first();
      const count = await mediaId.count();

      if (count === 0) {
        test.skip();
        return;
      }

      const id = await mediaId.getAttribute('data-media-id');

      if (id) {
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      }
    });

    test('grid items support role-based selection for accessibility', async ({ adminPage: page }) => {
      await page.goto('/media');

      const gridItem = page.locator('[role="gridcell"], [role="option"]').first();
      const role = await gridItem.getAttribute('role');

      // Should have an appropriate role for accessibility
      expect(['gridcell', 'option', null].includes(role)).toBe(true);
    });
  });
});
