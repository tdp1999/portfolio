import { test, expect } from './fixtures/monitor.fixture';
import { TEST_USERS } from './data/test-users';
import { LoginPage } from './pages/login.page';

const MOCK_GOOGLE_USER = {
  id: TEST_USERS.googleOnly.id,
  email: TEST_USERS.googleOnly.email,
  name: TEST_USERS.googleOnly.name,
  hasPassword: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

/**
 * Mocks the /api/auth/me endpoint and navigates to the callback with a fake token.
 * This simulates the Google OAuth redirect without needing a real JWT.
 */
async function mockGoogleLogin(
  page: import('@playwright/test').Page,
  options: { meStatus?: number; meBody?: unknown } = {}
) {
  const { meStatus = 200, meBody = MOCK_GOOGLE_USER } = options;

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: meStatus,
      contentType: 'application/json',
      body: JSON.stringify(meBody),
    })
  );

  await page.goto('/auth/callback#token=mock-google-token');
}

test.describe('Google OAuth', () => {
  test('successful callback redirects to dashboard with user info visible', async ({ page }) => {
    await mockGoogleLogin(page);

    await page.waitForURL('/');
    await expect(page.getByText(MOCK_GOOGLE_USER.name)).toBeVisible();
    await expect(page.getByText(MOCK_GOOGLE_USER.email)).toBeVisible();
  });

  test('callback without token shows error and redirects to login', async ({ page, consoleErrors }) => {
    await page.goto('/auth/callback');

    await expect(page.getByText(/no token received/i)).toBeVisible();
    await page.waitForURL(/\/auth\/login/);

    // The error toast triggers a console error — filter it out
    consoleErrors.length = 0;
  });

  test('callback with invalid token (me returns 401) shows error and redirects to login', async ({
    page,
    consoleErrors,
  }) => {
    await mockGoogleLogin(page, {
      meStatus: 401,
      meBody: { message: 'Unauthorized' },
    });

    await expect(page.getByText(/could not load user/i)).toBeVisible();
    await page.waitForURL(/\/auth\/login/);

    consoleErrors.length = 0;
  });

  test('Google-only user does not see Change Password in sidebar', async ({ page }) => {
    await mockGoogleLogin(page);
    await page.waitForURL('/');

    // Open Settings submenu in sidebar
    await page.locator('button[ui-sidebar-menu-button]', { hasText: 'Settings' }).click();

    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Change Password')).not.toBeVisible();
  });

  test('password user sees Change Password in sidebar', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    await page.waitForURL('/');

    // Open Settings submenu in sidebar
    await page.locator('button[ui-sidebar-menu-button]', { hasText: 'Settings' }).click();

    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Change Password')).toBeVisible();
  });
});
