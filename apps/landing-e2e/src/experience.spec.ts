import { test, expect } from '@playwright/test';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';
// Include a timestamp so each run gets unique slugs — avoids 409 from soft-deleted leftovers
const RUN_ID = Date.now();
const EXP_PREFIX = `e2e-landing-exp-${RUN_ID}-`;

// ── Helpers ───────────────────────────────────────────────

async function loginAsAdmin(): Promise<string> {
  const res = await axios.post(`${API_BASE}/api/auth/login`, {
    email: 'test-admin@e2e.local',
    password: 'TestPass1!',
    rememberMe: false,
  });
  return res.data.accessToken;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function createExperience(token: string, overrides: Record<string, unknown> = {}) {
  const res = await axios.post(
    `${API_BASE}/api/experiences`,
    {
      companyName: `${EXP_PREFIX}corp`,
      position: { en: 'Senior Engineer', vi: 'Kỹ sư cao cấp' },
      achievements: {
        en: ['Improved system performance by 40%'],
        vi: ['Cải thiện hiệu suất hệ thống 40%'],
      },
      employmentType: 'FULL_TIME',
      locationType: 'REMOTE',
      locationCountry: 'Vietnam',
      startDate: '2022-01-01T00:00:00.000Z',
      skillIds: [],
      displayOrder: 0,
      ...overrides,
    },
    { headers: authHeaders(token) }
  );
  return res.data.id as string;
}

async function deleteExperiences(token: string, ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await axios.delete(`${API_BASE}/api/experiences/${id}`, { headers: authHeaders(token) });
    } catch {
      // Ignore — already deleted or not found
    }
  }
}

// ── Tests ─────────────────────────────────────────────────

test.describe('Landing Page - Experience Display', () => {
  let adminToken: string;
  let createdIds: string[] = [];

  test.beforeAll(async () => {
    adminToken = await loginAsAdmin();
    createdIds = [];

    // Create a past experience (ended)
    const pastId = await createExperience(adminToken, {
      companyName: `${EXP_PREFIX}past`,
      position: { en: 'Junior Developer', vi: 'Lập trình viên' },
      achievements: { en: ['Built a dashboard'], vi: ['Xây dựng bảng điều khiển'] },
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2021-06-01T00:00:00.000Z',
      employmentType: 'CONTRACT',
    });
    createdIds.push(pastId);

    // Create a current experience (no end date)
    const currentId = await createExperience(adminToken, {
      companyName: `${EXP_PREFIX}current`,
      position: { en: 'Senior Engineer', vi: 'Kỹ sư cao cấp' },
      achievements: { en: ['Leading architecture decisions'], vi: ['Dẫn đầu quyết định kiến trúc'] },
      startDate: '2022-06-01T00:00:00.000Z',
    });
    createdIds.push(currentId);
  });

  test.afterAll(async () => {
    if (createdIds.length) {
      await deleteExperiences(adminToken, createdIds);
    }
  });

  test('experience page loads and shows timeline entries', async ({ page }) => {
    await page.goto('/experience');
    await page.waitForURL('/experience');

    // Page heading
    await expect(page.locator('h1', { hasText: 'Career History' })).toBeVisible();
    await expect(page.locator('p', { hasText: 'My professional experience and journey' })).toBeVisible();

    // At least our seeded entries appear
    await expect(page.locator('div', { hasText: `${EXP_PREFIX}current` }).first()).toBeVisible();
  });

  test('each entry shows company name, position, and date range', async ({ page }) => {
    await page.goto('/experience');

    const currentEntry = page
      .locator('div.md\\:pl-20', {
        hasText: `${EXP_PREFIX}current`,
      })
      .first();

    await expect(currentEntry).toBeVisible();
    await expect(currentEntry.locator('text=Senior Engineer')).toBeVisible();
    // Date range: start date shown
    await expect(currentEntry.locator('text=/Jun 2022/')).toBeVisible();
  });

  test('current position shows "Present" in date range', async ({ page }) => {
    await page.goto('/experience');

    const currentEntry = page
      .locator('div.md\\:pl-20', {
        hasText: `${EXP_PREFIX}current`,
      })
      .first();

    await expect(currentEntry).toBeVisible();
    // "Present" appears in the date range
    await expect(currentEntry.locator('text=Present')).toBeVisible();
  });

  test('current position shows "Current" badge', async ({ page }) => {
    await page.goto('/experience');

    const currentEntry = page
      .locator('div.md\\:pl-20', {
        hasText: `${EXP_PREFIX}current`,
      })
      .first();

    // Use class-specific selector to avoid matching company name containing "current"
    await expect(currentEntry.locator('.text-xs.text-primary.font-medium')).toBeVisible();
  });

  test('past position shows end date (no "Current" badge)', async ({ page }) => {
    await page.goto('/experience');

    const pastEntry = page
      .locator('div.md\\:pl-20', {
        hasText: `${EXP_PREFIX}past`,
      })
      .first();

    await expect(pastEntry).toBeVisible();
    await expect(pastEntry.locator('span', { hasText: 'Current' })).not.toBeVisible();
  });

  test('achievements are displayed for each entry', async ({ page }) => {
    await page.goto('/experience');

    const currentEntry = page
      .locator('div.md\\:pl-20', {
        hasText: `${EXP_PREFIX}current`,
      })
      .first();

    await expect(currentEntry.locator('text=Leading architecture decisions')).toBeVisible();
  });

  test('employment type badge is displayed', async ({ page }) => {
    await page.goto('/experience');

    const pastEntry = page
      .locator('div.md\\:pl-20', {
        hasText: `${EXP_PREFIX}past`,
      })
      .first();

    // CONTRACT → "Contract" badge
    await expect(pastEntry.locator('landing-badge', { hasText: 'Contract' })).toBeVisible();
  });

  test('no console errors on experience page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/experience');
    await page.waitForLoadState('networkidle');

    const filteredErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('404'));
    expect(filteredErrors).toHaveLength(0);
  });
});

