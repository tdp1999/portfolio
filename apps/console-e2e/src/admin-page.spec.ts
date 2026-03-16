import { test, expect } from './fixtures/auth.fixture';
import { TEST_USERS } from './data/test-users';
import { AdminUsersPage } from './pages/admin-users.page';

test.describe('Admin Page — admin user', () => {
  test.describe.configure({ mode: 'serial' });

  test('can access /admin/users and see user list', async ({ adminPage: page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.goto();

    await expect(adminUsersPage.heading).toBeVisible();
    await expect(adminUsersPage.table).toBeVisible();
    await expect(adminUsersPage.inviteButton).toBeVisible();
    await expect(adminUsersPage.paginator).toBeVisible();
  });

  test('sees Users link in sidebar', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    const usersLink = page.locator('a[href="/admin/users"]', { hasText: 'Users' });
    await expect(usersLink).toBeVisible();
  });

  test('user list displays with pagination', async ({ adminPage: page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.goto();

    await expect(adminUsersPage.table).toBeVisible();
    await expect(page.locator('td', { hasText: TEST_USERS.admin.email })).toBeVisible();
    await expect(adminUsersPage.paginator).toBeVisible();
  });

  test('search filters users by name', async ({ adminPage: page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.goto();
    await expect(adminUsersPage.table).toBeVisible();

    await adminUsersPage.search(TEST_USERS.admin.name);

    await page.waitForResponse((r) => r.url().includes('/api/users') && r.status() === 200);

    await expect(page.locator('td', { hasText: TEST_USERS.admin.email })).toBeVisible();
  });

  test('search filters users by email', async ({ adminPage: page }) => {
    const adminUsersPage = new AdminUsersPage(page);
    await adminUsersPage.goto();
    await expect(adminUsersPage.table).toBeVisible();

    await adminUsersPage.search(TEST_USERS.standard.email);

    await page.waitForResponse((r) => r.url().includes('/api/users') && r.status() === 200);

    await expect(page.locator('td', { hasText: TEST_USERS.standard.email })).toBeVisible();
  });
});

test.describe('Admin Page — non-admin user', () => {
  test('is redirected away from /admin/users', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    await page.goto('/admin/users');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('does not see Users link in sidebar', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    const usersLink = page.locator('a[href="/admin/users"]', { hasText: 'Users' });
    await expect(usersLink).not.toBeVisible();
  });
});
