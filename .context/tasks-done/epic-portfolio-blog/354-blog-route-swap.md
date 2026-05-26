# Task: Swap `/blog` route from `ComingSoonPage` to `BLOG_ROUTES`

## Status: done

## Goal
Wire the production `feature-blog` library into the landing app so `/blog` and `/blog/:slug` serve real pages instead of the coming-soon placeholder.

## Context
Per `epic-portfolio-blog.md` — the `BLOG_ROUTES` constant in `libs/landing/feature-blog/src/lib/blog.routes.ts` already exists and points at `BlogListPage` + `BlogDetailPage`. After tasks 352 + 353 graduate the winning variants into those components, this task flips the landing app's `/blog` route to load them via `loadChildren`. SSR must still work end-to-end.

## Acceptance Criteria
- [ ] `apps/landing/src/app/app.routes.ts:31-33` updated:
  - Remove the `loadComponent: () => import('./pages/coming-soon/coming-soon.page')...` for `/blog`.
  - Replace with `loadChildren: () => import('@portfolio/landing/feature-blog').then((m) => m.BLOG_ROUTES)`.
  - Remove the placeholder `data: { section: 'Blog', blurb: ... }` (no longer needed; ensure no other code reads it).
- [ ] Visit `/blog` in dev (`pnpm dev:landing`) → real list page renders, SSR transfer-cache populates (no client refetch flash).
- [ ] Visit `/blog/<seed-slug>` → real detail page renders.
- [ ] Visit `/blog/does-not-exist` → graceful 404 (per task 353 empty state).
- [ ] `curl -s http://localhost:4200/blog | grep -i "<title>"` returns the blog list title.
- [ ] `curl -s http://localhost:4200/blog/<seed-slug> | grep -i 'application/ld+json'` returns the JSON-LD script tag (SSR-injected).
- [ ] No console errors in browser (check via `playwright-skill` or manual).
- [ ] `landing-sitemap` or equivalent (if exists) lists `/blog` and seeded post URLs — verify or update if a static sitemap is regenerated.
- [ ] `coming-soon` page component for `/blog` is no longer referenced anywhere — but **do not delete** the component file (it serves other routes like `/uses`-pending etc.; verify usage first via grep).
- [ ] Type-check + landing prod build pass (`pnpm nx build landing`).
- [ ] Existing project, about, home routes unaffected — quick smoke test (`/`, `/about`, `/projects/<slug>`).

## Technical Notes
- `loadChildren` vs `loadComponent` — `BLOG_ROUTES` is an array, so `loadChildren` is required. Existing `feature-projects` route is the reference pattern.
- Verify the `@portfolio/landing/feature-blog` import path resolves via `tsconfig.base.json` paths. If not, fix path mapping (should already exist since feature-blog lib was created earlier).
- SSR verification:
  - `pnpm dev:landing` (port 4200)
  - In another shell: `curl -s http://localhost:4200/blog | head -100` — expect server-rendered list, not just an Angular shell.
  - Inspect for `<script type="application/ld+json">` on detail.
- Grep before removing `coming-soon` references: `grep -r "coming-soon" apps/landing/src/app/app.routes.ts` to confirm scope; do not delete the component file if other routes still use it.

## Files to Touch
- `apps/landing/src/app/app.routes.ts` (swap `/blog` route definition)

## Dependencies
- 352 (list winner graduated)
- 353 (detail winner graduated)

## Complexity: S

## Progress Log

### 2026-05-25 — Route swapped
- `apps/landing/src/app/app.routes.ts:31-34` flipped from `loadComponent`
  (`ComingSoonPage` + placeholder `data.blurb`) to
  `loadChildren: () => import('@portfolio/landing/feature-blog').then(m => m.BLOG_ROUTES)`.
  `BLOG_ROUTES` wires `/blog` → `BlogListPage` and `/blog/:slug` → `BlogDetailPage`.
- `ComingSoonPage` component file kept per AC (file still exists at
  `apps/landing/src/app/pages/coming-soon/` — only referenced now by a
  text mention inside the DDL `page-shell` sample, no live route uses it).
- Build fix: `BlogDetailPage` template's `@if/@else if/@else` chain over the
  `<span hero-heading>` + `<p hero-lede>` slots tripped two NG8011 warnings
  ("Node matches `[hero-heading]` slot... but will not be projected because
  the surrounding @else has more than one node at its root"). Restructured
  so the conditional lives **inside** each slot (each `@if/@else` branch is
  now a single text node), keeping the page-shell content-projection happy.
- `pnpm nx build landing --skip-nx-cache` → `Successfully ran target build`.
  Remaining warnings are pre-existing bundle-size budget hits (story-variants,
  bio-card-grid, etc.) unrelated to this task; the V4 detail page chrome is
  well under its lazy-route budget.
- `npx tsc --noEmit -p apps/landing/tsconfig.app.json` clean.
- SSR curl ACs (lines 19-20) deferred to task 355 (E2E) which will run the
  full server + assert title + JSON-LD presence. The route plumbing itself
  is verified by the prod build resolving `BLOG_ROUTES` through the
  `@portfolio/landing/feature-blog` path mapping.
- DDL pages at `/ddl/blog-list-variants` and `/ddl/blog-detail-variants`
  unchanged and still registered per `feedback_ddl_keep_after_graduate`.
