import { test, expect, type Page } from '@playwright/test';
import { BlogListPage } from './pages/blog-list.page';
import { BLOG_SLUGS, BLOG_TITLES, UNIQUE_SEED_SEARCH } from './fixtures/blog-seed';

function trackConsoleErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return { errors };
}
function filterNoise(errors: readonly string[]): string[] {
  return errors.filter((e) => !/favicon|404|net::ERR_/i.test(e));
}

// ════════════════════════════════════════════════════════════════════════════
// Initial render — hero + at least one archive row, plus the bento strip
// behavior matches the live featured-count from the public API.
//
// The dev DB carries real production-shaped content alongside the
// `seed-*`-prefixed fixtures, so we can't assume any specific seed slug is
// on page 1; we assert structural invariants instead.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - initial render', () => {
  test('renders the hero, at least one archive row, and no console errors', async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    const list = new BlogListPage(page);
    await list.goto();

    await expect(list.heroHeading).toContainText('Writing');
    await list.waitForArchiveSettled();
    await expect(list.archiveLinks.first()).toBeVisible();

    expect(filterNoise(errors)).toHaveLength(0);
  });

  test('document title is set to the writing page title', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto();
    await expect(page).toHaveTitle('Writing | Phuong Tran');
  });

  test('bento strip visibility tracks the public featured-posts API', async ({ page, request }) => {
    const featuredRes = await request.get('http://localhost:3000/api/blog/featured');
    const featured = (await featuredRes.json()) as Array<{ slug: string }>;
    const count = featured.length;

    const list = new BlogListPage(page);
    await list.goto();
    await list.waitForArchiveSettled();

    if (count < 3) {
      // STRIP_MIN = 3 in BlogListPage — below it the section is suppressed.
      await expect(list.featuredSection).toHaveCount(0);
    } else if (count < 5) {
      // 3-4 featured → V3 mosaic.
      await expect(list.featuredSection).toBeVisible();
      await expect(list.featuredV3).toBeVisible();
      await expect(list.featuredV1).toHaveCount(0);
    } else {
      // 5+ featured → V1 asymmetric.
      await expect(list.featuredSection).toBeVisible();
      await expect(list.featuredV1).toBeVisible();
      await expect(list.featuredV3).toHaveCount(0);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Search → debounced filter + URL mirror.
// Uses a title-unique seed string so the assertion holds regardless of how
// many other posts are in the DB.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - search', () => {
  test('typing a unique title fragment narrows to the matching seed post', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto();
    await list.waitForArchiveSettled();

    await list.fillSearch(UNIQUE_SEED_SEARCH.NOTE_EN_POSTGRES);
    await list.waitForArchiveSettled();

    await list.expectArchiveContains(BLOG_SLUGS.NOTE_EN_POSTGRES);
    // The narrowing collapses results to (effectively) one row.
    await expect(list.archiveLinks).toHaveCount(1);

    // Angular's URL serializer may use + or %20 for spaces — just assert the param key.
    await expect(page).toHaveURL(/[?&]search=/);
    expect(decodeURIComponent(page.url())).toContain(UNIQUE_SEED_SEARCH.NOTE_EN_POSTGRES);
  });

  test('empty search results show the empty-state with a Clear-filters reset', async ({ page }) => {
    // Drive the search via URL rather than typing — `BlogListPage` mirrors the
    // initial `?search=` query param into `searchControl` on construction, so
    // this exercises the same archive-empty branch without racing the CVA's
    // value-accessor wiring (Angular CD vs Playwright `pressSequentially`).
    const list = new BlogListPage(page);
    await list.goto('search=this-title-does-not-exist-zz-12345');
    await list.waitForArchiveSettled();

    await expect(list.emptyState).toBeVisible();
    await expect(list.clearFiltersButton).toBeVisible();

    await list.clearFiltersButton.click();
    await list.waitForArchiveSettled();
    await expect(list.emptyState).toHaveCount(0);
    await expect(list.archiveLinks.first()).toBeVisible();
    await expect(page).not.toHaveURL(/[?&]search=/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Category chip filter — picks `Notes`, asserts seed-note slugs are present
// and an engineering-only seed slug is absent.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - category filter', () => {
  test('clicking Notes narrows the archive to notes-category posts and writes ?category=notes', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto();
    await list.waitForArchiveSettled();

    await list.categoryChip('Notes').click();
    await list.waitForArchiveSettled();

    await list.expectArchiveContains(BLOG_SLUGS.NOTE_EN_POSTGRES);
    await list.expectArchiveContains(BLOG_SLUGS.NOTE_VI_RXJS);
    // Seed deep-dive is engineering — must be excluded by the notes filter.
    await list.expectArchiveOmits(BLOG_SLUGS.DEEP_DIVE_SSR);

    await expect(page).toHaveURL(/[?&]category=notes/);
    await expect(list.categoryChip('Notes')).toHaveAttribute('aria-pressed', 'true');

    // Clicking again clears the filter — URL param dropped.
    await list.categoryChip('Notes').click();
    await list.waitForArchiveSettled();
    await expect(page).not.toHaveURL(/[?&]category=/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Sort toggle (newest ↔ oldest) — URL mirror + relative ordering of two
// seed slugs within a narrowed (notes) view.
// Seed publish dates: seed-til-postgres = 2026-04-20, seed-vi-rxjs = 2025-11-05
// so any 'oldest' sort places vi-rxjs strictly before til-postgres.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - sort', () => {
  test('switching to Oldest writes ?sort=oldest and reorders two seed notes correctly', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto('category=notes');
    await list.waitForArchiveSettled();

    const newestPostgresIdx = await indexOfHref(list.archiveLinks, BLOG_SLUGS.NOTE_EN_POSTGRES);
    const newestRxjsIdx = await indexOfHref(list.archiveLinks, BLOG_SLUGS.NOTE_VI_RXJS);
    expect(newestPostgresIdx).toBeGreaterThanOrEqual(0);
    expect(newestRxjsIdx).toBeGreaterThanOrEqual(0);
    // Newest first: postgres (Apr 2026) is more recent than rxjs (Nov 2025).
    expect(newestPostgresIdx).toBeLessThan(newestRxjsIdx);

    await list.sortOldestTab.click();
    await list.waitForArchiveSettled();
    await expect(page).toHaveURL(/[?&]sort=oldest/);

    const oldestPostgresIdx = await indexOfHref(list.archiveLinks, BLOG_SLUGS.NOTE_EN_POSTGRES);
    const oldestRxjsIdx = await indexOfHref(list.archiveLinks, BLOG_SLUGS.NOTE_VI_RXJS);
    expect(oldestRxjsIdx).toBeLessThan(oldestPostgresIdx);

    await list.sortNewestTab.click();
    await list.waitForArchiveSettled();
    await expect(page).not.toHaveURL(/[?&]sort=/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// View toggle (row ↔ grid).
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - view toggle', () => {
  test('switching to Grid swaps the layout and writes ?view=grid', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto();
    await list.waitForArchiveSettled();

    await expect(list.rowLinks.first()).toBeVisible();
    await expect(list.cardLinks).toHaveCount(0);

    await list.viewGridOption.click();

    await expect(list.cardLinks.first()).toBeVisible();
    await expect(list.rowLinks).toHaveCount(0);
    await expect(page).toHaveURL(/[?&]view=grid/);

    await list.viewRowOption.click();
    await expect(list.rowLinks.first()).toBeVisible();
    await expect(page).not.toHaveURL(/[?&]view=/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// URL → UI rehydration on reload.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - filter persistence', () => {
  test('refreshing a filtered URL restores the toolbar state from query params', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto('category=notes&sort=oldest&view=grid');
    await list.waitForArchiveSettled();

    await expect(list.categoryChip('Notes')).toHaveAttribute('aria-pressed', 'true');
    await expect(list.sortOldestTab).toHaveAttribute('aria-selected', 'true');
    await expect(list.cardLinks.first()).toBeVisible();
    await list.expectArchiveContains(BLOG_SLUGS.NOTE_EN_POSTGRES);
    await list.expectArchiveContains(BLOG_SLUGS.NOTE_VI_RXJS);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Click-through → /blog/:slug.
// Uses search to surface a single known seed post, then clicks it.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog - click-through', () => {
  test('clicking a row navigates to the matching detail page', async ({ page }) => {
    const list = new BlogListPage(page);
    await list.goto();
    await list.waitForArchiveSettled();

    await list.fillSearch(UNIQUE_SEED_SEARCH.NOTE_EN_POSTGRES);
    await list.waitForArchiveSettled();

    await list.archiveLink(BLOG_SLUGS.NOTE_EN_POSTGRES).click();
    await page.waitForURL(`**/blog/${BLOG_SLUGS.NOTE_EN_POSTGRES}`);
    await expect(page.getByRole('heading', { level: 1, name: BLOG_TITLES.NOTE_EN_POSTGRES })).toBeVisible();
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function indexOfHref(locator: import('@playwright/test').Locator, slug: string): Promise<number> {
  const hrefs = await locator.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''));
  return hrefs.findIndex((h) => h.endsWith(`/blog/${slug}`));
}
