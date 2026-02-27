import { createHash, randomBytes } from 'crypto';
import { hashPassword } from '@portfolio/shared/utils';
import { test as monitorTest, expect as monitorExpect } from './fixtures/monitor.fixture';
import { test as authTest, expect as authExpect } from './fixtures/auth.fixture';
import { ForgotPasswordPage } from './pages/forgot-password.page';
import { ResetPasswordPage } from './pages/reset-password.page';
import { ChangePasswordPage } from './pages/change-password.page';
import { LoginPage } from './pages/login.page';
import { TEST_USERS } from './data/test-users';
import { prisma } from './helpers/db';

// ---------------------------------------------------------------------------
// Forgot Password (unauthenticated)
// ---------------------------------------------------------------------------
monitorTest.describe('Forgot Password', () => {
  let forgotPage: ForgotPasswordPage;

  monitorTest.beforeEach(async ({ page }) => {
    forgotPage = new ForgotPasswordPage(page);
    await forgotPage.goto();
  });

  monitorTest('valid email shows success message', async ({ page }) => {
    await forgotPage.requestReset(TEST_USERS.standard.email);
    await monitorExpect(forgotPage.successHeading).toBeVisible();
  });

  monitorTest('non-existent email shows same success message (no enumeration)', async () => {
    await forgotPage.requestReset('nobody@e2e.local');
    await monitorExpect(forgotPage.successHeading).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Reset Password (unauthenticated, seeded token via DB)
// ---------------------------------------------------------------------------
monitorTest.describe('Reset Password', () => {
  const rawToken = randomBytes(32).toString('hex');
  const hashedToken = createHash('sha256').update(rawToken).digest('hex');

  monitorTest.beforeEach(async () => {
    // Seed a valid reset token for the standard user
    await prisma.user.update({
      where: { id: TEST_USERS.standard.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  });

  monitorTest.afterEach(async () => {
    // Reset user password back to original and clear token
    const originalHash = await hashPassword(TEST_USERS.standard.password);
    await prisma.user.update({
      where: { id: TEST_USERS.standard.id },
      data: {
        password: originalHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        tokenVersion: 0,
      },
    });
  });

  monitorTest('valid token resets password and redirects to login', async ({ page }) => {
    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto(rawToken, TEST_USERS.standard.id);

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/reset-password')),
      resetPage.resetPassword('NewSecure1!', 'NewSecure1!'),
    ]);
    monitorExpect(response.status()).toBe(200);

    await page.waitForURL(/\/auth\/login/);
    await monitorExpect(page.getByText('Password reset successfully')).toBeVisible();
  });

  monitorTest('invalid token shows error heading', async ({ page }) => {
    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto('invalid-token', TEST_USERS.standard.id);

    // Missing/invalid params → tokenError shown immediately
    await monitorExpect(resetPage.errorHeading).toBeVisible();
  });

  monitorTest('expired token shows error toast on submit', async ({ page }) => {
    // Set token to already expired
    await prisma.user.update({
      where: { id: TEST_USERS.standard.id },
      data: {
        passwordResetExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto(rawToken, TEST_USERS.standard.id);

    await resetPage.resetPassword('NewSecure1!', 'NewSecure1!');

    await monitorExpect(page.getByText('Reset link is invalid or expired')).toBeVisible();
  });

  monitorTest('mismatched passwords shows validation error', async ({ page }) => {
    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto(rawToken, TEST_USERS.standard.id);

    await resetPage.resetPassword('NewSecure1!', 'Different1!');

    await monitorExpect(page.getByText('Passwords do not match')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Change Password (authenticated)
// ---------------------------------------------------------------------------
authTest.describe('Change Password', () => {
  authTest.afterEach(async () => {
    // Reset password back to original
    const originalHash = await hashPassword(TEST_USERS.standard.password);
    await prisma.user.update({
      where: { id: TEST_USERS.standard.id },
      data: {
        password: originalHash,
        tokenVersion: 0,
      },
    });
  });

  authTest('correct current password changes password successfully', async ({ authenticatedPage: page }) => {
    const changePage = new ChangePasswordPage(page);
    await changePage.goto();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/change-password')),
      changePage.changePassword(TEST_USERS.standard.password, 'NewSecure1!'),
    ]);
    authExpect(response.status()).toBe(200);

    await authExpect(page.getByText('Password changed successfully')).toBeVisible();
    await page.waitForURL('/');

    // Verify new password works by logging in again
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    const [loginResp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(TEST_USERS.standard.email, 'NewSecure1!'),
    ]);
    authExpect(loginResp.status()).toBe(200);
  });

  authTest('wrong current password shows error toast', async ({ authenticatedPage: page }) => {
    const changePage = new ChangePasswordPage(page);
    await changePage.goto();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/change-password')),
      changePage.changePassword('WrongPassword1!', 'NewSecure1!'),
    ]);
    authExpect(response.status()).toBe(400);

    await authExpect(page.getByText('Current password is incorrect')).toBeVisible();
  });
});
