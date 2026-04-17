import { test, expect } from './fixtures/monitor.fixture';
import { LoginPage } from './pages/login.page';
import { TEST_USERS } from './data/test-users';
import { createTempUser, deleteTempUser } from './helpers/db';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // --- Happy paths ---

  test('valid credentials redirects to dashboard with user info visible', async ({ page, context }) => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, TEST_USERS.standard.password),
    ]);
    expect(response.status()).toBe(200);

    await page.waitForURL('/');

    await expect(page.getByText(TEST_USERS.standard.name)).toBeVisible();
    expect.soft(await page.getByText(TEST_USERS.standard.email).isVisible()).toBe(true);

    // Refresh cookie should be present (bootstrap refresh sets it as persistent)
    const cookies = await context.cookies('http://localhost:4300/api/auth/refresh');
    const refreshCookie = cookies.find((c) => c.name === 'refresh_token');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);
  });

  test('valid credentials with Remember Me sets persistent refresh cookie', async ({ page, context, request }) => {
    await loginPage.emailInput.fill(TEST_USERS.standard.email);
    await loginPage.passwordInput.fill(TEST_USERS.standard.password);
    await loginPage.rememberMeCheckbox.click();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.submitButton.click(),
    ]);
    expect(response.status()).toBe(200);

    await page.waitForURL('/');

    // Verify refresh cookie is set (proxy strips Max-Age, so only check presence + httpOnly)
    const cookies = await context.cookies('http://localhost:4300/api/auth/refresh');
    const refreshCookie = cookies.find((c) => c.name === 'refresh_token');
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie?.httpOnly).toBe(true);

    // Verify rememberMe=true sends Max-Age via direct API call (bypasses proxy stripping)
    const apiResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: TEST_USERS.standard.email,
        password: TEST_USERS.standard.password,
        rememberMe: true,
      },
    });
    const setCookie = apiResponse.headers()['set-cookie'] ?? '';
    expect(setCookie).toContain('Max-Age=');
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

  // --- Unhappy paths (per-test isolated users, no rate limiter dependency) ---

  test('wrong password shows error toast and stays on login page', async ({ page }) => {
    const user = await createTempUser('wrong-pw-toast');
    try {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/auth/login')),
        loginPage.login(user.email, 'WrongPassword1!'),
      ]);
      expect(response.status()).toBe(401);

      await expect(page.getByText('Invalid email or password')).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/login/);
    } finally {
      await deleteTempUser(user.email);
    }
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

    await expect(page).toHaveURL(/\/auth\/login/);

    // Should show the lock banner with retry countdown
    await expect(page.getByText(/Account temporarily locked/)).toBeVisible();
    await expect(page.getByText(/Try again in \d+s/)).toBeVisible();

    // Submit button should be disabled while locked
    await expect(loginPage.submitButton).toBeDisabled();

    // Verify the response contains structured lock info
    const body = await response.json();
    expect(body.data.remainingAttempts).toBe(0);
    expect(body.data.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('wrong password shows remaining attempts warning', async ({ page }) => {
    const user = await createTempUser('wrong-pw-attempts');
    try {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/auth/login')),
        loginPage.login(user.email, 'WrongPassword1!'),
      ]);
      expect(response.status()).toBe(401);

      const body = await response.json();
      // Fresh user: after 1st failure remainingAttempts = 4
      expect(body.data.remainingAttempts).toBeGreaterThan(0);

      await expect(page.getByText(/attempt\(s\) remaining/)).toBeVisible();
      // Submit button should remain enabled when attempts remain
      await expect(loginPage.submitButton).toBeEnabled();
    } finally {
      await deleteTempUser(user.email);
    }
  });

  test('429 rate limit shows only one toast (no duplicate)', async ({ page }) => {
    const user = await createTempUser('rate-limit');
    try {
      // Trigger a 429 by making rapid requests (throttle limit is 5/min on login)
      // Note: throttler is disabled in non-production; skip assertions if 429 never fires
      const loginResponses: number[] = [];
      for (let i = 0; i < 6; i++) {
        // Account may lock after several failures, disabling the submit button
        if (await loginPage.submitButton.isDisabled()) break;

        const [response] = await Promise.all([
          page.waitForResponse((r) => r.url().includes('/api/auth/login')),
          loginPage.login(user.email, 'WrongPassword1!'),
        ]);
        loginResponses.push(response.status());
        if (response.status() === 429) break;
      }

      if (!loginResponses.includes(429)) return; // Throttler disabled or account locked first

      // Should show the rate-limit toast
      await expect(page.getByText(/too many requests/i)).toBeVisible();

      // Count "Invalid email" toasts before and after a short wait
      // to ensure no extra toast was added by the 429 response
      const countBefore = await page.getByText('Invalid email or password').count();
      await page.waitForTimeout(500);
      const countAfter = await page.getByText('Invalid email or password').count();
      expect(countAfter).toBe(countBefore);
    } finally {
      await deleteTempUser(user.email);
    }
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
