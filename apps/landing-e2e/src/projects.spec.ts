import { test, expect } from '@playwright/test';
import axios from 'axios';

const API = 'http://localhost:3000';
const PREFIX = 'e2e-landing-proj-';

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function validPayload(title: string, overrides: Record<string, unknown> = {}) {
  return {
    title,
    oneLiner: { en: `${title} one-liner`, vi: `${title} gioi thieu` },
    description: { en: `${title} description`, vi: `${title} mo ta` },
    motivation: { en: `${title} motivation`, vi: `${title} dong luc` },
    role: { en: 'Developer', vi: 'Lap trinh vien' },
    startDate: '2024-01-01T00:00:00.000Z',
    skillIds: [],
    imageIds: [],
    highlights: [],
    ...overrides,
  };
}

test.describe('Landing - Projects', () => {
  test.describe.configure({ mode: 'serial' });

  let adminToken: string;
  let projectSlug: string;

  test.beforeAll(async () => {
    // Login
    const res = await axios.post(`${API}/api/auth/login`, {
      email: 'test-admin@e2e.local',
      password: 'TestPass1!',
      rememberMe: false,
    });
    adminToken = res.data.accessToken;

    // Cleanup leftover test projects (including soft-deleted)
    const list = await axios.get(`${API}/api/projects/admin/list`, {
      headers: authHeaders(adminToken),
      params: { includeDeleted: true },
    });
    const testProjects = list.data.data.filter((p: { title: string }) => p.title.startsWith(PREFIX));
    for (const p of testProjects) {
      if (p.deletedAt) {
        await axios.patch(
          `${API}/api/projects/${p.id}/restore`,
          {},
          {
            headers: authHeaders(adminToken),
          }
        );
      }
      await axios.delete(`${API}/api/projects/${p.id}`, {
        headers: authHeaders(adminToken),
      });
    }

    // Create and publish a project with highlights
    const createRes = await axios.post(
      `${API}/api/projects`,
      validPayload(`${PREFIX}showcase`, {
        highlights: [
          {
            challenge: { en: 'Challenge EN', vi: 'Thach thuc' },
            approach: { en: 'Approach EN', vi: 'Cach tiep can' },
            outcome: { en: 'Outcome EN', vi: 'Ket qua' },
            codeUrl: null,
          },
        ],
        sourceUrl: 'https://github.com/example/test',
      }),
      { headers: authHeaders(adminToken) }
    );
    const projectId = createRes.data.id;

    // Publish
    await axios.put(`${API}/api/projects/${projectId}`, { status: 'PUBLISHED' }, { headers: authHeaders(adminToken) });

    // Get slug
    const adminList = await axios.get(`${API}/api/projects/admin/list`, {
      headers: authHeaders(adminToken),
    });
    const proj = adminList.data.data.find((p: { title: string }) => p.title === `${PREFIX}showcase`);
    projectSlug = proj.slug;
  });

  // ── List page ─────────────────────────────────────────

  test('/projects page renders with project rows', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL('**/projects');

    await expect(page.getByRole('heading', { name: 'Projects', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: `${PREFIX}showcase` })).toBeVisible();
  });

  test('project row shows one-liner and date', async ({ page }) => {
    await page.goto('/projects');

    const row = page.locator('a').filter({ hasText: `${PREFIX}showcase` });
    await expect(row).toBeVisible();
    await expect(row.getByText(`${PREFIX}showcase one-liner`)).toBeVisible();
  });

  test('click project row → navigates to detail page', async ({ page }) => {
    await page.goto('/projects');

    await page
      .locator('a')
      .filter({ hasText: `${PREFIX}showcase` })
      .click();
    await page.waitForURL(`**/projects/${projectSlug}`);

    await expect(page.getByRole('heading', { name: `${PREFIX}showcase`, level: 1 })).toBeVisible();
  });

  // ── Detail page ───────────────────────────────────────

  test('detail page renders title, motivation, overview', async ({ page }) => {
    await page.goto(`/projects/${projectSlug}`);

    await expect(page.getByRole('heading', { name: `${PREFIX}showcase` })).toBeVisible();
    await expect(page.getByText(`${PREFIX}showcase one-liner`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why I built this' })).toBeVisible();
    await expect(page.getByText(`${PREFIX}showcase motivation`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('detail page renders technical highlights', async ({ page }) => {
    await page.goto(`/projects/${projectSlug}`);

    await expect(page.getByRole('heading', { name: 'Technical Highlights' })).toBeVisible();
    await expect(page.getByText('Challenge EN')).toBeVisible();
    await expect(page.getByText('Approach EN')).toBeVisible();
    await expect(page.getByText('Outcome EN')).toBeVisible();
  });

  test('detail page shows source link', async ({ page }) => {
    await page.goto(`/projects/${projectSlug}`);

    const sourceLink = page.getByRole('link', { name: 'Source' });
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toHaveAttribute('href', 'https://github.com/example/test');
  });

  test('non-existent slug → project not found', async ({ page }) => {
    await page.goto('/projects/non-existent-slug-xyz');

    await expect(page.getByText('Project not found')).toBeVisible();
  });
});
