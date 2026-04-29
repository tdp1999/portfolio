import { test, expect } from './fixtures/auth.fixture';

/**
 * Regression spec for the post-mortem 2026-04-29 — quantity `<input type="number">`
 * fields had no `<mat-error>` rendering, so out-of-range values failed silently
 * with a server toast. After fix: every quantity input wired to a min/max
 * validator surfaces the error inline.
 *
 * Note: `type="number"` rejects non-numeric typing at the browser level
 * (Chrome empties the DOM value before Angular sees it), so this spec drives
 * out-of-range *valid numbers* (e.g. 0 when min=1) to fire the validator,
 * not letters.
 */
test.describe('Numeric inputs surface validator errors inline', () => {
  test('experience teamSizeMin renders mat-error when below min', async ({ adminPage: page }) => {
    await page.goto('/experiences/new');
    await expect(page.getByRole('heading', { name: 'Add Experience' })).toBeVisible();

    const teamSizeMin = page.locator('input[formControlName="teamSizeMin"]');
    await teamSizeMin.fill('0');
    await teamSizeMin.blur();

    const error = page
      .locator('input[formControlName="teamSizeMin"]')
      .locator('xpath=ancestor::mat-form-field')
      .locator('mat-error');
    await expect(error).toBeVisible();
  });

  test('experience teamSizeMin accepts a valid integer without error', async ({ adminPage: page }) => {
    await page.goto('/experiences/new');

    const teamSizeMin = page.locator('input[formControlName="teamSizeMin"]');
    await teamSizeMin.fill('8');
    await teamSizeMin.blur();

    const error = page
      .locator('input[formControlName="teamSizeMin"]')
      .locator('xpath=ancestor::mat-form-field')
      .locator('mat-error');
    await expect(error).toHaveCount(0);
  });
});
