import { test, expect } from './fixtures/auth.fixture';
import { TEST_EMAIL_DOMAIN } from './data/test-users';
import { AdminUsersPage } from './pages/admin-users.page';
import { LoginPage } from './pages/login.page';
import { createTempUser, deleteTempUser } from './helpers/db';

const VICTIM_SUFFIX = 'delete-victim';
const VICTIM_EMAIL = `test-${VICTIM_SUFFIX}${TEST_EMAIL_DOMAIN}`;
const VICTIM_PASSWORD = 'TestPass1!';

test.describe.serial('Soft-Delete Flow', () => {
  test.beforeAll(async () => {
    await createTempUser(VICTIM_SUFFIX, VICTIM_PASSWORD);
  });

  test.afterAll(async () => {
    await deleteTempUser(VICTIM_EMAIL);
  });

  test('confirmation dialog appears and can be cancelled', async ({ adminPage: page }) => {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto();
    await expect(adminPage.table).toBeVisible();

    // Verify user is in the list
    await expect(page.locator('td', { hasText: VICTIM_EMAIL })).toBeVisible();

    const deleteBtn = await adminPage.getDeleteButton(VICTIM_EMAIL);
    await deleteBtn.click();

    // Confirmation dialog should appear
    await expect(page.locator('h2[mat-dialog-title]', { hasText: 'Delete User' })).toBeVisible();
    await expect(page.locator('mat-dialog-content', { hasText: /are you sure/i })).toBeVisible();

    // Cancel the dialog
    await page.locator('mat-dialog-actions button', { hasText: 'Cancel' }).click();

    // Dialog should close, user should still be in list without "Deleted" status
    const row = page.locator('tr', { hasText: VICTIM_EMAIL });
    await expect(row).toBeVisible();
    await expect(row.locator('span', { hasText: 'Deleted' })).not.toBeVisible();
  });

  test('admin confirms delete — user shown as Deleted', async ({ adminPage: page }) => {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto();
    await expect(adminPage.table).toBeVisible();

    // Delete the user
    await adminPage.deleteUser(VICTIM_EMAIL);

    // Success toast — wait for the API response first
    await page.waitForResponse((r) => r.url().includes('/api/users/') && r.request().method() === 'DELETE');

    // User row should show "Deleted" status with visual distinction
    const row = page.locator('tr', { hasText: VICTIM_EMAIL });
    await expect(row.locator('span', { hasText: 'Deleted' })).toBeVisible();
    await expect(row.locator('.opacity-50').first()).toBeVisible();
  });

  test('soft-deleted user cannot log in', async ({ page, consoleErrors }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login')),
      loginPage.login(VICTIM_EMAIL, VICTIM_PASSWORD),
    ]);

    expect(response.status()).toBe(401);

    // Should show deactivated error message (from error dictionary)
    await expect(page.getByText(/account has been deactivated/i)).toBeVisible();

    // Stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);

    consoleErrors.length = 0;
  });
});
