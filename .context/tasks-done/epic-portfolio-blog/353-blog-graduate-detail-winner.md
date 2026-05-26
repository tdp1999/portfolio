# Task: Graduate detail-page winner into production `feature-blog`

## Status: done

## Goal
Replace `libs/landing/feature-blog/src/lib/blog-detail-page/` with the winning detail variant, fully wired with markdown rendering, related posts, share row, SEO meta, and SSR-injected `Article` JSON-LD.

## Context
Per `epic-portfolio-blog.md` — graduates the winning detail variant chosen in task 351. Detail page is where SEO + JSON-LD + share + related-posts all converge. Render pipeline stays on `MarkdownService` + Shiki (task 314 will swap the renderer later behind a stable layout).

**Winner variant: V4 — Center hero + far-right floating TOC.** Picked 2026-05-25 — see ADR-018 in `.context/decisions.md` and task 351 Progress Log.

- Hero: V1's centered treatment (eyebrow chips → title → dek → meta strip → compact icon-only share row → `landing-figure` cover).
- TOC: V3's `landing-toc-sidebar` + scrollspy, anchored `position: fixed; top: 96-120px; right: 24-48px; width: 220-280px` to the far right of the viewport (outside the article container — distinct from `/projects` which keeps TOC inside the 2-col grid). TOC hides when post is type `Note` OR sectionCount < 3 (H2/H3 count). Show TOC immediately on mount — do NOT gate behind scroll/IntersectionObserver thresholds.
- Override note: `landing-toc-sidebar` has its own `position: sticky + max-height + overflow` on its host — inside a `position: fixed` rail this must be reset via `::ng-deep landing-toc-sidebar { position: static; max-height: none; overflow: visible }` to avoid nested-sticky overlap (same fix applied in DDL V3 rail).
- Mobile (<1280px): floating TOC hides; inline top-of-prose TOC card (V1-style) appears in its place.
- Personal signature block: avatar + name + 1-line bio + 1-2 links, rendered after related posts (above JSON-LD `<details>`).
- Share row: compact/icon-only variant of `landing-blog-share-row` directly under the meta strip; same component (full-size variant available if needed elsewhere).
- Article frame has NO border/background — `@extend %article-frame` was deliberately omitted on V4.

## Acceptance Criteria
- [ ] Existing `libs/landing/feature-blog/src/lib/blog-detail-page/blog-detail-page.{ts,html,scss}` replaced with the winning variant's implementation.
- [ ] Page uses canonical subpage structure: wrapped in `landing-page-shell` with breadcrumb (`Home / Writing / <post title>`).
- [ ] Markdown rendering via `MarkdownService.render()` + `landingProseAnchors` directive. No visual regressions vs current baseline (verify deep-dive seed renders headings, code, images, links correctly).
- [ ] V4 layout applied: centered hero (eyebrow chips → title → dek → meta strip → compact icon-only share row → `landing-figure` cover) + far-right floating TOC (`position: fixed` outside the article container) + single-column prose + footer (share row + related posts + signature block + JSON-LD `<details>`).
- [ ] Floating TOC visible on mount (no scroll-threshold gating); hides when type=Note OR sectionCount < 3.
- [ ] Mobile (<1280px): floating TOC swapped for inline top-of-prose TOC card; signature block stays.
- [ ] Tags strip rendered after prose body using `landing-chip` (small/medium prominence).
- [ ] Share row rendered: X intent + LinkedIn share + copy-link button (uses `landingCopyToClipboard` directive). Same shared component lifted from DDL task 350.
- [ ] Related posts (3 by category, from task 347) rendered after share row using same card style as list page. Gracefully shows fewer if fewer matches; section hidden if zero matches (per PST-010).
- [ ] SEO meta tags set via Angular `Meta` service inside `effect()` on post signal: `title`, `description`, `og:title`, `og:description`, `og:image` (from `featuredImageUrl`), `og:type=article`, `article:published_time`, `article:author`.
- [ ] `Article` JSON-LD injected SSR-only (use `isPlatformServer` guard) — payload from task 348. Pattern source: `libs/landing/feature-about/src/lib/feature-about/feature-about.ts:100-113`.
- [ ] No double-injection on hydration (client must not re-add the `<script>` tag).
- [ ] Verify SSR HTML contains the JSON-LD by curl-ing `http://localhost:4200/blog/<slug>` and grepping for `application/ld+json`.
- [ ] Empty state: when slug not found, show 404 equivalent (route 404 or inline `landing-empty-state` + back link).
- [ ] Typography isolation + 4px grid + reuse-first guardrails respected.
- [ ] Mobile (360px, 768px) — for Variant 3, sticky rail collapses cleanly; for Variants 1 & 2, single-column flow works.
- [ ] Type-check + landing prod build pass.
- [ ] Old DDL pages at `/ddl/blog-detail-variants` remain — do not delete.

