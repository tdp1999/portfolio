import { test, expect } from './fixtures/monitor.fixture';
import { TEST_USERS } from './data/test-users';
import { LoginPage } from './pages/login.page';
import { ConsoleShell } from './pages/console-shell.page';

const MOCK_GOOGLE_USER = {
  id: TEST_USERS.googleOnly.id,
  email: TEST_USERS.googleOnly.email,
  name: TEST_USERS.googleOnly.name,
  hasPassword: false,
  // ADMIN so the sidebar renders: `main-layout.html` wraps every nav group in `@if (isAdmin())`.
  // What the tests here actually assert is `hasPassword: false` — a Google-only account has no
  // password, so no "Change Password" entry.
  role: 'ADMIN',
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

  // Everything the shell calls on load has to be stubbed, not just `me`.
  //
  // `mock-google-token` is not a real JWT, so any un-stubbed call is rejected, and one rejection is
  // enough to destroy the page. Traced live, the chain was:
  //
  //   401 GET  /api/contact-messages/unread-count   (sidebar badge, fake token)
  //   403 POST /api/auth/refresh                    (refresh interceptor reacting to that 401)
  //
  // and `error-handler.provider.ts` treats 403 as blocking, so it closes every dialog and routes to
  // `/error/403`. The tests were asserting against a full-page "Access Denied" — which is also why
  // the first reading of this failure ("non-admins are locked out of the console") was wrong.
  // Stubbing the badge removes the trigger; stubbing refresh keeps any later 401 from re-arming it.
  await page.route('**/api/contact-messages/unread-count', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unreadCount: 0 }) })
  );
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'mock-google-token' }),
    })
  );
  await page.route('**/api/dashboard/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ totalPosts: 0, mediaFiles: 0, published: 0, drafts: 0 }),
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

  /**
   * "Change Password" left the sidebar. There is no "Settings" group any more — the link lives
   * in the `mat-menu` on the footer user button and is rendered only `@if (hasPassword())`.
   * "Profile" is a separate, always-present sidebar link, so it is asserted separately rather
   * than as a sibling of Change Password.
   */
  test('Google-only user does not see Change Password in the user menu', async ({ page }) => {
    await mockGoogleLogin(page);
    await page.waitForURL('/');

    const shell = new ConsoleShell(page);
    // The footer user button, not a sidebar link. `main-layout.html` wraps *every* sidebar group
    // in `@if (isAdmin())`, and `MOCK_GOOGLE_USER` carries no role — so a Google-only user sees no
    // nav entries at all, Profile included. The footer menu is ungated, and it is what is under
    // test here anyway.
    await expect(shell.userMenuTrigger).toBeVisible();

    await shell.openUserMenu();

    await expect(shell.logoutItem).toBeVisible();
    await expect(shell.changePasswordItem).toHaveCount(0);
  });

  test('Google login with unknown email shows invite-only error', async ({ page, consoleErrors }) => {
    // Simulate the backend redirecting to /auth/login?error=AUTH_INVITE_ONLY
    // This is what happens when Google OAuth callback returns a 403 for unknown email
    await page.goto('/auth/login?error=AUTH_INVITE_ONLY');

    await expect(page.getByText(/invite-only/i)).toBeVisible();

    // URL should be cleaned up (error param removed)
    await expect(page).toHaveURL(/\/auth\/login$/);

    consoleErrors.length = 0;
  });

  test('password user sees Change Password in the user menu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    await page.waitForURL('/');

    const shell = new ConsoleShell(page);
    await shell.openUserMenu();

    await expect(shell.changePasswordItem).toBeVisible();
    await expect(shell.changePasswordItem).toHaveAttribute('href', '/settings/change-password');
  });
});
