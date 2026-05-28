import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for `/blog/:slug` (detail page).
 *
 * Composition of the page (see `libs/landing/feature-blog/.../blog-detail-page.html`):
 *   - breadcrumb (Home › Writing › <title>)
 *   - optional floating TOC `<aside class="blog-floating-toc">` (≥1280px desktop only;
 *     hidden when post category is `notes` or H2/H3 count < 3)
 *   - hero: H1 + excerpt dek + meta strip + eyebrow chips + share row + cover figure
 *   - inline TOC `<nav class="blog-toc-inline">` (same hide rule as floating)
 *   - prose body (`.blog-prose.landing-prose` with `[innerHTML]`)
 *   - footer: optional related-posts block + signature block
 *   - loading state · 404 ("Post not found") empty state
 */
export class BlogDetailPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string, options: { expectNotFound?: boolean } = {}): Promise<void> {
    await this.page.goto(`/blog/${slug}`);
    await this.page.waitForURL((u) => u.pathname === `/blog/${slug}`);
    if (options.expectNotFound) {
      await this.notFoundEmpty.waitFor({ state: 'visible' });
    } else {
      await this.heroHeading.waitFor({ state: 'visible' });
    }
  }

  // ── Hero ────────────────────────────────────────────────────────────

  get article(): Locator {
    return this.page.locator('article.blog-article');
  }
  get hero(): Locator {
    return this.page.locator('header.blog-hero');
  }
  get heroHeading(): Locator {
    return this.page.locator('h1.blog-hero__title');
  }
  get heroDek(): Locator {
    return this.page.locator('p.blog-hero__dek');
  }
  get heroMeta(): Locator {
    return this.page.locator('.blog-hero__meta');
  }
  /** Eyebrow chips inside the hero — postType, language code, primary category. */
  get heroChips(): Locator {
    return this.page.locator('.blog-hero__eyebrow landing-chip');
  }

  // ── Share row ──────────────────────────────────────────────────────

  get shareRow(): Locator {
    return this.page.locator('landing-blog-share-row');
  }
  get shareXLink(): Locator {
    return this.shareRow.getByRole('link', { name: 'Share on X' });
  }
  get shareLinkedInLink(): Locator {
    return this.shareRow.getByRole('link', { name: 'Share on LinkedIn' });
  }
  get copyLinkButton(): Locator {
    // Initial aria-label is "Copy link"; flips to "Link copied" after click.
    return this.shareRow.getByRole('button', { name: /Copy link|Link copied/ });
  }

  // ── TOC ────────────────────────────────────────────────────────────

  /** Inline TOC card (rendered inside the article, between hero and prose). */
  get inlineToc(): Locator {
    return this.page.locator('nav.blog-toc-inline');
  }
  /** Floating TOC anchored top-right (desktop ≥1280px). */
  get floatingToc(): Locator {
    return this.page.locator('aside.blog-floating-toc');
  }
  inlineTocLinks(): Locator {
    return this.inlineToc.locator('a[href^="#"]');
  }

  // ── Prose / cover ──────────────────────────────────────────────────

  get prose(): Locator {
    return this.page.locator('.blog-prose');
  }
  get coverFigure(): Locator {
    return this.page.locator('.blog-hero__figure landing-figure');
  }

  // ── Footer (related + signature) ───────────────────────────────────

  get relatedBlock(): Locator {
    return this.page.locator('section.related-block');
  }
  get relatedCards(): Locator {
    return this.relatedBlock.locator('a.related-card');
  }
  get signature(): Locator {
    return this.page.locator('aside.blog-signature');
  }

  // ── States ─────────────────────────────────────────────────────────

  get notFoundEmpty(): Locator {
    return this.page.locator('section.blog-not-found landing-empty-state');
  }
  get loadingSpinner(): Locator {
    return this.page.locator('section.blog-loading landing-loading-spinner');
  }

  // ── Assertion helpers ──────────────────────────────────────────────

  /** True when *neither* the inline nor the floating TOC is attached. */
  async expectNoTocRendered(): Promise<void> {
    await expect(this.inlineToc).toHaveCount(0);
    await expect(this.floatingToc).toHaveCount(0);
  }
}