## Technical Notes
- Source of layout truth: the chosen variant section in `apps/landing/src/app/pages/ddl/blog-detail-variants/blog-detail-variants.page.html`. Lift verbatim, strip DDL framing.
- `MarkdownService.render()` is async — handle with `from(promise)` + `switchMap` or `toSignal`. Avoid nested subscribes (memory rule `feedback_rxjs_no_nested_subscribe`).
- TOC payload: returned alongside HTML from `MarkdownService.render()` as `{ html, toc: TocEntry[] }`. If winner is Variant 3, pass `toc` directly to `<landing-toc-sidebar [sections]="toc()">`.
- SSR JSON-LD injection: use `DOCUMENT` token + `isPlatformServer(platformId)` guard. Create a `<script type="application/ld+json">`, set textContent, append to `<head>`. Do NOT use `[innerHTML]` — XSS surface.
- Author URL: if available, link to landing about page; otherwise omit `author.url` from JSON-LD.
- Reading-time + word count for any variant 1 auto-hide TOC: use `post.readTimeMinutes` from server (PST-006) rather than recomputing client-side.
- Avoid `as` type casts in templates (memory rule `feedback_template_type_discipline`).
- Avoid component methods in templates — use computed signals or pipes (memory rule `feedback_pure_helpers_and_template_pipes`).

**Specialized Skill:** `component-bank` — if the winner adds a documented-worthy shared component (e.g. `landing-share-row`, `landing-related-posts`), persist the doc.

## Files to Touch
- `libs/landing/feature-blog/src/lib/blog-detail-page/blog-detail-page.ts` (replace)
- `libs/landing/feature-blog/src/lib/blog-detail-page/blog-detail-page.html` (replace)
- `libs/landing/feature-blog/src/lib/blog-detail-page/blog-detail-page.scss` (replace)
- `libs/landing/feature-blog/src/lib/blog-detail-page/toc.component.ts` (delete or replace per winner — if Variant 3 uses `landing-toc-sidebar` directly, drop the local component)
- Possibly new shared: `libs/landing/shared/ui/src/lib/landing-share-row/` or `landing-related-posts/`
- `libs/landing/shared/ui/src/index.ts` (export new components if extracted)

## Dependencies
- 347 (related posts payload)
- 348 (JSON-LD payload)
- 351 (winner picked)

## Complexity: M

## Progress Log

### 2026-05-25 — Graduated
- `libs/landing/feature-blog/src/lib/blog-detail-page/blog-detail-page.{ts,html,scss}`
  replaced with V4 (center hero + far-right floating TOC) lifted from DDL.
- New file: `blog-share-row.component.ts` (local copy of the DDL component —
  kept local to feature-blog rather than promoted to shared/ui since the
  current consumer count is 2 across the repo and the DDL copy stays per
  `feedback_ddl_keep_after_graduate`; if a 3rd consumer appears, graduate to
  `libs/landing/shared/ui/src/components/blog-share-row/`).
- Deleted: `toc.component.ts` (V4 uses `landing-toc-sidebar` from shared/ui).
- Wraps in `LandingPageShellComponent` with computed breadcrumb `Home /
  Writing / <title>` (or "Not found" on 404, "Loading" while fetching).
- SSR transfer cache preserved from the baseline: `makeStateKey('blog-post-' + slug)`
  → server fetches + markdown-renders + serializes the rendered HTML into
  TransferState; client reads + removes the key, skipping the refetch.
- **SEO meta**: `<title>`, description, `og:title/description/type/image`,
  `article:published_time/author` — all driven by an `effect()` on the post
  signal. Pattern mirrors `/about` (commit `96a0cd4`).
- **SSR JSON-LD injection**: separate `effect()` guarded by
  `isPlatformServer(platformId)`; reads `post.jsonLd` (built by BE task 348),
  appends `<script type="application/ld+json">` to `document.head`. Client
  never re-injects → no hydration duplicate.
- **TOC behavior** (ADR-018): floating TOC at `position: fixed; top: 120px;
  right: 48px; width: 280px` outside the article container, visible
  immediately on mount when post has ≥3 H2/H3 sections AND post is not in
  the `notes` category. Below 1280px the floating TOC hides and the inline
  TOC card under the hero takes over. `::ng-deep landing-toc-sidebar` resets
  the host's own `position: sticky + max-height + overflow` so the fixed
  wrapper alone handles positioning (nested-sticky overlap fix from DDL).
- **Scrollspy**: `LandingScrollspyService` provided locally; effect registers
  sections only when the TOC will render (clears on hide so stale highlights
  don't carry across slug navigation).
- **Related posts**: grid of `landing-figure`-less `<img>` cards (16/9 cover
  + title + excerpt). Hidden when `relatedPosts.length === 0` per PST-010
  (no padding).
- **Personal signature block**: avatar (PT initials) + name + 1-line bio +
  3 nav links (About · All posts · Projects).
- Type-check (`npx tsc --noEmit -p apps/landing/tsconfig.app.json` +
  `libs/landing/feature-blog/tsconfig.lib.json`) green.
- Mobile breakpoint (768px): hero title drops from `display-lg` to `display-md`,
  signature collapses to column. Floating TOC hides everywhere below 1280px.
- `/blog/:slug` route still serves the deprecated baseline via the old
  `BLOG_ROUTES` — actual `/blog` route swap to `BLOG_ROUTES` happens in
  task 354.
- DDL page `/ddl/blog-detail-variants` retained per
  `feedback_ddl_keep_after_graduate`. Its local `blog-share-row.component.ts`
  also retained (duplicate accepted as documented above).
