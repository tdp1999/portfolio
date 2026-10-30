import axios, { AxiosError, Method } from 'axios';
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

// Expected values come from 'DT-3 Phân quyền', R8.5 and R2.2 of the medicine cabinet epic.

const API = '/api/medicine-cabinet';
const PREFIX = 'e2e-api-mc-';
// A Bearer value that is not a JWT, like the radar machine token (R8.5).
const MACHINE_TOKEN = 'radar-machine-token-not-a-jwt';

// ── Helpers ───────────────────────────────────────────────

async function login(email: string): Promise<string> {
  const res = await axios.post('/api/auth/login', { email, password: 'TestPass1!', rememberMe: false });
  return res.data.accessToken;
}

async function call(method: Method, url: string, token?: string, data?: unknown) {
  try {
    return await axios.request({ method, url, data, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch (error) {
    const response = (error as AxiosError).response;
    if (!response) throw error;
    return response;
  }
}

// Rows are removed by name, so global teardown can then delete the test accounts that created them.
async function cleanup(): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM medical_items WHERE name LIKE $1`, `${PREFIX}%`);
  await prisma.$executeRawUnsafe(`DELETE FROM health_profiles WHERE name LIKE $1`, `${PREFIX}%`);
}

const countItems = async (name: string) =>
  Number(
    (await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM medical_items WHERE name = $1`, name))[0]
      .n
  );

const ANY_ID = randomUUID();

// The four endpoint groups of 'DT-3 Phân quyền'. Bodies are valid, so only the guard decides.
const ENDPOINTS: { group: string; method: Method; url: string; body?: unknown }[] = [
  { group: 'read', method: 'GET', url: `${API}/items` },
  { group: 'read', method: 'GET', url: `${API}/items/${ANY_ID}` },
  { group: 'read', method: 'GET', url: `${API}/lookup` },
  { group: 'read', method: 'GET', url: `${API}/profiles` },
  {
    group: 'write item',
    method: 'POST',
    url: `${API}/items`,
    body: { kind: 'SUPPLY', name: `${PREFIX}x`, profileId: ANY_ID },
  },
  { group: 'write item', method: 'PATCH', url: `${API}/items/${ANY_ID}`, body: { name: `${PREFIX}x` } },
  { group: 'write item', method: 'DELETE', url: `${API}/items/${ANY_ID}` },
  { group: 'write person', method: 'POST', url: `${API}/profiles`, body: { name: `${PREFIX}x` } },
  { group: 'write person', method: 'PATCH', url: `${API}/profiles/${ANY_ID}`, body: { name: `${PREFIX}x` } },
  { group: 'write person', method: 'DELETE', url: `${API}/profiles/${ANY_ID}` },
];
const CELLS = ENDPOINTS.map((e) => [e.group, e.method, e.url, e.body] as const);

// ── Tests ─────────────────────────────────────────────────

describe('Medicine cabinet API', () => {
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    adminToken = await login('test-admin@e2e.local');
    userToken = await login('test-user@e2e.local');
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('DT-3 Phân quyền', () => {
    it.each(CELLS)('signed out: %s %s %s gives 401', async (_group, method, url, body) => {
      expect((await call(method, url, undefined, body)).status).toBe(401);
    });

    it.each(CELLS)('USER: %s %s %s gives 403', async (_group, method, url, body) => {
      expect((await call(method, url, userToken, body)).status).toBe(403);
    });

    it.each(CELLS)('R8.5 machine token: %s %s %s gives 401', async (_group, method, url, body) => {
      expect((await call(method, url, MACHINE_TOKEN, body)).status).toBe(401);
    });

    it('Owner (ADMIN): reads give 200 and writes give 2xx on every endpoint', async () => {
      const person = await call('POST', `${API}/profiles`, adminToken, { name: `${PREFIX}Mẹ` });
      expect(person.status).toBe(201);
      const profileId = person.data.id;

      const item = await call('POST', `${API}/items`, adminToken, {
        kind: 'SUPPLY',
        name: `${PREFIX}Băng gạc`,
        profileId,
      });
      expect(item.status).toBe(201);
      const itemId = item.data.id;

      for (const url of [`${API}/items`, `${API}/items/${itemId}`, `${API}/lookup`, `${API}/profiles`]) {
        expect({ url, status: (await call('GET', url, adminToken)).status }).toEqual({ url, status: 200 });
      }
      const writes: [Method, string, unknown?][] = [
        ['PATCH', `${API}/items/${itemId}`, { name: `${PREFIX}Băng gạc lớn` }],
        ['PATCH', `${API}/profiles/${profileId}`, { name: `${PREFIX}Mẹ ruột` }],
        ['DELETE', `${API}/items/${itemId}`],
        ['DELETE', `${API}/profiles/${profileId}`],
      ];
      for (const [method, url, body] of writes) {
        const { status } = await call(method, url, adminToken, body);
        expect({ method, url, ok: status >= 200 && status < 300 }).toEqual({ method, url, ok: true });
      }
    });
  });

  describe('R2.2 over HTTP', () => {
    it('R2.2: POST a supply "Băng gạc" with dose "1 miếng" gives 400 at dose and saves nothing', async () => {
      const person = await call('POST', `${API}/profiles`, adminToken, { name: `${PREFIX}Owner` });
      const name = `${PREFIX}Băng gạc R2.2`;
      const res = await call('POST', `${API}/items`, adminToken, {
        kind: 'SUPPLY',
        name,
        profileId: person.data.id,
        dose: '1 miếng',
      });
      expect(res.status).toBe(400);
      expect(Object.keys(res.data.data ?? {})).toEqual(['dose']);
      expect(await countItems(name)).toBe(0);
    });
  });
});
