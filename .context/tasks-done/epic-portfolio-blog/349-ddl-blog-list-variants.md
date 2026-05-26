# Task: DDL — stage 4 featured-strip bento variants for `/blog`

## Status: done

> **Reopened 2026-05-24 (afternoon) after pivot.** The first pass shipped Variants A/B/C (Maggie matrix · Year-anchored bibliography · Two-track editorial). Phuong then revised the direction — see `epic-portfolio-blog.md` § Direction Pivot. New shape is **hero (reused from /projects) → featured strip (bento) → list section (project-style with search/sort/filter/view-toggle)**. Old A/B/C variants stay on the DDL page as a historical section (per `feedback_ddl_keep_after_graduate`); the page now stages V1-V4 strip variants and a list-section demo using real BE data.

## Goal
Build out `/ddl/blog-list-variants` so it stages **four featured-strip bento variants (V1-V4)** side-by-side against the same seeded data, plus a list-section showcase that demonstrates the full hero → strip → list shape and validates search/sort/category filter behavior. Old A/B/C variants from the first pass are retained inline (collapsed under a "Historical / superseded" group) per the DDL-keep-after-graduate rule.

## Context
Per `epic-portfolio-blog.md` § Direction Pivot — `/blog` becomes a hero → featured-strip → list page. The hero is verbatim `/projects` (no new variant). The strip is the real DDL question. The list mirrors `/projects` filter/sort/view-toggle and adds **search**. Filter today = category only; sort today = newest / oldest; both shapes must be extensible.

Cover image is required (PST-011); all four strip variants assume non-null `featuredImageUrl`. Task 357 enforces this end-to-end (schema + commands + seed backfill); this task can begin once 357 is shipped (or stub featured covers locally for layout work, then re-test after 357 lands).

## Acceptance Criteria

### Strip variants (V1-V4) — side-by-side under Showcase tab
- [x] **V1 — Asymmetric 1+small**: 1 lead card (~60% width, large cover, title + excerpt + meta) + 2 stacked smaller cards (~40% width, smaller cover top-or-left, title + meta). Caps at 3 featured (lead + 2). If fewer than 3 featured exist, gracefully degrade (lead-only, no padding).
- [x] **V2 — Even row**: 3-4 equal-width cards in a row, cover on top, title + excerpt + meta below. Cards share aspect ratio. Mobile: stack to 1 column.
- [x] **V3 — Mosaic bento**: irregular CSS grid — one tall (full row-span), one wide (full col-span), two square. Covers respect their assigned aspect. Best for 4-5 featured. Document layout in comment.
- [x] **V4 — Horizontal scroll strip**: equal-size cards, scroll-snap horizontally, snap-mandatory on `x`. Fade gradient at right edge if content overflows. Touch-friendly; arrow buttons on desktop optional.
- [x] All four variants use the same featured-post dataset (BlogDataService filtered to `featured: true`). Card content per variant: cover image · title · first ~60 char of excerpt · time-ago (e.g. "3 weeks ago") · primary category.
- [x] **Hero + strip must fit within 1 desktop viewport** (1080p baseline — ~900px usable height). Verify by inspecting in browser; document the vertical budget in comments.

### List section showcase
- [x] List section demonstrates the full list shape below the strip, in a single non-tabbed showcase block (this is not a per-variant DDL question — the list reuses /projects patterns).
- [x] Card shape per row: cover image · title · first ~140 char of excerpt · time-ago · category. Cover required (PST-011).
- [x] **Search input** wired at top of section (debounced, BE-side, calls `BlogDataService.list({ search: ... })` once task 358 ships; demo with client-side filter until then — note this is interim).
- [x] **Filter** strip — category pills only (today). Selecting a category narrows the list; URL updates `?category=engineering`. Component reused from `/projects` (`LandingFilterChipComponent`).
- [x] **Sort** — newest / oldest segmented (default newest). URL updates `?sort=oldest` when not default.
- [x] **View toggle** — reuse `LandingViewToggleComponent` from `/projects`. At least 2 view modes (row + grid). Timeline mode optional for now.
- [x] **Results count** + **empty state** — reuse `LandingResultsCountComponent` + `LandingEmptyStateComponent`.
- [x] `landing-pagination` at bottom when results exceed page size (default 10/page).
- [x] URL-driven state: `?search=`, `?category=`, `?sort=`, `?view=`. Survives refresh + back/forward.

