import { test, expect } from './fixtures/auth.fixture';
import { loginViaApi } from './fixtures/auth.fixture';
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

async function getAccessToken(page: import('@playwright/test').Page, email: string, password: string): Promise<string> {
  const res = await page.request.post('/api/auth/login', {
    data: { email, password, rememberMe: false },
  });
  const body = await res.json();
  return body.accessToken;
}

test.describe('API Auth Guards', () => {
  test('unauthenticated request to /api/users returns 401', async ({ page }) => {
    const response = await page.request.get('/api/users', {
      headers: { Authorization: '' },
    });
    expect(response.status()).toBe(401);
  });

  test('non-admin user cannot access admin-only endpoints (403)', async ({ page }) => {
    const token = await getAccessToken(page, TEST_USERS.standard.email, TEST_USERS.standard.password);
    const response = await page.request.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(403);
  });

  test('regular user can access own profile', async ({ page }) => {
    const token = await getAccessToken(page, TEST_USERS.standard.email, TEST_USERS.standard.password);
    const response = await page.request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.email).toBe(TEST_USERS.standard.email);
  });

  test('non-admin cannot invite users (403)', async ({ page }) => {
    const token = await getAccessToken(page, TEST_USERS.standard.email, TEST_USERS.standard.password);
    const response = await page.request.post('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'Hacker', email: 'hack@e2e.local' },
    });
    expect(response.status()).toBe(403);
  });

  test('non-admin cannot delete users (403)', async ({ page }) => {
    const token = await getAccessToken(page, TEST_USERS.standard.email, TEST_USERS.standard.password);
    const response = await page.request.delete(`/api/users/${TEST_USERS.admin.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(403);
  });
});
