import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the `/blog` archive page.
 *
 * Composition of the page (see `libs/landing/feature-blog/.../blog-list-page.html`):
 *   - hero (page-shell hero slot — H1 "Writing." + lede)
 *   - optional bento strip (V1 5+ featured · V3 3-4 featured · hidden < 3)
 *   - archive section:
 *       · toolbar: results-count + view-toggle (row/grid) + sort segmented (newest/oldest)
 *       · controls: search input + category chips
 *       · list (rows or grid) · loading spinner · empty state
 *       · pagination (only when total > pageSize)
 *
 * Selectors prefer semantic roles per AQA convention; CSS selectors are used
 * only where the markup exposes no role (`.blog-featured`, `.list-empty`,
 * etc.).
 */
export class BlogListPage {
  constructor(private readonly page: Page) {}

  async goto(query: string = ''): Promise<void> {
    const url = query ? `/blog?${query}` : '/blog';
    await this.page.goto(url);
    await this.page.waitForURL((u) => u.pathname === '/blog');
    await this.heroHeading.waitFor({ state: 'visible' });
    // The archive query is debounced + driven from a `toSignal`; wait for at
    // least one rendered row OR the empty state OR the loading spinner to
    // settle so subsequent assertions don't race the initial fetch.
    await this.page
      .locator('.list-row, .list-card, .list-empty, landing-loading-spinner')
      .first()
      .waitFor({ state: 'visible' });
  }

  // ── Hero ────────────────────────────────────────────────────────────

  get heroHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  // ── Bento strip (featured) ──────────────────────────────────────────

  /** Featured section wrapper. Hidden when fewer than 3 featured posts. */
  get featuredSection(): Locator {
    return this.page.locator('section.blog-featured');
  }
  get featuredV1(): Locator {
    return this.featuredSection.locator('.mag-v1');
  }
  get featuredV3(): Locator {
    return this.featuredSection.locator('.mag-v3');
  }
  /** All featured-strip post links across V1 + V3 layouts. */
  get featuredLinks(): Locator {
    return this.featuredSection.locator('a[href^="/blog/"]');
  }

  // ── Toolbar (sort + view) ──────────────────────────────────────────

  get resultsCount(): Locator {
    return this.page.locator('landing-results-count');
  }
  get sortNewestTab(): Locator {
    return this.page.getByRole('tab', { name: 'Newest' });
  }
  get sortOldestTab(): Locator {
    return this.page.getByRole('tab', { name: 'Oldest' });
  }
  get viewRowOption(): Locator {
    return this.page.getByRole('radio', { name: /row/i });
  }
  get viewGridOption(): Locator {
    return this.page.getByRole('radio', { name: /grid/i });
  }

  // ── Controls (search + chips) ──────────────────────────────────────

  get searchInput(): Locator {
    // `landing-input` forwards `placeholder` to its host, so we scope to the
    // search slot's inner native input to avoid strict-mode violations.
    return this.page.locator('.list-controls__search input');
  }

  /**
   * Fill the search input through `pressSequentially` so every character
   * fires a real `input` event that Angular's CVA picks up. `fill()` can
   * land before the control-value-accessor is wired up — typing avoids that
   * race, and `inputValue()` is reverified afterwards as a final guard.
   * The component debounces by 300ms; callers should still call
   * `waitForArchiveSettled()` after this to wait for the refetch.
   */
  async fillSearch(value: string): Promise<void> {
    const input = this.searchInput;
    await input.click();
    // Select-all to clear any prior value cleanly.
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.keyboard.press('Delete');
    await input.pressSequentially(value, { delay: 10 });
    const got = await input.inputValue();
    if (got !== value) {
      throw new Error(`Search input did not retain value "${value}" (got "${got}")`);
    }
  }
  /** Filter-chip "All" — clears category. */
  get chipAll(): Locator {
    return this.page.locator('.list-controls__chips').getByRole('button', { name: /^All$/ });
  }
  /** Filter chip for a given category name (case-sensitive, as rendered). */
  categoryChip(name: string): Locator {
    return this.page.locator('.list-controls__chips').getByRole('button', { name });
  }

  // ── Archive list ───────────────────────────────────────────────────

  /** Row links (default `view=row`). */
  get rowLinks(): Locator {
    return this.page.locator('a.list-row__link');
  }
  /** Grid card links (`view=grid`). */
  get cardLinks(): Locator {
    return this.page.locator('a.list-card__link');
  }
  /** Union of both row + grid layouts — use when the test doesn't care which view is active. */
  get archiveLinks(): Locator {
    return this.page.locator('a.list-row__link, a.list-card__link');
  }
  archiveLink(slug: string): Locator {
    return this.page.locator(`a.list-row__link[href$="/blog/${slug}"], a.list-card__link[href$="/blog/${slug}"]`);
  }

  get emptyState(): Locator {
    return this.page.locator('.list-empty');
  }
  get clearFiltersButton(): Locator {
    return this.emptyState.getByRole('button', { name: 'Clear filters' });
  }

  get loadingSpinner(): Locator {
    return this.page.locator('landing-loading-spinner');
  }

  get pagination(): Locator {
    return this.page.locator('landing-pagination');
  }

  /** Wait for any in-flight archive load (spinner-controlled, with 400ms min) to settle. */
  async waitForArchiveSettled(): Promise<void> {
    // Spinner enforces a 400ms min-display window. Use `hidden` with a generous
    // timeout — never `waitForTimeout`.
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10_000 });
  }

  // ── Assertion helpers ──────────────────────────────────────────────

  async expectArchiveContains(slug: string): Promise<void> {
    await expect(this.archiveLink(slug)).toBeVisible();
  }
  async expectArchiveOmits(slug: string): Promise<void> {
    await expect(this.archiveLink(slug)).toHaveCount(0);
  }
}
