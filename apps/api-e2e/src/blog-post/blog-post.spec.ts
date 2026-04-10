import axios, { AxiosError } from 'axios';
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(__dirname, '../../../../.env') });

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for E2E tests');
}
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const ADMIN_API = '/api/admin/blog';
const PUBLIC_API = '/api/blog';
const PREFIX = 'e2e-api-blog-';

// ── Helpers ───────────────────────────────────────────────

async function loginAsAdmin(): Promise<string> {
  const res = await axios.post('/api/auth/login', {
    email: 'test-admin@e2e.local',
    password: 'TestPass1!',
    rememberMe: false,
  });
  return res.data.accessToken;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: `${PREFIX}test-post`,
    content: 'This is the blog post content for E2E testing. '.repeat(10),
    language: 'EN',
    ...overrides,
  };
}

async function cleanupTestPosts(): Promise<void> {
  const posts = await prisma.blogPost.findMany({
    where: { title: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = posts.map((p) => p.id);
  if (ids.length) {
    await prisma.postCategory.deleteMany({ where: { postId: { in: ids } } });
    await prisma.postTag.deleteMany({ where: { postId: { in: ids } } });
    await prisma.blogPost.deleteMany({ where: { id: { in: ids } } });
  }
}

// ── Tests ─────────────────────────────────────────────────

describe('BlogPost API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    await cleanupTestPosts();
  });

  afterAll(async () => {
    await cleanupTestPosts();
    await prisma.$disconnect();
  });

  // ── Create ────────────────────────────────────────────

  describe('POST /api/admin/blog (create)', () => {
    it('should create post with valid payload and return { id }', async () => {
      const res = await axios.post(ADMIN_API, validPayload(), {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(typeof res.data.id).toBe('string');
    });

    it('should reject missing title', async () => {
      try {
        await axios.post(ADMIN_API, validPayload({ title: undefined }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject missing content', async () => {
      try {
        await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}no-content`, content: undefined }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should default status to DRAFT', async () => {
      const createRes = await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}default-draft` }), {
        headers: authHeaders(adminToken),
      });
      const detail = await axios.get(`${ADMIN_API}/${createRes.data.id}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.status).toBe('DRAFT');
    });

    it('should return 401 without auth', async () => {
      try {
        await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}no-auth` }));
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });
  });

  // ── Import Markdown ───────────────────────────────────

  describe('POST /api/admin/blog/import-markdown', () => {
    it('should import markdown and return { id }', async () => {
      const res = await axios.post(
        `${ADMIN_API}/import-markdown`,
        {
          content: `# ${PREFIX}imported\n\nSome markdown content here with enough words for read time.`,
          language: 'EN',
        },
        { headers: authHeaders(adminToken) }
      );
      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
    });
  });

  // ── Public List ───────────────────────────────────────

  describe('GET /api/blog (public)', () => {
    beforeAll(async () => {
      await cleanupTestPosts();

      // Create and publish two posts
      const res1 = await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}published-1`, status: 'PUBLISHED' }), {
        headers: authHeaders(adminToken),
      });
      await axios.post(
        ADMIN_API,
        validPayload({ title: `${PREFIX}published-2`, status: 'PUBLISHED', featured: true }),
        { headers: authHeaders(adminToken) }
      );
      // Create a draft (should NOT appear in public)
      await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}draft-hidden` }), {
        headers: authHeaders(adminToken),
      });
    });

    it('should return 200 without auth', async () => {
      const res = await axios.get(PUBLIC_API);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data).toHaveProperty('total');
    });

    it('should return only published posts (DRAFT not visible)', async () => {
      const res = await axios.get(PUBLIC_API);
      const testPosts = res.data.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
      const titles = testPosts.map((p: { title: string }) => p.title);
      expect(titles).toContain(`${PREFIX}published-1`);
      expect(titles).toContain(`${PREFIX}published-2`);
      expect(titles).not.toContain(`${PREFIX}draft-hidden`);
    });

    it('should include required public fields', async () => {
      const res = await axios.get(PUBLIC_API);
      const post = res.data.data.find((p: { title: string }) => p.title.startsWith(PREFIX));
      expect(post).toHaveProperty('slug');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('language');
      expect(post).toHaveProperty('categories');
      expect(post).toHaveProperty('tags');
      expect(post).toHaveProperty('publishedAt');
    });

    it('should NOT expose admin-only fields', async () => {
      const res = await axios.get(PUBLIC_API);
      const post = res.data.data[0];
      if (post) {
        expect(post).not.toHaveProperty('id');
        expect(post).not.toHaveProperty('status');
        expect(post).not.toHaveProperty('createdAt');
        expect(post).not.toHaveProperty('deletedAt');
      }
    });
  });

  // ── Featured ──────────────────────────────────────────

  describe('GET /api/blog/featured', () => {
    it('should return only featured + published posts', async () => {
      const res = await axios.get(`${PUBLIC_API}/featured`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      const testPosts = res.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
      expect(testPosts.length).toBe(1);
      expect(testPosts[0].title).toBe(`${PREFIX}published-2`);
    });
  });

  // ── Public Detail (by slug) ───────────────────────────

  describe('GET /api/blog/:slug (public)', () => {
    let publishedSlug: string;

    beforeAll(async () => {
      const adminList = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      const post = adminList.data.data.find((p: { title: string }) => p.title === `${PREFIX}published-1`);
      publishedSlug = post?.slug;
    });

    it('should return full detail with content and author', async () => {
      expect(publishedSlug).toBeDefined();
      const res = await axios.get(`${PUBLIC_API}/${publishedSlug}`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('slug', publishedSlug);
      expect(res.data).toHaveProperty('title');
      expect(res.data).toHaveProperty('content');
      expect(res.data).toHaveProperty('author');
      expect(res.data).toHaveProperty('relatedPosts');
    });

    it('should return 404 for non-existent slug', async () => {
      try {
        await axios.get(`${PUBLIC_API}/non-existent-slug-xyz`);
        fail('Expected 404');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }
    });

    it('should return 404 for draft post slug', async () => {
      const adminList = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      const draft = adminList.data.data.find((p: { title: string }) => p.title === `${PREFIX}draft-hidden`);

      try {
        await axios.get(`${PUBLIC_API}/${draft.slug}`);
        fail('Expected 404');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }
    });
  });

  // ── Update ────────────────────────────────────────────

  describe('PUT /api/admin/blog/:id (update)', () => {
    let postId: string;

    beforeAll(async () => {
      const res = await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}update-target` }), {
        headers: authHeaders(adminToken),
      });
      postId = res.data.id;
    });

    it('should update post and return { success: true }', async () => {
      const res = await axios.put(
        `${ADMIN_API}/${postId}`,
        { title: `${PREFIX}update-target-edited` },
        { headers: authHeaders(adminToken) }
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true });
    });

    it('should set publishedAt on first PUBLISHED transition', async () => {
      await axios.put(`${ADMIN_API}/${postId}`, { status: 'PUBLISHED' }, { headers: authHeaders(adminToken) });
      const detail = await axios.get(`${ADMIN_API}/${postId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.publishedAt).not.toBeNull();
    });

    it('should return 401 without auth', async () => {
      try {
        await axios.put(`${ADMIN_API}/${postId}`, { title: 'Hacked' });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });
  });

  // ── Delete / Restore ──────────────────────────────────

  describe('DELETE + POST restore (admin)', () => {
    let postId: string;
    let postSlug: string;

    beforeAll(async () => {
      const res = await axios.post(ADMIN_API, validPayload({ title: `${PREFIX}delete-target`, status: 'PUBLISHED' }), {
        headers: authHeaders(adminToken),
      });
      postId = res.data.id;
      const detail = await axios.get(`${ADMIN_API}/${postId}`, {
        headers: authHeaders(adminToken),
      });
      postSlug = detail.data.slug;
    });

    it('DELETE soft-deletes and returns { success: true }', async () => {
      const res = await axios.delete(`${ADMIN_API}/${postId}`, {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true });
    });

    it('deleted post returns 404 on public slug endpoint', async () => {
      try {
        await axios.get(`${PUBLIC_API}/${postSlug}`);
        fail('Expected 404');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }
    });

    it('POST restore restores soft-deleted post', async () => {
      const res = await axios.post(`${ADMIN_API}/${postId}/restore`, {}, { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true });

      // Verify accessible again
      const publicRes = await axios.get(`${PUBLIC_API}/${postSlug}`);
      expect(publicRes.status).toBe(200);
    });
  });

  // ── Admin List ────────────────────────────────────────

  describe('GET /api/admin/blog (list)', () => {
    it('should return paginated list with total', async () => {
      const res = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(typeof res.data.total).toBe('number');
    });

    it('should return 401 without auth', async () => {
      try {
        await axios.get(ADMIN_API);
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('admin response includes admin-only fields', async () => {
      const res = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      const post = res.data.data[0];
      if (post) {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('status');
        expect(post).toHaveProperty('createdAt');
        expect(post).toHaveProperty('deletedAt');
      }
    });

    it('should filter by status', async () => {
      const res = await axios.get(ADMIN_API, {
        headers: authHeaders(adminToken),
        params: { status: 'DRAFT' },
      });
      expect(res.status).toBe(200);
      const statuses = res.data.data.map((p: { status: string }) => p.status);
      statuses.forEach((s: string) => expect(s).toBe('DRAFT'));
    });
  });
});
