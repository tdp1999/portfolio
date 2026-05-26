# Task: Playwright E2E coverage for `/blog` and `/blog/:slug`

## Status: pending

## Goal
Add Playwright POM-based E2E tests covering the blog list flow (load → filter → paginate → click-through) and the blog detail flow (render → TOC if present → share → related → SSR-injected JSON-LD + meta).

## Context
Per `epic-portfolio-blog.md` Success Criteria — blog launch is gated by E2E coverage. Existing landing E2E lives under `apps/landing-e2e/` (verify location). Pattern: POM (Page Object Model), soft assertions, console + network monitoring, no flaky waits.

## Acceptance Criteria
- [ ] POM created for blog list page: `apps/landing-e2e/src/pages/blog-list.page.ts` with locators for filter bar, post cards, pagination, empty state, language toggle, featured filter/tab.
- [ ] POM created for blog detail page: `apps/landing-e2e/src/pages/blog-detail.page.ts` with locators for hero, prose body, TOC (variant-dependent), tags strip, share row, related posts section.
- [ ] Spec file `apps/landing-e2e/src/specs/blog-list.spec.ts`:
  - [ ] List page loads with seeded posts visible
  - [ ] Filter by type (e.g. `?type=note`) reduces results correctly
  - [ ] Filter by category narrows results
  - [ ] Filter by language (EN / VI) narrows results
  - [ ] Featured filter/tab activates (per chosen treatment from task 351) and surfaces only featured posts
  - [ ] Filters reflect in URL query params and survive page refresh
  - [ ] Pagination next/prev works when post count exceeds page size
  - [ ] Empty-state shows when filter combination yields zero results
  - [ ] Click-through to a post navigates to `/blog/:slug`
- [ ] Spec file `apps/landing-e2e/src/specs/blog-detail.spec.ts`:
  - [ ] Detail page loads for a seeded deep-dive slug and renders markdown content (headings, code blocks, links, images)
  - [ ] TOC links (Variant 1 inline / Variant 3 sticky) scroll to correct heading on click — if winner has no TOC (Variant 2), assert no TOC element rendered
  - [ ] Share row buttons present (X, LinkedIn, copy-link). Copy-link copies URL to clipboard (verify via clipboard API or page log).
  - [ ] Related posts section renders 3 cards (or fewer if category match is sparse — use the deep-dive seed which has predictable category)
  - [ ] Visiting `/blog/does-not-exist` shows graceful 404 / empty state
- [ ] Spec file `apps/landing-e2e/src/specs/blog-seo.spec.ts` (or merged into detail spec):
  - [ ] `<title>` matches post title (or list title for list page)
  - [ ] Meta `description` present and non-empty
  - [ ] `og:image` present (when post has featured image)
  - [ ] `<script type="application/ld+json">` present in SSR HTML — verify by fetching the page HTML directly (`request.get(...)`) rather than relying on client-rendered DOM
  - [ ] JSON-LD parses as valid JSON and contains `@type: "Article"` (or `BlogPosting`)
- [ ] Console + network monitoring: no errors logged, no 4xx/5xx network responses on happy paths.
- [ ] No `waitForTimeout` or arbitrary sleeps — use Playwright's auto-waiting + explicit locator assertions.
- [ ] Tests run reliably 3x in a row locally without flakes.
- [ ] CI: tests pass in the existing landing-e2e pipeline (if configured).

## Technical Notes
- Reference existing `/about` E2E (task 342, archived) for POM + SSR HTML verification patterns.
- SSR JSON-LD check: use `request.newContext()` then `request.get('http://localhost:4200/blog/<slug>')` to read raw HTML — do NOT load the page in a browser context for this assertion (client may re-inject and you can't tell apart).
- Pre-test setup: ensure seed posts exist (test against a seeded DB or stand up a deterministic test fixture).
- Use `test.describe.configure({ mode: 'serial' })` only if absolutely required; default to parallel.
- Soft assertions (`expect.soft`) for non-blocking checks (e.g. visual order); hard assertions for navigation/content correctness.
- Capture screenshots on failure for visual debugging.

**Specialized Skill:** `aqa-expert` — read its SKILL.md before writing specs. Apply POM pattern, console/network monitoring, cookie/storage verification (where relevant), soft assertions, flakiness prevention.

## Files to Touch
- `apps/landing-e2e/src/pages/blog-list.page.ts` (new)
- `apps/landing-e2e/src/pages/blog-detail.page.ts` (new)
- `apps/landing-e2e/src/specs/blog-list.spec.ts` (new)
- `apps/landing-e2e/src/specs/blog-detail.spec.ts` (new)
- `apps/landing-e2e/src/specs/blog-seo.spec.ts` (new, optional — can be merged)
- Possibly: `apps/landing-e2e/src/fixtures/` for seeded slug constants

## Dependencies
- 354 (route swapped — page must serve at `/blog` for tests to hit)

## Complexity: M

## Progress Log
