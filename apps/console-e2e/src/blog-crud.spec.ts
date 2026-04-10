import { test, expect } from './fixtures/auth.fixture';
import { expectToast } from './helpers/toast';
import { clickConfirm } from './helpers/dialog';
import axios from 'axios';

const API = 'http://localhost:3000';
const PREFIX = 'e2e-console-blog-';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function validPayload(title: string) {
  return {
    title,
    content: 'Blog post content for console E2E testing. '.repeat(5),
    language: 'EN',
  };
}

test.describe('Blog Posts CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;

  test.beforeAll(async () => {
    const res = await axios.post(`${API}/api/auth/login`, {
      email: 'test-admin@e2e.local',
      password: 'TestPass1!',
      rememberMe: false,
    });
    adminToken = res.data.accessToken;

    // Cleanup leftover test posts
    const list = await axios.get(`${API}/api/admin/blog`, {
      headers: authHeaders(adminToken),
      params: { includeDeleted: true },
    });
    const testPosts = list.data.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
    for (const p of testPosts) {
      if (p.deletedAt) {
        await axios.post(
          `${API}/api/admin/blog/${p.id}/restore`,
          {},
          {
            headers: authHeaders(adminToken),
          }
        );
      }
      await axios.delete(`${API}/api/admin/blog/${p.id}`, {
        headers: authHeaders(adminToken),
      });
    }
  });

  test('navigate to Blog Posts page → list visible', async ({ adminPage: page }) => {
    await page.goto('/admin/blog');
    await page.waitForURL('**/admin/blog');

    await expect(page.getByRole('heading', { name: 'Blog Posts', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Post' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
  });

  test('create post via API → appears in list', async ({ adminPage: page }) => {
    await axios.post(`${API}/api/admin/blog`, validPayload(`${PREFIX}crud-test`), {
      headers: authHeaders(adminToken),
    });

    await page.goto('/admin/blog');
    await expect(
      page
        .getByRole('table')
        .getByRole('row')
        .filter({ hasText: `${PREFIX}crud-test` })
    ).toBeVisible({ timeout: 5000 });
  });

  test('post shows DRAFT status', async ({ adminPage: page }) => {
    await page.goto('/admin/blog');
    const row = page
      .getByRole('table')
      .getByRole('row')
      .filter({ hasText: `${PREFIX}crud-test` });
    await expect(row.getByText('DRAFT')).toBeVisible();
  });

  test('delete post → moved to trash', async ({ adminPage: page }) => {
    await page.goto('/admin/blog');

    const row = page
      .getByRole('table')
      .getByRole('row')
      .filter({ hasText: `${PREFIX}crud-test` });
    await row.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    await clickConfirm(page);
    await expectToast(page, 'Post deleted');

    // Should disappear from All tab
    await expect(row).toBeHidden({ timeout: 5000 });

    // Should appear in Trash tab
    await page.getByRole('tab', { name: 'Trash' }).click();
    await expect(
      page
        .getByRole('table')
        .getByRole('row')
        .filter({ hasText: `${PREFIX}crud-test` })
    ).toBeVisible({ timeout: 5000 });
  });

  test('restore from trash → back in list', async ({ adminPage: page }) => {
    await page.goto('/admin/blog');

    await page.getByRole('tab', { name: 'Trash' }).click();
    const row = page
      .getByRole('table')
      .getByRole('row')
      .filter({ hasText: `${PREFIX}crud-test` });
    await expect(row).toBeVisible({ timeout: 5000 });

    await row.getByRole('button', { name: 'Restore' }).click();
    await expectToast(page, 'Post restored');

    await page.getByRole('tab', { name: 'All' }).click();
    await expect(
      page
        .getByRole('table')
        .getByRole('row')
        .filter({ hasText: `${PREFIX}crud-test` })
    ).toBeVisible({ timeout: 5000 });
  });
});
