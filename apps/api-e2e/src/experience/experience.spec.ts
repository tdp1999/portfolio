import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
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

const ADMIN_API = '/api/experiences/admin/list';
const PUBLIC_API = '/api/experiences';
const EXP_PREFIX = 'e2e-api-exp-';

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
    companyName: `${EXP_PREFIX}acme`,
    position: { en: 'Software Engineer', vi: 'Kỹ sư phần mềm' },
    achievements: { en: [], vi: [] },
    employmentType: 'FULL_TIME',
    locationType: 'REMOTE',
    locationCountry: 'Vietnam',
    startDate: '2022-01-01T00:00:00.000Z',
    skillIds: [],
    displayOrder: 0,
    ...overrides,
  };
}

async function cleanupTestExperiences(): Promise<void> {
  const exps = await prisma.experience.findMany({
    where: { companyName: { startsWith: EXP_PREFIX } },
    select: { id: true },
  });
  const ids = exps.map((e) => e.id);
  if (ids.length) {
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }
}

// ── Tests ─────────────────────────────────────────────────

describe('Experience API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    await cleanupTestExperiences();
  });

  afterAll(async () => {
    await cleanupTestExperiences();
    await prisma.$disconnect();
  });

  // ── Create ────────────────────────────────────────────

  describe('POST /api/experiences (admin)', () => {
    it('should create experience with valid payload and return { id }', async () => {
      const res = await axios.post(PUBLIC_API, validPayload(), {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(typeof res.data.id).toBe('string');
    });

    it('should reject missing required field: companyName', async () => {
      const payload = validPayload();
      delete (payload as Record<string, unknown>)['companyName'];
      try {
        await axios.post(PUBLIC_API, payload, { headers: authHeaders(adminToken) });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject missing position', async () => {
      try {
        await axios.post(PUBLIC_API, validPayload({ position: undefined }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject invalid skillId (non-existent)', async () => {
      try {
        await axios.post(PUBLIC_API, validPayload({ skillIds: [randomUUID()] }), { headers: authHeaders(adminToken) });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should return 401 without auth', async () => {
      try {
        await axios.post(PUBLIC_API, validPayload());
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });
  });

  // ── Public List ───────────────────────────────────────

  describe('GET /api/experiences (public)', () => {
    let createdSlug: string;

    beforeAll(async () => {
      await cleanupTestExperiences();

      // Create two experiences with different start dates
      const res1 = await axios.post(
        PUBLIC_API,
        validPayload({
          companyName: `${EXP_PREFIX}older`,
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2021-01-01T00:00:00.000Z',
        }),
        { headers: authHeaders(adminToken) }
      );
      const res2 = await axios.post(
        PUBLIC_API,
        validPayload({
          companyName: `${EXP_PREFIX}newer`,
          startDate: '2022-06-01T00:00:00.000Z',
        }),
        { headers: authHeaders(adminToken) }
      );

      // Get the slug for the newer one
      const adminList = await axios.get(ADMIN_API, {
        headers: authHeaders(adminToken),
        params: { search: `${EXP_PREFIX}newer` },
      });
      createdSlug = adminList.data.data[0]?.slug;
    });

    it('should return 200 without auth', async () => {
      const res = await axios.get(PUBLIC_API);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('should return non-deleted experiences only', async () => {
      const res = await axios.get(PUBLIC_API);
      const testExps = res.data.filter((e: { companyName: string }) => e.companyName.startsWith(EXP_PREFIX));
      // Both test experiences should be present (neither deleted)
      expect(testExps.length).toBeGreaterThanOrEqual(2);
    });

    it('should return experiences sorted by startDate DESC (newest first)', async () => {
      const res = await axios.get(PUBLIC_API);
      const testExps = res.data.filter((e: { companyName: string }) => e.companyName.startsWith(EXP_PREFIX));
      const newerIdx = testExps.findIndex((e: { companyName: string }) => e.companyName === `${EXP_PREFIX}newer`);
      const olderIdx = testExps.findIndex((e: { companyName: string }) => e.companyName === `${EXP_PREFIX}older`);
      expect(newerIdx).toBeLessThan(olderIdx);
    });

    it('should NOT expose private fields (EXP-002)', async () => {
      const res = await axios.get(PUBLIC_API);
      const exp = res.data[0];
      expect(exp).not.toHaveProperty('clientName');
      expect(exp).not.toHaveProperty('clientIndustry');
      expect(exp).not.toHaveProperty('locationPostalCode');
      expect(exp).not.toHaveProperty('locationAddress1');
      expect(exp).not.toHaveProperty('locationAddress2');
      expect(exp).not.toHaveProperty('createdAt');
      expect(exp).not.toHaveProperty('updatedAt');
      expect(exp).not.toHaveProperty('createdById');
      expect(exp).not.toHaveProperty('updatedById');
      expect(exp).not.toHaveProperty('deletedAt');
      expect(exp).not.toHaveProperty('displayOrder');
    });

    it('should include required public fields', async () => {
      const res = await axios.get(PUBLIC_API);
      const exp = res.data[0];
      expect(exp).toHaveProperty('id');
      expect(exp).toHaveProperty('slug');
      expect(exp).toHaveProperty('companyName');
      expect(exp).toHaveProperty('position');
      expect(exp.position).toHaveProperty('en');
      expect(exp.position).toHaveProperty('vi');
      expect(exp).toHaveProperty('employmentType');
      expect(exp).toHaveProperty('locationType');
      expect(exp).toHaveProperty('startDate');
      expect(exp).toHaveProperty('skills');
      expect(Array.isArray(exp.skills)).toBe(true);
      expect(exp).toHaveProperty('companyLogoUrl');
    });

    it('should exclude soft-deleted experiences from public list', async () => {
      // Soft-delete the older experience
      const olderList = await axios.get(ADMIN_API, {
        headers: authHeaders(adminToken),
        params: { search: `${EXP_PREFIX}older` },
      });
      const olderId = olderList.data.data[0]?.id;
      await axios.delete(`${PUBLIC_API}/${olderId}`, { headers: authHeaders(adminToken) });

      const publicRes = await axios.get(PUBLIC_API);
      const olderInPublic = publicRes.data.find((e: { companyName: string }) => e.companyName === `${EXP_PREFIX}older`);
      expect(olderInPublic).toBeUndefined();

      // Restore for subsequent tests
      await axios.patch(`${PUBLIC_API}/${olderId}/restore`, {}, { headers: authHeaders(adminToken) });
    });

    it('GET /experiences/:slug returns single experience with public fields', async () => {
      expect(createdSlug).toBeDefined();
      const res = await axios.get(`${PUBLIC_API}/${createdSlug}`);
      expect(res.status).toBe(200);
      expect(res.data.slug).toBe(createdSlug);
      expect(res.data).toHaveProperty('position');
      expect(res.data).not.toHaveProperty('clientName');
      expect(res.data).not.toHaveProperty('createdAt');
    });

    it('GET /experiences/:slug returns 404 for unknown slug', async () => {
      try {
        await axios.get(`${PUBLIC_API}/non-existent-slug-xyz`);
        fail('Expected 404');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }
    });
  });

  // ── Update ────────────────────────────────────────────

  describe('PUT /api/experiences/:id (admin)', () => {
    let experienceId: string;

    beforeAll(async () => {
      const res = await axios.post(PUBLIC_API, validPayload({ companyName: `${EXP_PREFIX}update-target` }), {
        headers: authHeaders(adminToken),
      });
      experienceId = res.data.id;
    });

    it('should update experience and return { success: true }', async () => {
      const res = await axios.put(
        `${PUBLIC_API}/${experienceId}`,
        { position: { en: 'Updated Role', vi: 'Vai trò cập nhật' } },
        { headers: authHeaders(adminToken) }
      );
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true });
    });

    it('should reject update from non-admin', async () => {
      try {
        await axios.put(`${PUBLIC_API}/${experienceId}`, { position: { en: 'Hacked', vi: 'Bị hack' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });
  });

  // ── Delete / Restore ──────────────────────────────────

  describe('DELETE + PATCH restore (admin)', () => {
    let experienceId: string;

    beforeAll(async () => {
      const res = await axios.post(PUBLIC_API, validPayload({ companyName: `${EXP_PREFIX}delete-target` }), {
        headers: authHeaders(adminToken),
      });
      experienceId = res.data.id;
    });

    it('DELETE /experiences/:id soft-deletes and returns { success: true }', async () => {
      const res = await axios.delete(`${PUBLIC_API}/${experienceId}`, {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true });
    });

    it('deleted experience not in public list', async () => {
      const res = await axios.get(PUBLIC_API);
      const found = res.data.find((e: { id: string }) => e.id === experienceId);
      expect(found).toBeUndefined();
    });

    it('PATCH /experiences/:id/restore restores soft-deleted experience', async () => {
      const res = await axios.patch(`${PUBLIC_API}/${experienceId}/restore`, {}, { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ success: true });

      const publicRes = await axios.get(PUBLIC_API);
      const found = publicRes.data.find((e: { id: string }) => e.id === experienceId);
      expect(found).toBeDefined();
    });
  });

  // ── Admin List ────────────────────────────────────────

  describe('GET /experiences/admin/list', () => {
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

    it('admin response includes private fields', async () => {
      const res = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      const exp = res.data.data[0];
      if (exp) {
        expect(exp).toHaveProperty('deletedAt');
        expect(exp).toHaveProperty('createdAt');
        expect(exp).toHaveProperty('displayOrder');
      }
    });
  });
});
