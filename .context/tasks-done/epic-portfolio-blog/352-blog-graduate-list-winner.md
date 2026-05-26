# Task: Graduate list-page winner into production `feature-blog`

## Status: done

## Goal
Replace `libs/landing/feature-blog/src/lib/blog-list-page/` with the winning variant from DDL review, using the canonical subpage shell + production data layer + SEO meta.

## Context
Per `epic-portfolio-blog.md` — once Phuong picks (task 351), the winning variant from `/ddl/blog-list-variants` graduates to the production landing page. DDL prototype stays; production `BlogListPage` becomes the chosen variant, refactored into clean shared components where appropriate.

**Winner variant: V1 + V3 hybrid (count-switched featured strip) + Featured treatment γ (bento strip, no archive filter).** Picked 2026-05-25 — see ADR-018 in `.context/decisions.md` and task 351 Progress Log.

- `3-4 featured` → V3 mosaic (top hero card full width + 2-3 archive cards; archive grid widens to full container at counts ≤ 2).
- `5+ featured` → V1 asymmetric (1 lead card ~60% + 4 side cards stacked ~40%).
- Featured-strip vertical budget: ~800-900px (hero + strip together fit one desktop viewport).
- Archive toolbar carries category + search + sort + view-toggle — **no `Featured only` filter chip, no `All / Featured` tab.** Featured posts are surfaced exclusively via the bento strip above the archive list.

## Acceptance Criteria
- [ ] Existing `libs/landing/feature-blog/src/lib/blog-list-page/blog-list-page.{ts,html,scss}` replaced with the winning variant's implementation.
- [ ] Page uses canonical subpage structure (per project memory): wrapped in `landing-page-shell` with breadcrumb (`Home / Writing` or `Home / Blog` — pick wording with author) and `landing-page-hero` (eyebrow + heading + lede).
- [ ] Heading: `Writing` or chosen alternative (single word, editorial). Lede: 1 sentence positioning the blog.
- [ ] Body uses winning variant's layout + components (filter bar / year-anchors / two-track, as decided).
- [ ] Featured strip (V1+V3 hybrid) renders above the archive list; count-switched layout (3-4 → V3 mosaic; 5+ → V1 asymmetric); no archive-toolbar featured chip or tab.
- [ ] Archive filters reflect in URL query params (`?category=&search=&sort=&view=&page=`) — survive page refresh, shareable, bookmarkable. Filter shape stays extensible (future `language`, `tag`, `featured` filters can be added without restructuring).
- [ ] `landing-pagination` works at page boundaries (test with seed: 6+ posts paginated at 10/page does not paginate; once real posts push past 10 it should).
- [ ] Empty state (`landing-empty-state`) when filter combination returns zero results.
- [ ] SEO: page sets `<title>` and meta description via Angular `Meta` service. Optional: `Blog` or `CollectionPage` JSON-LD if low-effort; otherwise skip.
- [ ] Reuse-first: no inline markup that duplicates a `landing-*` or `ui-*` shared primitive (chips, eyebrows, cards, buttons, pagination).
- [ ] Typography isolation (only `text-display-*` / `text-body-*` / `text-mono-*` / `--landing-*`).
- [ ] 4px grid respected.
- [ ] Mobile (360px, 768px) renders without overflow or chrome breakage.
- [ ] Type-check + landing prod build pass (`pnpm nx build landing` or equivalent).
- [ ] Old DDL pages at `/ddl/blog-list-variants` remain — do not delete (per `feedback_ddl_keep_after_graduate`).

## Technical Notes
- Source of layout truth: the chosen variant in `apps/landing/src/app/pages/ddl/blog-list-variants/blog-list-variants.page.html`. Lift the variant section verbatim, then refactor away DDL-specific framing (tab wrapper, prototype labels).
- If the winning variant introduced a new shared primitive (e.g. `landing-post-card`, `landing-year-anchor-strip`), extract into `libs/landing/shared/ui/` and document via `/component-bank` skill.
- URL param handling: use `ActivatedRoute.queryParamMap` + `Router.navigate([], { queryParams, queryParamsHandling: 'merge' })` per existing pattern in current `blog-list-page.ts:101-108`.
- Use signals + `OnPush` change detection (Angular v21 style — see `.context/angular-style-guide.md`).
- Verify SSR transfer cache populates per `.context/landing-ssr.md` rules.
- This task does NOT swap the `/blog` route — that happens in task 354.

## Files to Touch
- `libs/landing/feature-blog/src/lib/blog-list-page/blog-list-page.ts` (replace)
- `libs/landing/feature-blog/src/lib/blog-list-page/blog-list-page.html` (replace)
- `libs/landing/feature-blog/src/lib/blog-list-page/blog-list-page.scss` (replace)
- Possibly: new shared component(s) in `libs/landing/shared/ui/src/lib/` (extracted from winning variant)
- Possibly: `libs/landing/shared/ui/src/index.ts` (export new component)

## Dependencies
- 351 (winner picked)

## Complexity: M

## Progress Log

### 2026-05-25 — Graduated
- `libs/landing/feature-blog/src/lib/blog-list-page/blog-list-page.{ts,html,scss}`
  replaced with the V1+V3 hybrid + archive list section lifted from the DDL.
- Page wraps in `LandingPageShellComponent` (`align="center"`) with breadcrumb
  `Home / Writing` + hero heading `Writing.` + lede "Long-form deep-dives,
  short notes, and the occasional retro from building this portfolio."
- **Strip variant routing** (ADR-018): `stripVariant` computed signal returns
  `'v1'` when featured count ≥ 5, `'v3'` when 1-4 (V3's `data-count` rules
  collapse the archive grid sensibly at 1 and 2), `null` when 0 (strip hidden,
  `<landing-section-rule>` also hidden so the archive doesn't float under an
  orphan divider).
- **Featured pipeline**: single `BlogDataService.list({ limit: 50 })` fetch,
  client-side `posts.filter(p => p.featured).slice(0, 5)`. Archive operates on
  the same in-memory set with search/sort/category/page filters — no second
  HTTP call. SSR transfer cache populates the initial response.
- **Archive toolbar**: results-count + view-toggle (row/grid) + sort
  (newest/oldest) + debounced search (250ms) + category filter pills +
  pagination (10/page). All state URL-driven via `?search=&category=&sort=&view=&page=`,
  shareable + bookmarkable + survives refresh.
- **NO featured chip / no featured tab** — Treatment γ per ADR-018. Filter
  shape stays extensible (the existing chip rail can accept a `Featured only`
  pill later without restructuring).
- SEO: `<title>Writing | Phuong Tran</title>` + meta description set via
  Angular `Meta` service in the constructor. `Blog`/`CollectionPage` JSON-LD
  skipped per AC ("optional — otherwise skip").
- Responsive: `@media (max-width: 900px)` collapses both V1 (3-col → 1-col,
  side cards row-flex) and V3 (2-col split hero → 1-col, archive grid → 1-col).
  At ≤ 560px, V1 side cards stack vertically.
- Old `.blog-row` / `.blog-filter` / `.blog-page-btn` SCSS scrapped — replaced
  by `.mag-*` / `.list-*` lifted verbatim from the DDL (V2 styles dropped, A/B/C
  historical dropped).
- Type-check (`npx tsc --noEmit -p apps/landing/tsconfig.app.json` and
  `libs/landing/feature-blog/tsconfig.lib.json`) green.
- `/blog` route still serves `ComingSoonPage`; swap happens in task 354.
- DDL page `/ddl/blog-list-variants` retained per `feedback_ddl_keep_after_graduate`.
