import { test, expect } from './fixtures/monitor.fixture';
import { LoginPage } from './pages/login.page';
import { TEST_USERS } from './data/test-users';
import { createTempUser, deleteTempUser } from './helpers/db';

test.describe('Auth Loading & Toast UI', () => {
  // --- Bootstrap spinner ---

  test('full-page spinner is visible while auth bootstrap is in-flight', async ({ page }) => {
    let resolveRefresh!: () => void;
    const refreshPending = new Promise<void>((res) => (resolveRefresh = res));

    // Intercept refresh to hold the response until we assert
    await page.route('**/api/auth/refresh', async (route) => {
      await refreshPending;
      await route.continue();
    });

    // Navigate with a session cookie present (standard user must be logged in first)
    // Use a pre-seeded refresh cookie by setting it directly
    await page.context().addCookies([
      {
        name: 'csrf_token',
        value: 'fake-csrf-for-spinner-test',
        domain: 'localhost',
        path: '/',
      },
    ]);

    const navPromise = page.goto('/');

    const spinner = page.locator('console-full-page-spinner .fixed');

    // Spinner should be visible while refresh is pending
    await expect(spinner).toBeVisible();

    // Let refresh through (it will 401 because the cookie is fake — that's fine)
    resolveRefresh();
    await navPromise;

    // After bootstrap completes, spinner should be gone
    await expect(spinner).not.toBeVisible();
  });

  // --- Login success toast ---

  test('successful login shows success toast then dismisses', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    await page.waitForURL('/');

    const toast = page.getByText('Signed in successfully');
    await expect(toast).toBeVisible();

    // Toast auto-dismisses (default duration is short)
    await expect(toast).not.toBeVisible({ timeout: 10_000 });
  });

  // --- Login failure toast ---

  test('failed login shows error toast then dismisses', async ({ page }) => {
    const user = await createTempUser('loading-fail-toast');
    const loginPage = new LoginPage(page);

    try {
      await loginPage.goto();
      await loginPage.login(user.email, 'WrongPassword1!');

      const toast = page.getByText('Invalid email or password');
      await expect(toast).toBeVisible();

      // Toast auto-dismisses
      await expect(toast).not.toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteTempUser(user.email);
    }
  });
});
