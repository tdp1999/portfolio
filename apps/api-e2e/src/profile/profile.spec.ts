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
const ADMIN_EMAIL = 'test-admin@e2e.local';

// ── Helpers ───────────────────────────────────────────────

// A single editor document carrying `text`. `bioLongJson` is the rich-text source
// (legacy plain `bioLong` dropped in task 363); the server canonicalizes it into the
// bioLong* triple. EditorDocumentSchema = { schemaVersion, content }.
function doc(text: string) {
  return {
    schemaVersion: 1,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
  };
}

// Valid payloads per granular PATCH endpoint (the profile API is slice-based now —
// there is no single PUT upsert; a profile row is seeded directly below).
const identityPayload = (overrides: Record<string, unknown> = {}) => ({
  fullName: { en: 'E2E Test User', vi: 'Nguoi Dung E2E' },
  title: { en: 'Software Engineer', vi: 'Ky Su Phan Mem' },
  bioShort: { en: 'A short bio for testing.', vi: 'Tieu su ngan de kiem tra.' },
  bioLongJson: { en: doc('A longer bio for testing purposes.'), vi: doc('Tieu su dai de kiem tra.') },
  ...overrides,
});

const contactPayload = (overrides: Record<string, unknown> = {}) => ({
  email: 'e2e-profile@test-safe.com',
  phone: '+84 123 456 789',
  phoneZalo: null,
  preferredContactPlatform: 'LINKEDIN',
  preferredContactValue: 'https://linkedin.com/in/e2e-test',
  ...overrides,
});

const locationPayload = (overrides: Record<string, unknown> = {}) => ({
  locationCountry: 'Vietnam',
  locationCity: 'Ho Chi Minh City',
  locationPostalCode: '70000',
  locationAddress1: '123 Test Street',
  locationAddress2: 'Suite 456',
  ...overrides,
});

async function loginAsAdmin(): Promise<string> {
  const res = await axios.post('/api/auth/login', {
    email: ADMIN_EMAIL,
    password: 'TestPass1!',
    rememberMe: false,
  });
  return res.data.accessToken;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// The admin profile API has no create endpoint — a row is seeded directly (mirrors
// how prisma/seed.ts bootstraps the real admin). Upsert so reruns start from a known
// baseline (avatar/phone/address cleared) without depending on prior test order.
async function seedTestAdminProfile(): Promise<void> {
  const admin = await prisma.user.findFirst({ where: { email: ADMIN_EMAIL }, select: { id: true } });
  if (!admin) throw new Error('test-admin user not seeded');
  const base = {
    fullName: { en: 'E2E Test User', vi: 'Nguoi Dung E2E' },
    title: { en: 'Software Engineer', vi: 'Ky Su Phan Mem' },
    bioShort: { en: 'A short bio for testing.', vi: 'Tieu su ngan de kiem tra.' },
    yearsOfExperience: 5,
    email: 'e2e-profile@test-safe.com',
    preferredContactValue: 'https://linkedin.com/in/e2e-test',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh City',
    avatarId: null,
    phone: null,
    locationPostalCode: null,
    locationAddress1: null,
    locationAddress2: null,
  };
  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: base,
    create: { id: randomUUID(), userId: admin.id, createdById: admin.id, updatedById: admin.id, ...base },
  });
}

// ── Tests ─────────────────────────────────────────────────

