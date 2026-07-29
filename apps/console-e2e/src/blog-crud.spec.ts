import { test, expect } from './fixtures/auth.fixture';
import { PostsPage } from './pages/posts.page';
import { expectToast } from './helpers/toast';
import { clickConfirm } from './helpers/dialog';
import { TEST_PNG_BASE64 } from './data/test-media';
import axios from 'axios';

const API = 'http://localhost:3000';
const PREFIX = 'e2e-console-blog-';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * `CreateBlogPostSchema` wants `contentJson`, not `content`.
 *
 * The plain `content` column was dropped in task 363 — a post's body is an `EditorDocument`
 * (`{ schemaVersion, content }`) that the handler wraps into the bilingual storage envelope and
 * canonicalizes. `featuredImageId` is a required `z.uuid()` with a real FK behind it, so it has
 * to be a media row that exists. Sending the old shape returned a flat 400 and took the whole
 * serial describe down with it.
 */
function validPayload(title: string, featuredImageId: string) {
  return {
    title,
    contentJson: {
      schemaVersion: 1,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Blog post content for console E2E testing.' }],
          },
        ],
      },
    },
    language: 'EN',
    featuredImageId,
  };
}

/**
 * Upload one PNG through the API so `featuredImageId` has a row to point at.
 *
 * The endpoint answers with the **bare id string**, not a JSON object: `UploadMediaHandler` ends
 * in `return this.repo.add(media)`, and `MediaRepository.add` resolves to `created.id`. The
 * console's own client asks for `responseType: 'text'` for exactly this reason. Reading `data.id`
 * therefore yields `undefined`, and the create call fails one step later with
 * `featuredImageId: expected string, received undefined` — a message that points at the wrong file.
 */
async function uploadCoverImage(token: string): Promise<string> {
  const form = new FormData();
  const bytes = Buffer.from(TEST_PNG_BASE64, 'base64');
  form.append('file', new Blob([bytes], { type: 'image/png' }), `${PREFIX}cover.png`);

  const res = await axios.post(`${API}/api/media/upload`, form, { headers: authHeaders(token) });
  const id = typeof res.data === 'string' ? res.data.replace(/^"|"$/g, '').trim() : String(res.data?.id ?? '');
  if (!id) throw new Error(`media upload returned no id: ${JSON.stringify(res.data)}`);
  return id;
}

/**
 * POST with the server's own rejection surfaced.
 *
 * Bare `axios.post` throws `AxiosError: Request failed with status code 400` and drops the body,
 * which is the one part that says *which* field the API refused. Debugging a 400 without it means
 * guessing at the schema.
 */
async function postJson(path: string, payload: unknown, token: string) {
  try {
    return await axios.post(`${API}${path}`, payload, { headers: authHeaders(token) });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      throw new Error(`POST ${path} → ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

/**
 * Seeding stays on the API: a post's body is a document-engine rich-text editor, and driving it
 * through the UI would make this a test of the editor rather than of blog CRUD. Everything that
 * is genuinely list-page behaviour runs through the console.
 *
 * What changed under the old spec:
 *
 * - the All / Trash tabs are gone — filtering is a "Status" `console-filter-select` plus a
 *   "Show deleted" chip, and a deleted post is *absent* from the table until that chip is on;
 * - row actions are icon buttons with `aria-label`s, not entries behind an "Actions" menu, and
 *   Edit is an `<a routerLink>` so it resolves as a link;
 * - the status cell shows the label from `BLOG_POST_STATUS_LABELS` — **"Draft"**, not `DRAFT`.
 */
test.describe('Blog Posts CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let coverImageId: string;

  test.beforeAll(async () => {
    const res = await axios.post(`${API}/api/auth/login`, {
      email: 'test-admin@e2e.local',
      password: 'TestPass1!',
      rememberMe: false,
    });
    adminToken = res.data.accessToken;

    await purgeTestPosts();
    coverImageId = await uploadCoverImage(adminToken);
  });

  test.afterAll(async () => {
    await purgeTestPosts();
  });

  async function purgeTestPosts(): Promise<void> {
    const list = await axios.get(`${API}/api/admin/blog`, {
      headers: authHeaders(adminToken),
      params: { includeDeleted: true, limit: 100 },
    });
    const testPosts = list.data.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
    for (const p of testPosts) {
      // Soft-deleted posts have to be restored before `DELETE` will hard-delete them.
      if (p.deletedAt) {
        await axios.post(`${API}/api/admin/blog/${p.id}/restore`, {}, { headers: authHeaders(adminToken) });
      }
      await axios.delete(`${API}/api/admin/blog/${p.id}`, { headers: authHeaders(adminToken) });
    }
  }

  test('navigate to Blog Posts page → list visible', async ({ adminPage: page }) => {
    const postsPage = new PostsPage(page);
    await postsPage.goto();

    await expect(postsPage.heading).toBeVisible();
    await expect(postsPage.newPostLink).toBeVisible();
    await expect(postsPage.statusFilter).toBeVisible();
    // The tabs this spec used to click no longer exist anywhere on the page.
    await expect(page.getByRole('tab')).toHaveCount(0);
  });

  test('New Post is a link to the routed editor', async ({ adminPage: page }) => {
    const postsPage = new PostsPage(page);
    await postsPage.goto();

    await postsPage.newPostLink.click();

    await expect(page).toHaveURL(/\/admin\/blog\/new$/);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  test('create post via API → appears in list', async ({ adminPage: page }) => {
    await postJson('/api/admin/blog', validPayload(`${PREFIX}crud-test`, coverImageId), adminToken);

    const postsPage = new PostsPage(page);
    await postsPage.goto();

    await expect(postsPage.getRow(`${PREFIX}crud-test`)).toBeVisible({ timeout: 5000 });
  });

  test('a new post shows the Draft status badge', async ({ adminPage: page }) => {
    const postsPage = new PostsPage(page);
    await postsPage.goto();

    await expect(postsPage.statusBadge(`${PREFIX}crud-test`)).toHaveText('Draft');
  });

  test('edit post title via the routed editor → change reflected in the list', async ({ adminPage: page }) => {
    const postsPage = new PostsPage(page);
    await postsPage.goto();

    const form = await postsPage.openEditForm(`${PREFIX}crud-test`);
    await form.titleInput.fill(`${PREFIX}crud-test-edited`);
    await form.saveButton.click();

    await expectToast(page, 'Post updated');

    await postsPage.goto();
    await expect(postsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });

  test('delete post → gone from the list, visible under Show deleted', async ({ adminPage: page }) => {
    const postsPage = new PostsPage(page);
    await postsPage.goto();

    await postsPage.clickDelete(`${PREFIX}crud-test-edited`);
    await clickConfirm(page);
    await expectToast(page, 'Post deleted');

    await expect(postsPage.getRow(`${PREFIX}crud-test-edited`)).toHaveCount(0);

    await postsPage.showDeleted(true);
    await expect(postsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
    await expect(postsPage.statusBadge(`${PREFIX}crud-test-edited`)).toHaveText('Deleted');
  });

  test('restore from Show deleted → back in the default list', async ({ adminPage: page }) => {
    const postsPage = new PostsPage(page);
    await postsPage.goto();

    await postsPage.showDeleted(true);
    await expect(postsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });

    await postsPage.clickRestore(`${PREFIX}crud-test-edited`);
    await expectToast(page, 'Post restored');

    await postsPage.goto();
    await expect(postsPage.getRow(`${PREFIX}crud-test-edited`)).toBeVisible({ timeout: 5000 });
  });
});
