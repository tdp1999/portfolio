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

const API = '/api/contact-messages';

// ── Helpers ───────────────────────────────────────────────

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'E2E Tester',
    email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test-safe.com`,
    purpose: 'GENERAL',
    subject: 'E2E Test Subject',
    message: 'This is a valid test message for E2E testing purposes.',
    locale: 'en',
    consentGivenAt: new Date().toISOString(),
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

async function seedMessage(id: string, overrides: Record<string, unknown> = {}): Promise<void> {
  await prisma.contactMessage.create({
    data: {
      id,
      name: `E2E Seeded ${id.slice(-4)}`,
      email: `e2e-seeded-${id.slice(-4)}@test-safe.com`,
      purpose: 'GENERAL',
      subject: `Seeded Subject ${id.slice(-4)}`,
      message: 'This is a seeded test message for E2E admin inbox testing.',
      status: 'UNREAD',
      isSpam: false,
      locale: 'en',
      consentGivenAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ...overrides,
    },
  });
}

async function deleteSeededMessages(ids: string[]): Promise<void> {
  await prisma.contactMessage.deleteMany({ where: { id: { in: ids } } });
}

// ── Tests ─────────────────────────────────────────────────

describe('ContactMessage API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  afterAll(async () => {
    // Clean up all e2e messages
    await prisma.contactMessage.deleteMany({
      where: { email: { endsWith: '@test-safe.com' } },
    });
    await prisma.$disconnect();
  });

  // ── Public Submission Flow ────────────────────────────

  describe('POST /api/contact-messages (public submit)', () => {
    it('should submit valid message and return 201 with id', async () => {
      const res = await axios.post(API, validPayload());
      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(typeof res.data.id).toBe('string');
    });

    it('should submit with all fields and store correctly', async () => {
      const payload = validPayload({
        purpose: 'JOB_OPPORTUNITY',
        subject: 'Full Fields Test',
        locale: 'vi',
      });
      const res = await axios.post(API, payload);
      expect(res.status).toBe(201);

      const detail = await axios.get(`${API}/${res.data.id}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.name).toBe(payload.name);
      expect(detail.data.email).toBe(payload.email);
      expect(detail.data.purpose).toBe('JOB_OPPORTUNITY');
      expect(detail.data.subject).toBe('Full Fields Test');
      expect(detail.data.locale).toBe('vi');
      expect(detail.data.status).toBe('UNREAD');
    });

    it('should submit with minimal fields and apply defaults', async () => {
      const payload = {
        name: 'Minimal User',
        email: `e2e-minimal-${Date.now()}@test-safe.com`,
        message: 'This is a valid minimal test message.',
        consentGivenAt: new Date().toISOString(),
      };
      const res = await axios.post(API, payload);
      expect(res.status).toBe(201);

      const detail = await axios.get(`${API}/${res.data.id}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.purpose).toBe('GENERAL');
      expect(detail.data.locale).toBe('en');
    });

    it('should reject invalid email format', async () => {
      try {
        await axios.post(API, validPayload({ email: 'not-an-email' }));
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject missing required fields', async () => {
      try {
        await axios.post(API, { name: 'Only Name' });
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should reject message too short (< 10 chars)', async () => {
      try {
        await axios.post(API, validPayload({ message: 'Short' }));
        fail('Expected 400');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(400);
      }
    });

    it('should silently accept honeypot but NOT store in DB', async () => {
      const payload = validPayload({ website: 'http://spam.bot' });
      const res = await axios.post(API, payload);
      expect(res.status).toBe(201);

      try {
        await axios.get(`${API}/${res.data.id}`, { headers: authHeaders(adminToken) });
        fail('Expected 404 — honeypot message should not be stored');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }
    });
  });

  // ── Spam Protection ───────────────────────────────────

  describe('Spam Protection', () => {
    it('should reject disposable email', async () => {
      try {
        await axios.post(API, validPayload({ email: 'bot@mailinator.com' }));
        fail('Expected 400');
      } catch (err) {
        const e = err as AxiosError;
        expect(e.response?.status).toBe(400);
        expect((e.response?.data as Record<string, unknown>)?.errorCode).toBe('CONTACT_MESSAGE_DISPOSABLE_EMAIL');
      }
    });
  });

  // ── Admin Inbox (seeded via DB — no rate limit impact) ──

  describe('Admin Inbox', () => {
    const messageId = randomUUID();
    const searchMsgId = randomUUID();
    const unreadMsgId = randomUUID();
    const allSeeded = [messageId, searchMsgId, unreadMsgId];

    beforeAll(async () => {
      await seedMessage(messageId, { subject: 'Admin Test Message' });
      await seedMessage(searchMsgId, {
        name: 'Searchable Person',
        subject: 'Unique Search Term XYZ',
      });
      await seedMessage(unreadMsgId, { subject: 'Unread for reply test' });
    });

    afterAll(async () => {
      await deleteSeededMessages(allSeeded);
    });

    it('should list messages with pagination', async () => {
      const res = await axios.get(API, {
        headers: authHeaders(adminToken),
        params: { page: 1, limit: 10 },
      });
      expect(res.status).toBe(200);
      expect(res.data.data).toBeInstanceOf(Array);
      expect(typeof res.data.total).toBe('number');
      expect(res.data.page).toBe(1);
      expect(res.data.limit).toBe(10);
    });

    it('should list with status filter', async () => {
      const res = await axios.get(API, {
        headers: authHeaders(adminToken),
        params: { page: 1, limit: 50, status: 'UNREAD' },
      });
      expect(res.status).toBe(200);
      for (const msg of res.data.data) {
        expect(msg.status).toBe('UNREAD');
      }
    });

    it('should list with search by name/email/subject', async () => {
      const res = await axios.get(API, {
        headers: authHeaders(adminToken),
        params: { page: 1, limit: 50, search: 'Unique Search Term XYZ' },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should get message by ID', async () => {
      const res = await axios.get(`${API}/${messageId}`, {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(200);
      expect(res.data.id).toBe(messageId);
      expect(res.data.message).toBeDefined();
      expect(res.data.subject).toBe('Admin Test Message');
    });

    it('should return 404 for non-existent ID', async () => {
      try {
        await axios.get(`${API}/${randomUUID()}`, { headers: authHeaders(adminToken) });
        fail('Expected 404');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(404);
      }
    });

    it('should mark as read', async () => {
      await axios.patch(`${API}/${messageId}/read`, null, {
        headers: authHeaders(adminToken),
      });

      const detail = await axios.get(`${API}/${messageId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.status).toBe('READ');
      expect(detail.data.readAt).not.toBeNull();
    });

    it('should mark as unread', async () => {
      await axios.patch(`${API}/${messageId}/read`, null, {
        headers: authHeaders(adminToken),
      });
      await axios.patch(`${API}/${messageId}/unread`, null, {
        headers: authHeaders(adminToken),
      });

      const detail = await axios.get(`${API}/${messageId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.status).toBe('UNREAD');
      expect(detail.data.readAt).toBeNull();
    });

    it('should set replied from READ state', async () => {
      await axios.patch(`${API}/${messageId}/read`, null, {
        headers: authHeaders(adminToken),
      });
      await axios.patch(`${API}/${messageId}/replied`, null, {
        headers: authHeaders(adminToken),
      });

      const detail = await axios.get(`${API}/${messageId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.status).toBe('REPLIED');
      expect(detail.data.repliedAt).not.toBeNull();
    });

    it('should reject replied from UNREAD state (invalid transition)', async () => {
      try {
        await axios.patch(`${API}/${unreadMsgId}/replied`, null, {
          headers: authHeaders(adminToken),
        });
        fail('Expected 400');
      } catch (err) {
        const e = err as AxiosError;
        expect(e.response?.status).toBe(400);
        expect((e.response?.data as Record<string, unknown>)?.errorCode).toBe('CONTACT_MESSAGE_INVALID_TRANSITION');
      }
    });

    it('should archive message', async () => {
      const archiveId = randomUUID();
      allSeeded.push(archiveId);
      await seedMessage(archiveId, { subject: 'Archive test' });

      await axios.patch(`${API}/${archiveId}/archive`, null, {
        headers: authHeaders(adminToken),
      });

      const detail = await axios.get(`${API}/${archiveId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.status).toBe('ARCHIVED');
      expect(detail.data.archivedAt).not.toBeNull();
    });

    it('should soft delete message and exclude from default list', async () => {
      const deleteId = randomUUID();
      allSeeded.push(deleteId);
      await seedMessage(deleteId, { subject: 'Delete test' });

      await axios.delete(`${API}/${deleteId}`, { headers: authHeaders(adminToken) });

      const detail = await axios.get(`${API}/${deleteId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.deletedAt).not.toBeNull();

      const list = await axios.get(API, {
        headers: authHeaders(adminToken),
        params: { page: 1, limit: 100 },
      });
      const found = list.data.data.find((m: { id: string }) => m.id === deleteId);
      expect(found).toBeUndefined();
    });

    it('should restore soft-deleted message', async () => {
      const restoreId = randomUUID();
      allSeeded.push(restoreId);
      await seedMessage(restoreId, { subject: 'Restore test' });

      await axios.delete(`${API}/${restoreId}`, { headers: authHeaders(adminToken) });
      await axios.patch(`${API}/${restoreId}/restore`, null, {
        headers: authHeaders(adminToken),
      });

      const detail = await axios.get(`${API}/${restoreId}`, {
        headers: authHeaders(adminToken),
      });
      expect(detail.data.deletedAt).toBeNull();
    });

    it('should return unread count', async () => {
      const res = await axios.get(`${API}/unread-count`, {
        headers: authHeaders(adminToken),
      });
      expect(res.status).toBe(200);
      expect(typeof res.data.unreadCount).toBe('number');
    });
  });

  // ── Auth Protection ───────────────────────────────────

  describe('Auth Protection', () => {
    it('should allow public submit without auth', async () => {
      const res = await axios.post(API, validPayload());
      expect(res.status).toBe(201);
    });

    it('should return 401 for admin list without auth', async () => {
      try {
        await axios.get(API, { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('should return 401 for get by ID without auth', async () => {
      try {
        await axios.get(`${API}/some-id`, { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('should return 401 for mark as read without auth', async () => {
      try {
        await axios.patch(`${API}/some-id/read`, null, { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('should return 401 for unread-count without auth', async () => {
      try {
        await axios.get(`${API}/unread-count`, { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });

    it('should return 401 for delete without auth', async () => {
      try {
        await axios.delete(`${API}/some-id`, { headers: { Authorization: '' } });
        fail('Expected 401');
      } catch (err) {
        expect((err as AxiosError).response?.status).toBe(401);
      }
    });
  });

  // ── Rate Limit Tests (LAST — these exhaust IP quota) ──

  describe('Rate Limiting', () => {
    it('should rate limit after excessive submissions from same email (3/hour)', async () => {
      const email = `e2e-ratelimit-${Date.now()}@test-safe.com`;
      const results: number[] = [];

      for (let i = 0; i < 5; i++) {
        try {
          const res = await axios.post(
            API,
            validPayload({ email, message: `Rate limit test message number ${i + 1} for E2E.` })
          );
          results.push(res.status);
        } catch (err) {
          results.push((err as AxiosError).response?.status ?? 0);
        }
      }

      // At least the first should succeed, and we should eventually hit a rate limit
      expect(results[0]).toBe(201);
      const rateLimited = results.filter((s) => s === 400 || s === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should enforce IP-based rate limiting', async () => {
      const results: number[] = [];

      for (let i = 0; i < 7; i++) {
        try {
          const res = await axios.post(
            API,
            validPayload({ message: `Throttle test message number ${i + 1} for E2E.` })
          );
          results.push(res.status);
        } catch (err) {
          results.push((err as AxiosError).response?.status ?? 0);
        }
      }

      // Should hit either 429 (ThrottlerGuard) or 400 (IP rate limit)
      const hasRateLimit = results.some((s) => s === 429 || s === 400);
      expect(hasRateLimit).toBe(true);
    });
  });
});