describe('Profile API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
    await seedTestAdminProfile();
  });

  afterAll(async () => {
    await prisma.profile.deleteMany({ where: { user: { email: ADMIN_EMAIL } } });
    await prisma.$disconnect();
  });

  // ── Identity (incl. rich-text bioLong) ────────────────

  describe('PATCH /api/admin/profile/identity', () => {
    it('updates identity + canonicalizes bioLongJson into the bioLong* triple', async () => {
      const res = await axios.patch(`${ADMIN_API}/identity`, identityPayload(), { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);

      const profile = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      expect(profile.data.fullName).toEqual({ en: 'E2E Test User', vi: 'Nguoi Dung E2E' });
      expect(profile.data.title).toEqual({ en: 'Software Engineer', vi: 'Ky Su Phan Mem' });
      // Rich-text body persisted; legacy plain `bioLong` column dropped in task 363.
      expect(profile.data.bioLongHtml).not.toBeNull();
      expect(profile.data.bioLongCanonical).not.toBeNull();
      expect(profile.data).not.toHaveProperty('bioLong');
    });

    it('rejects missing required translatable field (en only)', async () => {
      try {
        await axios.patch(`${ADMIN_API}/identity`, identityPayload({ fullName: { en: 'Only English' } }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });
  });

  // ── Contact ───────────────────────────────────────────

  describe('PATCH /api/admin/profile/contact', () => {
    it('updates contact fields', async () => {
      const res = await axios.patch(`${ADMIN_API}/contact`, contactPayload(), { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);
    });

    it('rejects an invalid email', async () => {
      try {
        await axios.patch(`${ADMIN_API}/contact`, contactPayload({ email: 'not-an-email' }), {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });
  });

  // ── Location ──────────────────────────────────────────

  describe('PATCH /api/admin/profile/location', () => {
    it('updates location (private address fields)', async () => {
      const res = await axios.patch(`${ADMIN_API}/location`, locationPayload(), { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);
    });
  });

  // ── Social links / certifications ─────────────────────

  describe('PATCH /api/admin/profile/social-links', () => {
    it('rejects invalid socialLinks (bad URL)', async () => {
      try {
        await axios.patch(
          `${ADMIN_API}/social-links`,
          { socialLinks: [{ platform: 'GITHUB', url: 'not-a-url' }], resumeUrls: {}, certifications: [] },
          { headers: authHeaders(adminToken) }
        );
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('rejects invalid certifications (year out of range)', async () => {
      try {
        await axios.patch(
          `${ADMIN_API}/social-links`,
          { socialLinks: [], resumeUrls: {}, certifications: [{ name: 'Cert', issuer: 'Org', year: 1800 }] },
          { headers: authHeaders(adminToken) }
        );
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });
  });

  // ── Avatar ────────────────────────────────────────────

  describe('PATCH /api/admin/profile/avatar', () => {
    it('should clear avatar with null', async () => {
      const res = await axios.patch(`${ADMIN_API}/avatar`, { avatarId: null }, { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);

      const profile = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
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

  // ── Admin GET (full profile incl. private fields) ─────

  describe('GET /api/admin/profile', () => {
    it('returns full profile including private fields', async () => {
      // Re-apply contact + location so the private fields are deterministic here.
      await axios.patch(`${ADMIN_API}/contact`, contactPayload(), { headers: authHeaders(adminToken) });
      await axios.patch(`${ADMIN_API}/location`, locationPayload(), { headers: authHeaders(adminToken) });

      const res = await axios.get(ADMIN_API, { headers: authHeaders(adminToken) });
      expect(res.status).toBe(200);

      expect(res.data.locationCity).toBe('Ho Chi Minh City');
      expect(res.data.locationCountry).toBe('Vietnam');
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('userId');
      expect(res.data.phone).toBe('+84 123 456 789');
      expect(res.data.locationPostalCode).toBe('70000');
      expect(res.data.locationAddress1).toBe('123 Test Street');
      expect(res.data.locationAddress2).toBe('Suite 456');
      expect(res.data).toHaveProperty('createdAt');
      expect(res.data).toHaveProperty('updatedAt');
    });
  });

  // ── Public Access (PRF-003) ───────────────────────────
  // GET /profile returns the owner (first admin) profile. Assert structure + field
  // filtering only, not exact values, to avoid coupling with the real admin's data.

  describe('GET /api/profile (public)', () => {
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

    // NOTE: the previous "404 when no admin profile exists" case was dropped — it
    // deleted ALL admin profiles (destroying real dev data) and the API has no create
    // endpoint to restore them. The empty-profile branch is covered by unit tests.
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
    it('should return 401 for PATCH /admin/profile/identity without auth', async () => {
      try {
        await axios.patch(`${ADMIN_API}/identity`, identityPayload(), { headers: { Authorization: '' } });
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
      const res = await axios.get(PUBLIC_API);
      expect(res.status).toBe(200);
    });
  });
});