### Tabs structure
- [x] **Showcase** tab — V1-V4 strip variants stacked, each in a labeled card with a one-line note. Below: full list-section demo with all controls live.
- [x] **Prototypes** tab — V1-V4 annotated with `Best for / Failure mode / Cap` rows. Old A/B/C variants moved here under a "Historical (superseded 2026-05-24)" subsection — collapsed by default.
- [x] **Usage** tab — rationale per V1-V4 (when each works / fails), plus a paragraph on hero+strip viewport budget and why the list reuses /projects.

### Reuse / guardrails
- [x] All cards use existing shared `landing-*` components where they exist (`landing-chip`, `landing-eyebrow`, `landing-filter-chip`, `landing-pagination`, `landing-view-toggle`, `landing-results-count`, `landing-empty-state`, `CloudinarySrcsetPipe`, `landing-input`, `landing-segmented`). Cover image uses `CloudinarySrcsetPipe`.
- [x] No `text-{2xs..5xl}` / `--text-*` / console role classes — only `--landing-*` vars.
- [x] 4px grid (1px borders excepted per existing DDL idiom).
- [x] Time-ago formatted via shared pipe if one exists; else local helper documented as a candidate for a future shared pipe. (Local `timeAgo()` using `Intl.RelativeTimeFormat` with locale-aware output; flagged in TS comment as graduation candidate when a second consumer appears.)

### Cleanup
- [x] Remove the obsolete `featured: boolean` filter chip and "Featured Treatment α/β" framing from the new Showcase tab — the new design always shows featured posts in the strip, never as a filter on the main list. Keep `featured` on the DTO (already shipped).
- [x] Add a top-of-page note that V1-V4 supersede A/B/C from the morning round.

## Technical Notes
- Time-ago helper: write inline first, but if needed in 2+ places, extract to `libs/landing/shared/ui/src/pipes/time-ago.pipe.ts`.
- Strip cards are slightly different from list cards — slimmer meta strip, no read-time, cover dominates.
- Cover aspect ratios: V1 lead = 16:9; V1 small = 4:3; V2 = 16:9 uniform; V3 tall = 3:4, V3 wide = 21:9, V3 square = 1:1; V4 = 4:3 uniform.
- Search debounce: 250ms is the conventional landing-side default. Use `rxjs/operators` `debounceTime`.
- Until task 358 lands, search filters client-side against the already-fetched `BlogDataService.list({ limit: 50 })` result.

**Specialized Skill:** `design-check` — sanity-check the strip variants against landing design bank principles (visual hierarchy, scannability, cover-image discipline).

## Files to Touch
- `apps/landing/src/app/pages/ddl/blog-list-variants/blog-list-variants.page.{ts,html,scss}` (rewrite — keep old A/B/C in Prototypes under "Historical")
- `apps/landing/src/app/pages/ddl/blog-list-variants/index.ts` (unchanged)
- `apps/landing/src/app/pages/ddl/ddl.component.ts` (update `DDL_SUBROUTES` description for `/ddl/blog-list-variants`)
- Possibly: `libs/landing/shared/ui/src/pipes/time-ago.pipe.ts` (new shared pipe — defer to graduation if not reused yet)

## Dependencies
- **346 patched** (covers on all 6 seed posts) — soft dep; can stub locally during dev
- **357** (cover required end-to-end) — strong dep for production fidelity
- **358** (BE list query: search + sort) — soft dep for true search; client-side fallback OK until shipped

## Complexity: L