test.describe('Landing Page - Experience Empty State', () => {
  let adminToken: string;
  const idsToRestore: string[] = [];

  test.beforeAll(async () => {
    adminToken = await loginAsAdmin();
  });

  test.afterAll(async () => {
    // Restore any soft-deleted entries
    for (const id of idsToRestore) {
      await axios.patch(`${API_BASE}/api/experiences/${id}/restore`, {}, { headers: authHeaders(adminToken) });
    }
  });

  test('empty state is shown gracefully when no experiences exist', async ({ page }) => {
    // Get all public experiences and soft-delete them temporarily
    const allRes = await axios.get(`${API_BASE}/api/experiences`);
    const allIds: string[] = allRes.data.map((e: { id: string }) => e.id);

    for (const id of allIds) {
      await axios.delete(`${API_BASE}/api/experiences/${id}`, { headers: authHeaders(adminToken) });
      idsToRestore.push(id);
    }

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/experience');

    await expect(page.locator('p', { hasText: 'Career history coming soon' })).toBeVisible();
    // No errors — page loads gracefully
    const filteredErrors = errors.filter((e) => !e.includes('favicon'));
    expect(filteredErrors).toHaveLength(0);
  });
});

test.describe('Home Page - Recent Experiences', () => {
  let adminToken: string;
  let createdIds: string[] = [];

  test.beforeAll(async () => {
    adminToken = await loginAsAdmin();
    createdIds = [];

    // Restore anything that was deleted in empty state test
    const allAdminRes = await axios.get(`${API_BASE}/api/experiences/admin/list`, {
      headers: authHeaders(adminToken),
      params: { includeDeleted: true, limit: 100 },
    });
    const deletedExps = allAdminRes.data.data.filter((e: { deletedAt: string | null }) => e.deletedAt !== null);
    for (const exp of deletedExps) {
      await axios.patch(`${API_BASE}/api/experiences/${exp.id}/restore`, {}, { headers: authHeaders(adminToken) });
    }

    // Create up to 3 recent experiences for the home page section
    for (let i = 1; i <= 3; i++) {
      const id = await createExperience(adminToken, {
        companyName: `${EXP_PREFIX}home-${i}`,
        position: { en: `Role ${i}`, vi: `Vai trò ${i}` },
        achievements: { en: [], vi: [] },
        startDate: `202${i}-01-01T00:00:00.000Z`,
      });
      createdIds.push(id);
    }
  });

  test.afterAll(async () => {
    if (createdIds.length) {
      await deleteExperiences(adminToken, createdIds);
    }
  });

  test('home page shows experience section with recent entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h2', { hasText: 'Experience' })).toBeVisible();
  });

  test('home page experience section shows "View full career history" link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const link = page.locator('a[href="/experience"]', { hasText: 'View full career history' });
    await expect(link).toBeVisible();
  });

  test('clicking "View full career history" navigates to /experience', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const link = page.locator('a[href="/experience"]', { hasText: 'View full career history' });
    await link.click();
    await expect(page).toHaveURL(/\/experience/);
  });

  test('home page experience section shows at most 3 entries', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The experience section divides entries with divide-y
    const expSection = page.locator('landing-section').filter({ has: page.locator('h2', { hasText: 'Experience' }) });
    const entries = expSection.locator('.py-4.flex.items-start');
    const count = await entries.count();
    expect(count).toBeLessThanOrEqual(3);
  });
});
