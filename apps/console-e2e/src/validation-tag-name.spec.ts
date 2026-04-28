import { test, expect } from './fixtures/auth.fixture';

/**
 * Regression spec for the validation centralization epic — Tag.name is capped
 * at 50 chars on both FE (`baselineFor` + `LIMITS.TAG_NAME_MAX`) and BE
 * (`TagNameSchema`). Before centralization the FE allowed 100 chars and the
 * server rejected anything over 50, so users got a server toast instead of an
 * inline `<mat-error>`. Asserts the FE blocks first.
 */
test.describe('Tag.name max-length validation (FE inline)', () => {
  test('typing 51 characters surfaces an inline mat-error', async ({ adminPage: page }) => {
    await page.goto('/tags/new');
    await expect(page.getByRole('heading', { name: 'New Tag' })).toBeVisible();

    const nameInput = page.locator('input[formControlName="name"]');
    await nameInput.fill('a'.repeat(51));
    await nameInput.blur();

    await expect(page.locator('mat-error')).toContainText('50 characters or less');
  });

  test('typing 51 characters and clicking save does not POST to /api/tags', async ({ adminPage: page }) => {
    await page.goto('/tags/new');

    const nameInput = page.locator('input[formControlName="name"]');
    await nameInput.fill('a'.repeat(51));

    let postFired = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/tags')) postFired = true;
    });

    await page.getByRole('button', { name: /^save$/i }).click();
    await page.waitForTimeout(500);

    expect(postFired).toBe(false);
    await expect(page).toHaveURL(/\/tags\/new$/);
  });

  test('typing exactly 50 characters has no inline error', async ({ adminPage: page }) => {
    await page.goto('/tags/new');

    const nameInput = page.locator('input[formControlName="name"]');
    await nameInput.fill('a'.repeat(50));
    await nameInput.blur();

    await expect(page.locator('mat-error')).toHaveCount(0);
  });
});
