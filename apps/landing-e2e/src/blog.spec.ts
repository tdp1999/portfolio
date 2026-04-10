import { test, expect } from '@playwright/test';
import axios from 'axios';

const API = 'http://localhost:3000';
const PREFIX = 'e2e-landing-blog-';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function validPayload(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title,
    content: `This is the content of ${title}. `.repeat(20),
    excerpt: `Excerpt for ${title}`,
    language: 'EN',
    ...overrides,
  };
}

test.describe('Landing - Blog', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let postSlug: string;

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

    // Create and publish a post
    const createRes = await axios.post(
      `${API}/api/admin/blog`,
      validPayload(`${PREFIX}showcase`, { status: 'PUBLISHED' }),
      { headers: authHeaders(adminToken) }
    );
    const postId = createRes.data.id;

    // Get slug
    const detail = await axios.get(`${API}/api/admin/blog/${postId}`, {
      headers: authHeaders(adminToken),
    });
    postSlug = detail.data.slug;
  });

  // ── List page ─────────────────────────────────────────

  test('/blog page renders with posts', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForURL('**/blog');

    await expect(page.getByRole('heading', { name: 'Blog', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${PREFIX}showcase` })).toBeVisible();
  });

  test('post row shows excerpt and read time', async ({ page }) => {
    await page.goto('/blog');

    const row = page.locator('a').filter({ hasText: `${PREFIX}showcase` });
    await expect(row).toBeVisible();
    await expect(row.getByText(`Excerpt for ${PREFIX}showcase`)).toBeVisible();
    // Read time should be visible (content is ~100 words = 1 min)
    await expect(row.getByText('min read')).toBeVisible();
  });

  test('click post → navigates to detail page', async ({ page }) => {
    await page.goto('/blog');

    await page
      .locator('a')
      .filter({ hasText: `${PREFIX}showcase` })
      .click();
    await page.waitForURL(`**/blog/${postSlug}`);

    await expect(page.getByRole('heading', { name: `${PREFIX}showcase`, level: 1 })).toBeVisible();
  });

  // ── Detail page ───────────────────────────────────────

  test('detail page renders title and content', async ({ page }) => {
    await page.goto(`/blog/${postSlug}`);

    await expect(page.getByRole('heading', { name: `${PREFIX}showcase` })).toBeVisible();
    // Content should be rendered
    await expect(page.getByText(`This is the content of ${PREFIX}showcase`)).toBeVisible();
  });

  test('detail page shows author card', async ({ page }) => {
    await page.goto(`/blog/${postSlug}`);

    // Author card should exist (even if name is from User, not Profile)
    const authorCard = page.locator('.author-card');
    await expect(authorCard).toBeVisible();
  });

  test('non-existent slug → shows post not found', async ({ page }) => {
    await page.goto('/blog/non-existent-slug-xyz');

    await expect(page.getByRole('heading', { name: 'Post not found' })).toBeVisible();
  });
});
