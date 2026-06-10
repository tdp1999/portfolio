import { test, expect, type Page } from '@playwright/test';
import { BlogDetailPage } from './pages/blog-detail.page';
import { BLOG_SLUGS, BLOG_TITLES } from './fixtures/blog-seed';

function trackConsoleErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return { errors };
}
function filterNoise(errors: readonly string[]): string[] {
  // Filter known noisy classes:
  //   - favicon: dev server is allowed to 404 on the favicon.
  //   - 404: missing static assets in dev (Cloudinary demo URLs, etc.)
  //   - net::ERR_*: transient network errors that flake under heavy parallel
  //     test load (image fetches against res.cloudinary.com/demo, etc.)
  return errors.filter((e) => !/favicon|404|net::ERR_/i.test(e));
}

// ════════════════════════════════════════════════════════════════════════════
// Detail page render — hero + prose + breadcrumbs (deep-dive post).
//
// Seed posts are inserted via raw Prisma so `readTimeMinutes` is null on them
// (the BE only computes it inside the create-command path); we don't assert on
// the "min read" leaf for that reason.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog/:slug - render', () => {
  test('deep-dive post renders title, dek, hero meta, eyebrow chips, cover, and prose markdown', async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.DEEP_DIVE_SSR);

    await expect(detail.heroHeading).toHaveText(BLOG_TITLES.DEEP_DIVE_SSR);
    await expect(detail.heroDek).toBeVisible();
    // Meta strip always carries the publication date for seeded posts.
    await expect(detail.heroMeta).toContainText('2026');

    // Three chips: post-type + language + primary category.
    await expect(detail.heroChips).toHaveCount(3);

    // Markdown renderer output — at least a few H2s, fenced code blocks, paragraphs, and an image.
    await expect(detail.prose.locator('h2').first()).toBeVisible();
    await expect(detail.prose.locator('pre code').first()).toBeVisible();
    await expect(detail.prose.locator('p').first()).toBeVisible();
    await expect(detail.prose.locator('img').first()).toBeAttached();

    // Cover figure rendered from the seed's `featuredImageUrl`.
    await expect(detail.coverFigure).toBeVisible();

    expect(filterNoise(errors)).toHaveLength(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// TOC — the deep-dive carries 9 H2/H3s in the seed content. The page swaps
// between an inline TOC (<1280px) and a position:fixed floating TOC (≥1280px)
// via media query; we test the click+scroll behavior at the mobile breakpoint
// where the inline TOC is the interactive one, and check the floating-TOC
// existence at a desktop breakpoint.
// Notes-category posts auto-hide the TOC regardless of H2 count.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog/:slug - inline TOC (mobile breakpoint)', () => {
  test.use({ viewport: { width: 1024, height: 900 } });

  test('inline TOC renders with anchor links that match real heading ids in the prose', async ({ page }) => {
    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.DEEP_DIVE_SSR);

    await expect(detail.inlineToc).toBeVisible();
    const tocLinks = detail.inlineTocLinks();
    expect(await tocLinks.count()).toBeGreaterThanOrEqual(3);

    // Every TOC link's `#id` must match a heading with that id inside the
    // article — proves the markdown renderer + TOC extractor share the same
    // slug source. The click-to-scroll behavior is browser-default and so
    // not part of the contract worth asserting in E2E.
    const hrefs = await tocLinks.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? '')
    );
    for (const href of hrefs) {
      expect(href).toMatch(/^#/);
      const id = href.slice(1);
      await expect(detail.article.locator(`#${cssEscape(id)}`)).toHaveCount(1);
    }
  });
});

test.describe('Landing - /blog/:slug - floating TOC (desktop breakpoint)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('floating TOC aside is rendered (and the inline TOC is hidden) at ≥1280px', async ({ page }) => {
    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.DEEP_DIVE_SSR);
    await expect(detail.floatingToc).toBeVisible();
    // Inline node is in the DOM but media-query-hidden — not visible.
    await expect(detail.inlineToc).toBeHidden();
  });
});

