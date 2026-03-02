import { test, expect, loginViaApi } from './fixtures/auth.fixture';
import { TEST_USERS } from './data/test-users';
import { LoginPage } from './pages/login.page';

test.describe('Auth Session', () => {
  test('expired/cleared session redirects to login on page load', async ({ page }) => {
    await loginViaApi(page, TEST_USERS.standard.email, TEST_USERS.standard.password);

    // Simulate expired session by removing the refresh token cookie
    await page.context().clearCookies();

    // Reload — bootstrap refresh will fail → guard redirects to login
    await page.goto('/');
    await page.waitForURL(/\/auth\/login/);
  });

  test('expired session on protected route preserves returnUrl', async ({ page }) => {
    await loginViaApi(page, TEST_USERS.standard.email, TEST_USERS.standard.password);

    // Simulate expired session
    await page.context().clearCookies();

    await page.goto('/settings/change-password');
    await page.waitForURL(/\/auth\/login/);

    const url = new URL(page.url());
    expect(url.searchParams.get('returnUrl')).toBe('/settings/change-password');
  });

  test('returnUrl preserved through full login flow after session expiry', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginViaApi(page, TEST_USERS.standard.email, TEST_USERS.standard.password);

    // Simulate expired session
    await page.context().clearCookies();

    // Navigate to a protected deep link
    await page.goto('/settings/change-password');
    await page.waitForURL(/\/auth\/login/);

    // Log in via UI
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password),
    ]);

    // Should land back on the originally requested page
    await page.waitForURL('/settings/change-password');
  });

  test('active session persists across page reloads', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    // Reload and wait for bootstrap to restore the session
    const mePromise = page.waitForResponse((r) => r.url().includes('/api/auth/me'), { timeout: 10000 });
    await page.reload();
    const meResp = await mePromise;

    expect(meResp.status()).toBe(200);
    await page.waitForURL('/');
    await expect(page.getByText(TEST_USERS.standard.name)).toBeVisible();
  });
});
