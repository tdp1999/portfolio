import { test, expect } from './fixtures/auth.fixture';
import { TEST_EMAIL_DOMAIN } from './data/test-users';
import { AdminUsersPage } from './pages/admin-users.page';
import { SetPasswordPage } from './pages/set-password.page';
import { LoginPage } from './pages/login.page';
import { prisma, deleteTempUser } from './helpers/db';
import { createHash } from 'crypto';

const INVITED_USER = {
  name: 'E2E Invited User',
  email: `test-invited${TEST_EMAIL_DOMAIN}`,
  password: 'NewPass123!',
};

test.describe.serial('Invite & Set-Password Flow', () => {
  test.afterAll(async () => {
    await deleteTempUser(INVITED_USER.email);
  });

  test('admin can invite a user via the admin page dialog', async ({ adminPage: page }) => {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto();
    await expect(adminPage.table).toBeVisible();

    // Invite a new user
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/users') && r.request().method() === 'POST'),
      adminPage.inviteUser(INVITED_USER.name, INVITED_USER.email),
    ]);

    expect(response.status()).toBe(201);

    // Dialog should close and success toast should show
    await expect(page.getByText('User invited successfully')).toBeVisible();

    // User should appear in the list with "Invited" status
    await expect(page.locator('td', { hasText: INVITED_USER.email })).toBeVisible();
    const row = page.locator('tr', { hasText: INVITED_USER.email });
    await expect(row.locator('span', { hasText: 'Invited' })).toBeVisible();
  });

  test('invited user can set password via invite link', async ({ page }) => {
    // Get the invite token from the database
    const user = await prisma.user.findUnique({
      where: { email: INVITED_USER.email },
      select: { id: true, inviteToken: true },
    });

    expect(user).toBeTruthy();
    expect(user?.inviteToken).toBeTruthy();

    // The stored token is hashed — we need the raw token.
    // Since we can't reverse the hash, we read it from DB and construct the URL
    // using the raw token. But the raw token was sent via email which we can't access.
    // Instead, we'll generate a new token and set it directly in DB.
    const { randomBytes } = await import('crypto');
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    await prisma.user.update({
      where: { email: INVITED_USER.email },
      data: {
        inviteToken: hashedToken,
        inviteTokenExpiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      },
    });

    const setPasswordPage = new SetPasswordPage(page);
    await setPasswordPage.goto(rawToken, (user as { id: string }).id);

    // Should show the set password form, not error
    await expect(page.getByText('Set your password')).toBeVisible();
    await expect(setPasswordPage.errorHeading).not.toBeVisible();

    // Set the password
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/set-password')),
      setPasswordPage.setPassword(INVITED_USER.password, INVITED_USER.password),
    ]);

    expect(response.status()).toBe(200);

    // Should show success toast and redirect to login
    await expect(page.getByText('Password set successfully')).toBeVisible();
    await page.waitForURL(/\/auth\/login/);
  });

  test('user can log in with the set password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(INVITED_USER.email, INVITED_USER.password),
    ]);

    expect(response.status()).toBe(200);
    await page.waitForURL('/');
  });

  test('invalid token format shows error on set-password page', async ({ page }) => {
    const setPasswordPage = new SetPasswordPage(page);
    // Token with non-hex chars fails the regex validation
    const invalidToken = 'x'.repeat(64);
    const fakeUserId = '00000000-0000-4000-a000-000000000099';

    await setPasswordPage.goto(invalidToken, fakeUserId);

    await expect(setPasswordPage.errorHeading).toBeVisible();
    await expect(setPasswordPage.backToLoginLink).toBeVisible();
  });

  test('valid-looking but wrong token shows error after submit', async ({ page, consoleErrors }) => {
    const setPasswordPage = new SetPasswordPage(page);
    // Valid hex format but doesn't match any invite
    const fakeToken = 'ab'.repeat(32);
    const fakeUserId = '00000000-0000-4000-a000-000000000099';

    await setPasswordPage.goto(fakeToken, fakeUserId);

    // Form should show (token passes regex)
    await expect(page.getByText('Set your password')).toBeVisible();

    // Submit with a valid password — API should reject
    await setPasswordPage.setPassword('NewPass123!', 'NewPass123!');

    // Should show the error
    await expect(setPasswordPage.errorHeading).toBeVisible();

    consoleErrors.length = 0;
  });

  test('missing token shows error on set-password page', async ({ page }) => {
    await page.goto('/auth/set-password');

    await expect(page.getByText('Invalid invite link')).toBeVisible();
  });
});
