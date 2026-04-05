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

const ADMIN_API = '/api/admin/profile';
const PUBLIC_API = '/api/profile';

// ── Helpers ───────────────────────────────────────────────

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    fullName: { en: 'E2E Test User', vi: 'Nguoi Dung E2E' },
    title: { en: 'Software Engineer', vi: 'Ky Su Phan Mem' },
    bioShort: { en: 'A short bio for testing.', vi: 'Tieu su ngan de kiem tra.' },
    bioLong: { en: 'A longer bio for testing purposes.', vi: 'Tieu su dai de kiem tra.' },
    yearsOfExperience: 5,
    availability: 'EMPLOYED',
    openTo: ['FREELANCE', 'CONSULTING'],
    email: 'e2e-profile@test-safe.com',
    phone: '+84 123 456 789',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'https://linkedin.com/in/e2e-test',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    locationPostalCode: '70000',
    locationAddress1: '123 Test Street',
    locationAddress2: 'Suite 456',
    socialLinks: [
      { platform: 'GITHUB', url: 'https://github.com/e2e-test', handle: 'e2e-test' },
      { platform: 'LINKEDIN', url: 'https://linkedin.com/in/e2e-test' },
    ],
    resumeUrls: { en: 'https://example.com/resume-en.pdf', vi: 'https://example.com/resume-vi.pdf' },
    certifications: [
      { name: 'AWS Solutions Architect', issuer: 'Amazon', year: 2024, url: 'https://aws.amazon.com/cert' },
    ],
    metaTitle: 'E2E Test Profile',
    metaDescription: 'Profile created during E2E testing.',
    timezone: 'Asia/Ho_Chi_Minh',
    canonicalUrl: 'https://example.com',
    ...overrides,
  };
}

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

// ── Tests ─────────────────────────────────────────────────

