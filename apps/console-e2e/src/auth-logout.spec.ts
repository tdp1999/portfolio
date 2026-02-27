import { test, expect, loginViaApi } from './fixtures/auth.fixture';
import { TEST_USERS } from './data/test-users';

test.describe.configure({ mode: 'serial' });
test.describe('Logout', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForURL('/');
    // Wait for bootstrap to complete and user info to render
    await expect(authenticatedPage.getByText(TEST_USERS.standard.name)).toBeVisible();
  });

  test('logout redirects to login and clears refresh cookie', async ({ authenticatedPage: page, context }) => {
    // Open user menu and click Logout
    await page.getByText(TEST_USERS.standard.name).click();
    const [logoutResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/logout')),
      page.getByRole('menuitem', { name: 'Logout', exact: true }).click(),
    ]);
    expect(logoutResponse.status()).toBe(200);

    // Wait for redirect to login
    await page.waitForURL(/\/auth\/login/);
    await expect(page.getByText('Logged out successfully')).toBeVisible();

    // Refresh cookie should be cleared
    const cookies = await context.cookies('http://localhost:4300/api/auth/refresh');
    const refreshCookie = cookies.find((c) => c.name === 'refresh_token');
    expect(refreshCookie).toBeUndefined();

    // Dashboard should be inaccessible — navigating back redirects to login
    await page.goto('/');
    await page.waitForURL(/\/auth\/login/);
  });

  test('logout-all invalidates other sessions', async ({ authenticatedPage: page, browser }) => {
    // Create a second session in a separate browser context
    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await loginViaApi(secondPage, TEST_USERS.standard.email, TEST_USERS.standard.password);
    await secondPage.goto('/');
    await secondPage.waitForURL('/');
    // Verify second session is alive
    await expect(secondPage.getByText(TEST_USERS.standard.name)).toBeVisible();

    // Logout all from the first session
    await page.getByText(TEST_USERS.standard.name).click();
    await page.getByRole('menuitem', { name: 'Logout All Devices' }).click();

    await page.waitForURL(/\/auth\/login/);
    await expect(page.getByText('Logged out from all devices')).toBeVisible();

    // Second session should be invalidated — API call fails, redirects to login on reload
    const meResponse = await secondPage.request.get('/api/auth/me');
    expect(meResponse.status()).not.toBe(200);

    // Reload second page — bootstrap should fail and redirect to login
    await secondPage.reload();
    await secondPage.waitForURL(/\/auth\/login/, { timeout: 10000 });

    await secondContext.close();
  });
});