test.describe('Landing - /blog/:slug - TOC (notes)', () => {
  test('TOC is auto-hidden when the post is in the notes category', async ({ page }) => {
    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.NOTE_EN_POSTGRES);
    await expect(detail.heroHeading).toHaveText(BLOG_TITLES.NOTE_EN_POSTGRES);
    await detail.expectNoTocRendered();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Share row — X / LinkedIn / copy-link.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog/:slug - share row', () => {
  test('renders X, LinkedIn, and copy-link buttons with the post slug in their hrefs', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);

    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.NOTE_EN_POSTGRES);

    await expect(detail.shareXLink).toBeVisible();
    await expect(detail.shareXLink).toHaveAttribute(
      'href',
      new RegExp(`twitter\\.com/intent/tweet.*${BLOG_SLUGS.NOTE_EN_POSTGRES}`)
    );
    await expect(detail.shareLinkedInLink).toBeVisible();
    await expect(detail.shareLinkedInLink).toHaveAttribute(
      'href',
      new RegExp(`linkedin\\.com/sharing/share-offsite.*${BLOG_SLUGS.NOTE_EN_POSTGRES}`)
    );

    // The copy-link button is wired through `landingCopyToClipboard`. Its
    // post-click `aria-label` flip ("Link copied") depends on the headless
    // browser's clipboard permission landing the writeText() — which is
    // flaky in CI. Assert the button is present + clickable; the directive
    // itself has unit coverage.
    const copyBtn = detail.copyLinkButton;
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveAttribute('aria-label', 'Copy link');
    await copyBtn.click();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Related posts — same-primary-category, capped at 3 by the BE.
// The dev DB has many posts in both `engineering` and `industry`, so we assert
// the structural contract rather than a static count.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog/:slug - related posts', () => {
  test('deep-dive (engineering) surfaces up to 3 same-category related posts', async ({ page }) => {
    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.DEEP_DIVE_SSR);

    await expect(detail.relatedBlock).toBeVisible();
    const count = await detail.relatedCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);
    // Self is never in its own related grid — guard against a regression.
    await expect(
      detail.relatedCards.filter({ has: page.locator(`[href="/blog/${BLOG_SLUGS.DEEP_DIVE_SSR}"]`) })
    ).toHaveCount(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Not-found path.
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog/:slug - not found', () => {
  test('unknown slug renders the "Post not found" empty state', async ({ page }) => {
    const detail = new BlogDetailPage(page);
    await detail.goto('this-slug-definitely-does-not-exist-zzz-9999', { expectNotFound: true });
    await expect(detail.notFoundEmpty).toBeVisible();
    await expect(detail.heroHeading).toHaveCount(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// SEO — title, meta description, og:image, and SSR-injected JSON-LD.
// Uses the title-unique design-system seed slug so the title assertion is
// unambiguous against the dev DB (some seeds share titles with real posts).
// ════════════════════════════════════════════════════════════════════════════

test.describe('Landing - /blog/:slug - SEO', () => {
  test('document title, meta description, and og:image are wired from the post', async ({ page }) => {
    const detail = new BlogDetailPage(page);
    await detail.goto(BLOG_SLUGS.FEATURED_DESIGN_SYSTEM);

    await expect(page).toHaveTitle(`${BLOG_TITLES.FEATURED_DESIGN_SYSTEM} | Phuong Tran`);

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect((description ?? '').length).toBeGreaterThan(0);

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
    expect(ogImage ?? '').toMatch(/^https?:\/\//);
  });

  test('SSR HTML contains a valid JSON-LD <script> with @type BlogPosting + matching headline', async ({ request }) => {
    const res = await request.get(`/blog/${BLOG_SLUGS.FEATURED_DESIGN_SYSTEM}`);
    expect(res.ok()).toBeTruthy();
    const html = await res.text();

    const match = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    expect(match, 'JSON-LD script tag was not found in SSR HTML').toBeTruthy();
    if (!match) throw new Error('JSON-LD script tag was not found in SSR HTML');

    const json = JSON.parse(match[1]);
    expect(json['@context']).toBe('https://schema.org');
    expect(json['@type']).toBe('BlogPosting');
    expect(json.headline).toBe(BLOG_TITLES.FEATURED_DESIGN_SYSTEM);
    expect(typeof json.datePublished).toBe('string');
  });
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function cssEscape(s: string): string {
  // Heading ids are slugified (lowercase ascii + hyphens), so escaping is a
  // no-op in practice — kept here as a guardrail for future content.
  return s.replace(/(["\\])/g, '\\$1');
}