describe('Profile API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();

    // Only delete the test admin's profile, not the real admin's
    await prisma.profile.deleteMany({
      where: { user: { email: 'test-admin@e2e.local' } },
    });
  });

  afterAll(async () => {
    await prisma.profile.deleteMany({
      where: { user: { email: 'test-admin@e2e.local' } },
    });
    await prisma.$disconnect();
  });

  // ── Admin Operations ──────────────────────────────────

  describe('PUT /api/admin/profile (upsert)', () => {
    it('should create profile with full valid payload and return { id }', async () => {
      const res = await axios.put(ADMIN_API, validPayload(), {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(200);
      expect(res.data.id).toBeDefined();
      expect(typeof res.data.id).toBe('string');
    });

    it('should update profile on second PUT and return same id (PRF-002: upsert)', async () => {
      const first = await axios.put(ADMIN_API, validPayload({ yearsOfExperience: 6 }), {
        headers: authHeaders(adminToken),
      });
      const second = await axios.put(ADMIN_API, validPayload({ yearsOfExperience: 7 }), {
        headers: authHeaders(adminToken),
      });
      expect(second.status).toBe(200);
      expect(second.data.id).toBe(first.data.id);
    });

    it('should reject missing required translatable field (both en + vi)', async () => {
      try {
        await axios.put(ADMIN_API, validPayload({ fullName: { en: 'Only English' } }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject invalid socialLinks (bad URL)', async () => {
      try {
        await axios.put(
          ADMIN_API,
          validPayload({
            socialLinks: [{ platform: 'GITHUB', url: 'not-a-url' }],
          }),
          { headers: authHeaders(adminToken) }
        );
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject invalid certifications (year out of range)', async () => {
      try {
        await axios.put(
          ADMIN_API,
          validPayload({
            certifications: [{ name: 'Cert', issuer: 'Org', year: 1800 }],
          }),
          { headers: authHeaders(adminToken) }
        );
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject non-existent avatarId with MEDIA_NOT_FOUND error', async () => {
      try {
        await axios.put(ADMIN_API, validPayload({ avatarId: randomUUID() }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected error');
      } catch (err) {
        const e = err as AxiosError;
        expect(e.response?.status).toBe(404);
        expect((e.response?.data as Record<string, unknown>)?.errorCode).toBe('PROFILE_MEDIA_NOT_FOUND');
      }
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should return full profile including private fields', async () => {
      // Ensure profile exists
      await axios.put(ADMIN_API, validPayload(), {
        headers: authHeaders(adminToken),
      });

      const res = await axios.get(ADMIN_API, {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(200);

      // Public fields present
      expect(res.data.fullName).toEqual({ en: 'E2E Test User', vi: 'Nguoi Dung E2E' });
      expect(res.data.title).toEqual({ en: 'Software Engineer', vi: 'Ky Su Phan Mem' });
      expect(res.data.locationCity).toBe('Ho Chi Minh City');
      expect(res.data.locationCountry).toBe('Vietnam');

      // Private fields present (admin only)
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('userId');
      expect(res.data).toHaveProperty('phone');
      expect(res.data.phone).toBe('+84 123 456 789');
      expect(res.data).toHaveProperty('locationPostalCode');
      expect(res.data.locationPostalCode).toBe('70000');
      expect(res.data).toHaveProperty('locationAddress1');
      expect(res.data.locationAddress1).toBe('123 Test Street');
      expect(res.data).toHaveProperty('locationAddress2');
      expect(res.data.locationAddress2).toBe('Suite 456');
      expect(res.data).toHaveProperty('createdAt');
      expect(res.data).toHaveProperty('updatedAt');
    });
  });

  describe('PATCH /api/admin/profile/avatar', () => {
    it('should clear avatar with null', async () => {
      const res = await axios.patch(`${ADMIN_API}/avatar`, { avatarId: null }, { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);

      const profile = await axios.get(ADMIN_API, {
        headers: authHeaders(adminToken),
      });
      expect(profile.data.avatarId).toBeNull();
      expect(profile.data.avatarUrl).toBeNull();
    });

    it('should reject non-existent media ID', async () => {
      try {
        await axios.patch(`${ADMIN_API}/avatar`, { avatarId: randomUUID() }, { headers: authHeaders(adminToken) });
        fail('Expected error');
      } catch (err) {
        const e = err as AxiosError;
        expect(e.response?.status).toBe(404);
        expect((e.response?.data as Record<string, unknown>)?.errorCode).toBe('PROFILE_MEDIA_NOT_FOUND');
      }
    });
  });

  // ── Public Access (PRF-003) ───────────────────────────
  // Note: GET /profile returns the owner (first admin) profile.
  // Tests assert structure and field filtering, not exact values,
  // to avoid coupling with the real admin's data.

  describe('GET /api/profile (public)', () => {
    beforeAll(async () => {
      // Ensure at least one admin profile exists
      await axios.put(ADMIN_API, validPayload(), {
        headers: authHeaders(adminToken),
      });
    });

    it('should return 200 without auth', async () => {
      const res = await axios.get(PUBLIC_API);
      expect(res.status).toBe(200);
    });

    it('should NOT contain phone', async () => {
      const res = await axios.get(PUBLIC_API);
      expect(res.data).not.toHaveProperty('phone');
    });

    it('should NOT contain locationPostalCode, locationAddress1, locationAddress2', async () => {
      const res = await axios.get(PUBLIC_API);
      expect(res.data).not.toHaveProperty('locationPostalCode');
      expect(res.data).not.toHaveProperty('locationAddress1');
      expect(res.data).not.toHaveProperty('locationAddress2');
    });

    it('should contain locationCity and locationCountry', async () => {
      const res = await axios.get(PUBLIC_API);
      expect(typeof res.data.locationCity).toBe('string');
      expect(typeof res.data.locationCountry).toBe('string');
    });

    it('should return 404 when no admin profile exists', async () => {
      // Temporarily remove ALL admin profiles to trigger 404
      const backupToken = adminToken;
      await prisma.profile.deleteMany({
        where: { user: { role: 'ADMIN' } },
      });

      try {
        await axios.get(PUBLIC_API);
        fail('Expected 404');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }

      // Restore test admin's profile for subsequent tests
      await axios.put(ADMIN_API, validPayload(), {
        headers: authHeaders(backupToken),
      });
    });
  });

  // ── JSON-LD ───────────────────────────────────────────

  describe('GET /api/profile/json-ld', () => {
    it('should return valid Schema.org Person JSON-LD for locale=en', async () => {
      const res = await axios.get(`${PUBLIC_API}/json-ld`, { params: { locale: 'en' } });
      expect(res.status).toBe(200);
      expect(res.data['@context']).toBe('https://schema.org');
      expect(res.data['@type']).toBe('Person');
      expect(typeof res.data.name).toBe('string');
      expect(typeof res.data.jobTitle).toBe('string');
      expect(typeof res.data.description).toBe('string');
      expect(Array.isArray(res.data.sameAs)).toBe(true);
    });

    it('should return JSON-LD with vi translatable fields for locale=vi', async () => {
      const res = await axios.get(`${PUBLIC_API}/json-ld`, { params: { locale: 'vi' } });
      expect(res.status).toBe(200);
      expect(typeof res.data.name).toBe('string');
      expect(typeof res.data.jobTitle).toBe('string');
      expect(typeof res.data.description).toBe('string');
    });

    it('should contain @type Person, name, jobTitle, description, sameAs', async () => {
      const res = await axios.get(`${PUBLIC_API}/json-ld`, { params: { locale: 'en' } });
      expect(res.data).toHaveProperty('@type', 'Person');
      expect(res.data).toHaveProperty('name');
      expect(res.data).toHaveProperty('jobTitle');
      expect(res.data).toHaveProperty('description');
      expect(res.data).toHaveProperty('sameAs');
      expect(Array.isArray(res.data.sameAs)).toBe(true);
    });
  });

  // ── Auth Protection ───────────────────────────────────

  describe('Auth Protection', () => {
    it('should return 401 for PUT /admin/profile without auth', async () => {
      try {
        await axios.put(ADMIN_API, validPayload(), { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('should return 401 for GET /admin/profile without auth', async () => {
      try {
        await axios.get(ADMIN_API, { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('should return 200 for GET /profile without auth (public)', async () => {
      // Ensure profile exists
      await axios.put(ADMIN_API, validPayload(), {
        headers: authHeaders(adminToken),
      });
      const res = await axios.get(PUBLIC_API);
      expect(res.status).toBe(200);
    });
  });
});