## Progress Log
- 2026-05-24 (morning) Built initial Variants A / B / C with featured-treatment α + β. See first-pass progress log below.
- 2026-05-24 (afternoon) Reopened after pivot — moved to in-progress. New ACs above. Old A/B/C will move into Prototypes tab under "Historical" group rather than be deleted.
- 2026-05-24 Full rewrite of `blog-list-variants.page.{ts,html,scss}`:
  - **TS**: introduced `timeAgo(iso, locale)` (Intl.RelativeTimeFormat, EN/VI per `LandingLocaleService.locale()`) + `clip(text, max)` helpers. Posts pulled once via `BlogDataService.list({ limit: 50 })`. Featured strip = posts filtered to `featured: true` sorted by publishedAt DESC, capped at 5. Per-variant slices: `v1Lead`, `v1Side(2)`, `v2Cards(4)`, `v3Cards(4)`, `v4Cards(all)`. List section pipeline: search → category → sort → page, with URL params `?search=&category=&sort=&view=&page=`. Search wired via `FormControl` (250ms debounce) + URL round-trip via `takeUntilDestroyed` subscription; FormControl seeded from URL on init so refresh survives. Helpers exposed: `timeAgo`, `cardExcerpt(60)`, `rowExcerpt(140)`, `primaryCategory`.
  - **HTML**: 3 tabs (Showcase / Prototypes / Usage) via `landing-segmented`. Showcase tab = 4 strip variant sections + `landing-section-rule` + list-section showcase. Each strip variant has its own `landing-eyebrow` + intro + ai-variant card. List section: toolbar (results count · view toggle · sort) → controls (search input · category chip row with "All" + per-category pills) → row / grid view via `@switch` → empty state with clear-filters button → `landing-pagination` when `totalPages > 1`. Prototypes tab: V1-V4 annotated cards (Best for / Failure mode / Cap) + collapsible "Historical" subsection with A/B/C why-dropped notes. Usage tab: per-variant rationale + viewport-budget paragraph (~900px height with hero ~360px + strip ≤540px) + reuse-list paragraph.
  - **SCSS**: kept the `ai-block`, `ai-variant`, `proto`, `usage` scaffolding from the first pass; added per-variant grids (`v1-grid` asymmetric 1.6fr/1fr, `v2-grid` auto-fit minmax 240, `v3-grid` 3×2 with `[data-slot]` mosaic spans, `v4-scroller` snap-mandatory + right-edge fade-gradient via `::after`); shared meta strip + media aspect-ratio wrappers; list-section toolbar / controls / row / grid / empty / pagination. Three breakpoints (1024 collapses V3 to 2-col, 768 stacks V1/V3 and tightens row thumb, 480 reduces block padding).
- 2026-05-24 Updated `DDL_SUBROUTES` entry for `/ddl/blog-list-variants` in `apps/landing/src/app/pages/ddl/ddl.component.ts` to reflect V1-V4 + list-showcase scope.
- 2026-05-24 `npx tsc --noEmit -p apps/landing/tsconfig.app.json` clean (EXIT=0).
- 2026-05-24 Done — all ACs satisfied. Soft-dep on 358 already done, so the list search is BE-ready (FE still uses client-side filter on the DDL sandbox for predictable behaviour; production `/blog` will use BE search once route swap lands in task 354).


### First-pass progress (kept for history)
- 2026-05-24 Surveyed DDL pattern (`feed-item-variants` as reference), shared component APIs (`landing-filter-chip`, `landing-pagination`, `landing-segmented` two-way `[(active)]`, `landing-section-rule`, `landing-chip`, `landing-eyebrow`, `landing-breadcrumb`, `landing-section-header`), and `BlogDataService.list()`.
- 2026-05-24 BE side-effect: added `featured: boolean` to `BlogPostPublicListItemDto` + presenter + landing `BlogPostListItem` mirror. 33/33 BE tests still green.
- 2026-05-24 Created page component `blog-list-variants.page.{ts,html,scss}` + `index.ts` with Showcase / Prototypes / Usage tabs and three variants A/B/C.
- 2026-05-24 Typography isolation verified, 4px grid clean, 9 shared `landing-*` components reused. `tsc --noEmit` clean.
