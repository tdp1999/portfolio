import { test, expect } from './fixtures/auth.fixture';
import { ChangePasswordPage } from './pages/change-password.page';
import { TEST_USERS } from './data/test-users';

/**
 * Regression spec for the validation centralization epic — `passwordValidator()`
 * mirrors the BE `PASSWORD_REGEX` (≥8 chars, upper + lower + digit + special).
 * Before centralization the FE only enforced `minLength(8)` so weak passwords
 * sailed past the form and bounced off the server. Asserts the FE blocks first.
 */
test.describe('Password complexity validation (FE inline)', () => {
  test('weak passwords show an inline error on /settings/change-password', async ({ authenticatedPage: page }) => {
    const changePage = new ChangePasswordPage(page);
    await changePage.goto();

    // Cases that pass the old `minLength(8)` rule but fail the complexity regex.
    const weakCases = [
      'alllower1!', // missing uppercase
      'ALLUPPER1!', // missing lowercase
      'NoDigits!', //  missing digit
      'NoSpecial1', // missing special
      'Short1!', //   < 8 chars
    ];

    for (const weak of weakCases) {
      await changePage.newPasswordInput.fill(weak);
      await changePage.newPasswordInput.blur();
      await expect(page.locator('mat-error')).toContainText(/uppercase|lowercase|number|special|8 characters/i);
      await changePage.newPasswordInput.clear();
    }
  });

  test('weak password + click save does not POST to /api/auth/change-password', async ({ authenticatedPage: page }) => {
    const changePage = new ChangePasswordPage(page);
    await changePage.goto();

    let postFired = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/auth/change-password')) postFired = true;
    });

    await changePage.changePassword(TEST_USERS.standard.password, 'weakpass');
    await page.waitForTimeout(500);

    expect(postFired).toBe(false);
    await expect(page).toHaveURL(/\/settings\/change-password/);
  });

  test('strong password passes inline validation', async ({ authenticatedPage: page }) => {
    const changePage = new ChangePasswordPage(page);
    await changePage.goto();

    await changePage.newPasswordInput.fill('Str0ng#Pass!');
    await changePage.newPasswordInput.blur();
    await changePage.confirmPasswordInput.fill('Str0ng#Pass!');
    await changePage.confirmPasswordInput.blur();

    await expect(page.locator('mat-error')).toHaveCount(0);
  });
});
