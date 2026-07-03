import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import axios from 'axios';
import { AboutPage } from './pages/about.page';

// One file = one worker. Two reasons:
//  1. `beforeAll` seeds two experiences via the API. Parallel workers would
//     each seed their own copies and pollute every other worker's view of the
//     Experience section (extra tabs, wrong default-open item).
//  2. `/api/auth/login` is rate-limited; multiple workers logging in in lock-
//     step trip the limiter and bounce with 429.
test.describe.configure({ mode: 'serial' });

const API_BASE = 'http://localhost:3000';
const RUN_ID = Date.now();
const EXP_PREFIX = `e2e-landing-exp-${RUN_ID}-`;
const COMPANY_CURRENT = `${EXP_PREFIX}current`;
const COMPANY_PAST = `${EXP_PREFIX}past`;

/**
 * The API rate-limits `/api/auth/login`. With Playwright's default parallel
 * workers, every worker hits `beforeAll` at the same moment and the burst
 * trips the limiter on at least one worker. Retry with linear backoff so a
 * spurious 429 doesn't fail an otherwise-green spec.
 */
async function loginAsAdmin(): Promise<string> {
  const maxAttempts = 5;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: 'test-admin@e2e.local',
        password: 'TestPass1!',
        rememberMe: false,
      });
      return res.data.accessToken;
    } catch (err) {
      lastErr = err;
      const status = axios.isAxiosError(err) ? err.response?.status : 0;
      if (status !== 429) throw err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastErr;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// A single editor document carrying `text` — experience highlights are rich-text now
// (legacy plain string-array `highlights` dropped in task 363); the server canonicalizes
// each locale's `highlightsJson`, and the landing renders it via <rte-render>.
function hlDoc(text: string) {
  return {
    schemaVersion: 1,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
  };
}

async function createExperience(token: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await axios.post(
    `${API_BASE}/api/experiences`,
    {
      companyName: `${EXP_PREFIX}corp`,
      position: { en: 'Senior Engineer', vi: 'Kỹ sư cao cấp' },
      highlightsJson: {
        en: hlDoc('Improved system performance by 40%'),
        vi: hlDoc('Cải thiện hiệu suất hệ thống 40%'),
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

async function deleteExperiences(token: string, ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    try {
      await axios.delete(`${API_BASE}/api/experiences/${id}`, { headers: authHeaders(token) });
    } catch {
      // already gone — fine
    }
  }
}

/**
 * Collects `console.error` messages emitted during the test for a final
 * assertion. Hooked once per test before navigation so initial-render errors
 * are captured. Favicon / 404 noise is filtered the same way the existing
 * specs do — the goal is "no app errors", not "no network noise".
 */
function trackConsoleErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return { errors };
}
function filterNoise(errors: readonly string[]): string[] {
  return errors.filter((e) => !/favicon|404/i.test(e));
}

// ════════════════════════════════════════════════════════════════════════════
// Seeded experience data — shared across every describe in this file.
// ════════════════════════════════════════════════════════════════════════════
let adminToken: string;
const createdIds: string[] = [];

test.beforeAll(async () => {
  adminToken = await loginAsAdmin();

  // "Current" role — no endDate, so it sorts first and lands in tab[0].
  createdIds.push(
    await createExperience(adminToken, {
      companyName: COMPANY_CURRENT,
      position: { en: 'Senior Engineer', vi: 'Kỹ sư cao cấp' },
      highlightsJson: {
        en: hlDoc('Led architecture decisions across 4 squads.'),
        vi: hlDoc('Dẫn dắt các quyết định kiến trúc qua 4 squad.'),
      },
      startDate: '2023-06-01T00:00:00.000Z',
    })
  );

  // "Past" role — older, ended — second tab.
  createdIds.push(
    await createExperience(adminToken, {
      companyName: COMPANY_PAST,
      position: { en: 'Mid-level Developer', vi: 'Lập trình viên middle' },
      highlightsJson: {
        en: hlDoc('Shipped a dashboard that cut report time 6h → 12m.'),
        vi: hlDoc('Ship dashboard rút thời gian báo cáo từ 6 giờ xuống 12 phút.'),
      },
      employmentType: 'CONTRACT',
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2022-12-31T00:00:00.000Z',
    })
  );
});

test.afterAll(async () => {
  if (createdIds.length) {
    await deleteExperiences(adminToken, createdIds);
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Section structure — every anchored sub-section is rendered.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /about - structure', () => {
  test('all four anchored sections render with their anchor ids', async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    const about = new AboutPage(page);
    await about.goto();

    await expect.soft(about.heroHeading).toBeVisible();
    await expect.soft(about.experienceSection).toBeAttached();
    await expect.soft(about.howIThinkSection).toBeAttached();
    await expect.soft(about.failuresSection).toBeAttached();
    await expect.soft(about.ctaSection).toBeAttached();

    // Manifesto + failures content actually rendered, not just empty shells.
    await expect.soft(about.principles.first()).toBeVisible();
    await expect.soft(about.failureCards).toHaveCount(3);

    expect(filterNoise(errors)).toHaveLength(0);
  });

  test('document title is locale-aware (EN default)', async ({ page }) => {
    const about = new AboutPage(page);
    await about.goto();
    await expect(page).toHaveTitle('About — Phương Trần');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Desktop tab interaction (viewport ≥ 1024px).
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /about - experience tabs (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('clicking a tab updates the visible panel to that company', async ({ page }) => {
    const about = new AboutPage(page);
    await about.goto();

    // Other parallel workers + real seed data can add extra tabs — assert
    // that ours are present rather than the exact total count.
    const tabCurrent = about.experienceTab(COMPANY_CURRENT);
    const tabPast = about.experienceTab(COMPANY_PAST);
    await expect(tabCurrent).toBeVisible();
    await expect(tabPast).toBeVisible();

    // Switch to the past role. The panel should re-render with its position.
    await tabPast.click();
    await expect(tabPast).toHaveAttribute('aria-selected', 'true');
    await expect(about.visibleExperiencePanel).toContainText('Mid-level Developer');
    await expect(about.visibleExperiencePanel).toContainText(COMPANY_PAST);

    // And back — the original highlight should still be there.
    await tabCurrent.click();
    await expect(about.visibleExperiencePanel).toContainText('Led architecture decisions across 4 squads.');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Mobile accordion interaction (viewport ≤ 767px).
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /about - experience accordion (mobile)', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('first item is open by default; toggling switches the open item', async ({ page }) => {
    const about = new AboutPage(page);
    await about.goto();

    const triggers = about.accordionTriggers;
    const first = triggers.first();
    await expect(first).toHaveAttribute('aria-expanded', 'true');

    // Open OUR seeded "past" entry — whatever was open before must close
    // (single-open accordion contract).
    const triggerPast = about.accordionTrigger(COMPANY_PAST);
    await triggerPast.click();
    await expect(triggerPast).toHaveAttribute('aria-expanded', 'true');
    await expect(first).toHaveAttribute('aria-expanded', 'false');

    // Click the open trigger again to collapse it — no panel open.
    await triggerPast.click();
    await expect(triggerPast).toHaveAttribute('aria-expanded', 'false');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// /experience → /about#experience redirect.
//
// In dev (`ng serve`) the Express SSR layer is not in front, so the 301 is
// served by the Angular SPA via `redirectTo`. We verify the *outcome* — final
// URL + fragment — which holds for both transports. A pure status-code probe
// would only pass against the production SSR bundle and is therefore left to
// the SEO smoke run.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /experience redirect', () => {
  test('navigating to /experience lands on /about with the #experience fragment', async ({ page }) => {
    await page.goto('/experience');
    await page.waitForURL((url) => url.pathname === '/about');
    expect(page.url()).toMatch(/\/about#experience$/);
    // And the section it anchors to is actually present on the page.
    await expect(page.locator('section#experience')).toBeAttached();
  });

  test('production SSR returns a real 301 (when reachable)', async ({ request }: { request: APIRequestContext }) => {
    // Probe the production landing origin if it's been wired up; otherwise
    // skip cleanly so dev runs don't fail on missing infrastructure.
    const prodOrigin = process.env['LANDING_PROD_ORIGIN'];
    test.skip(!prodOrigin, 'LANDING_PROD_ORIGIN not set — skipping prod 301 probe.');

    const res = await request.get(`${prodOrigin}/experience`, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()['location']).toMatch(/\/about#experience$/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Locale switch EN ↔ VI updates the rendered text in every authored section.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /about - locale switch', () => {
  test('rendering in EN vs VI swaps hero, manifesto, failures heading, and title', async ({ page, context }) => {
    // EN baseline.
    const aboutEn = new AboutPage(page);
    await aboutEn.goto();
    const heroEn = (await aboutEn.heroHeading.textContent())?.trim() ?? '';
    const principleEn = (await aboutEn.principles.first().locator('.hit__claim').textContent())?.trim() ?? '';
    expect(heroEn).toMatch(/Senior software engineer/i);
    expect(principleEn.length).toBeGreaterThan(0);

    // VI render in a fresh page that pre-seeds the locale before bootstrap.
    const viPage = await context.newPage();
    const aboutVi = new AboutPage(viPage);
    await aboutVi.presetLocale('vi');
    await aboutVi.goto();

    await expect(aboutVi.heroHeading).not.toHaveText(heroEn);
    await expect(aboutVi.principles.first().locator('.hit__claim')).not.toHaveText(principleEn);
    await expect(aboutVi.failuresSection.getByRole('heading')).toContainText(/Ba ghi chú|lâm sàng/);
    await expect(viPage).toHaveTitle('Về tôi — Phương Trần');

    await viPage.close();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// CTA section — contact link points to /contact, plus no console errors during
// a full golden-path scroll of the page.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /about - CTA & golden path', () => {
  test('contact CTA targets /contact', async ({ page }) => {
    const about = new AboutPage(page);
    await about.goto();
    await expect(about.contactLink).toHaveAttribute('href', '/contact');
  });

  test('scrolling through the page produces no console errors', async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    const about = new AboutPage(page);
    await about.goto();

    // Walk through each section so any lazy work (intersection observers,
    // scrollspy, lazy-loaded images) gets a chance to fire.
    for (const id of ['experience', 'how-i-think', 'failures', 'cta']) {
      await page.locator(`section#${id}`).scrollIntoViewIfNeeded();
    }
    await page.waitForLoadState('networkidle');

    expect(filterNoise(errors)).toHaveLength(0);
  });
});
