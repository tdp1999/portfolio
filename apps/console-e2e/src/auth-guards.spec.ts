import { test, expect } from './fixtures/auth.fixture';
import { TEST_USERS } from './data/test-users';
import { LoginPage } from './pages/login.page';

test.describe('Auth Guards', () => {
  test('unauthenticated user visiting / is redirected to /auth/login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/');
    await page.waitForURL(/\/auth\/login/);
  });

  test('unauthenticated user visiting /settings is redirected to /auth/login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/settings');
    await page.waitForURL(/\/auth\/login/);
  });

  test('authenticated user visiting /auth/login is redirected to /', async ({ authenticatedPage: page }) => {
    // Bootstrap the session by loading the app first
    await page.goto('/');
    await page.waitForURL('/');
    // guestGuard: authenticated user navigating to login should redirect to dashboard
    await page.goto('/auth/login');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('deep link: protected URL preserved as returnUrl after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.context().clearCookies();

    // Navigate to protected route while logged out
    await page.goto('/settings/change-password');
    await page.waitForURL(/\/auth\/login/);

    // Log in via UI
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password),
    ]);

    // Should land on the original deep-linked page
    await page.waitForURL('/settings/change-password');
  });

  test('returnUrl is preserved in query param when redirected to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/settings/change-password');
    await page.waitForURL(/\/auth\/login/);

    const url = new URL(page.url());
    expect(url.searchParams.get('returnUrl')).toBe('/settings/change-password');
  });
});
