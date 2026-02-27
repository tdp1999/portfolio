import { test, expect } from './fixtures/monitor.fixture';
import { LoginPage } from './pages/login.page';
import { TEST_USERS } from './data/test-users';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // --- Happy paths ---

  test('valid credentials redirects to dashboard with user info visible', async ({
    page,
    context,
  }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password),
    ]);
    expect(response.status()).toBe(200);

    await page.waitForURL('/');

    await expect(page.getByText(TEST_USERS.standard.name)).toBeVisible();
    expect.soft(await page.getByText(TEST_USERS.standard.email).isVisible()).toBe(true);

    // Without rememberMe, refresh cookie should be a session cookie (no expiry)
    const cookies = await context.cookies('http://localhost:4300/api/auth/refresh');
    const refreshCookie = cookies.find((c) => c.name === 'refresh_token');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.expires).toBe(-1);
  });

  test('valid credentials with Remember Me sets persistent refresh cookie', async ({
    page,
    context,
  }) => {
    await loginPage.emailInput.fill(TEST_USERS.standard.email);
    await loginPage.passwordInput.fill(TEST_USERS.standard.password);
    await loginPage.rememberMeCheckbox.click();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.submitButton.click(),
    ]);
    expect(response.status()).toBe(200);

    await page.waitForURL('/');

    const cookies = await context.cookies('http://localhost:4300/api/auth/refresh');
    const refreshCookie = cookies.find((c) => c.name === 'refresh_token');

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie!.httpOnly).toBe(true);
    // rememberMe sets maxAge to 30 days
    expect(refreshCookie!.expires).toBeGreaterThan(Date.now() / 1000 + 86400);
  });

  test('session persists after page reload', async ({ page }) => {
    await loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password);
    await page.waitForURL('/');

    // Reload and wait for bootstrap to restore session
    const mePromise = page.waitForResponse((r) => r.url().includes('/api/auth/me'), {
      timeout: 10000,
    });
    await page.reload();
    const meResp = await mePromise;

    expect(meResp.status()).toBe(200);
    await expect(page).toHaveURL('/');
    await expect(page.getByText(TEST_USERS.standard.name)).toBeVisible();
  });

  // --- Unhappy paths ---

  test('wrong password shows error toast and stays on login page', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, 'WrongPassword1!'),
    ]);
    expect(response.status()).toBe(401);

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('non-existent email shows same generic error (no user enumeration)', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login('nobody@e2e.local', 'SomePass1!'),
    ]);
    // Must return same status as wrong-password to prevent enumeration
    expect(response.status()).toBe(401);

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('locked account shows lock banner with countdown', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.locked.email, TEST_USERS.locked.password),
    ]);
    expect(response.status()).toBe(401);

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);

    // Should show the lock banner with retry countdown
    await expect(page.getByText(/Account temporarily locked/)).toBeVisible();
    await expect(page.getByText(/Try again in \d+s/)).toBeVisible();

    // Submit button should be disabled while locked
    await expect(loginPage.submitButton).toBeDisabled();

    // Verify the response contains structured lock info
    const body = await response.json();
    expect(body.message.remainingAttempts).toBe(0);
    expect(body.message.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('wrong password shows remaining attempts warning', async ({ page }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, 'WrongPassword1!'),
    ]);
    expect(response.status()).toBe(401);

    const body = await response.json();
    // Standard user starts with 0 failed attempts, so after 1st failure: remainingAttempts = 4
    expect(body.message.remainingAttempts).toBeGreaterThan(0);

    await expect(page.getByText(/attempt\(s\) remaining/)).toBeVisible();
    // Submit button should remain enabled when attempts remain
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('429 rate limit shows only one toast (no duplicate)', async ({ page }) => {
    // Trigger a 429 by making rapid requests (throttle limit is 5/min on login)
    const loginResponses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/auth/login')),
        loginPage.login(TEST_USERS.standard.email, 'WrongPassword1!'),
      ]);
      loginResponses.push(response.status());
      if (response.status() === 429) break;
    }

    // At least the last request should be 429
    expect(loginResponses).toContain(429);

    // Should show the rate-limit toast
    await expect(page.getByText(/too many requests/i)).toBeVisible();

    // Count "Invalid email" toasts before and after a short wait
    // to ensure no extra toast was added by the 429 response
    const countBefore = await page.getByText('Invalid email or password').count();
    await page.waitForTimeout(500);
    const countAfter = await page.getByText('Invalid email or password').count();
    expect(countAfter).toBe(countBefore);
  });

  // --- Validation ---

  test('empty fields show form validation errors', async () => {
    await loginPage.submitButton.click();

    await expect(loginPage.page.getByText('Email is required.')).toBeVisible();
    await expect(loginPage.page.getByText('Password is required.')).toBeVisible();
  });

  test('invalid email format shows validation error', async () => {
    await loginPage.emailInput.fill('not-an-email');
    await loginPage.submitButton.click();

    await expect(loginPage.page.getByText('Enter a valid email address.')).toBeVisible();
  });
});
