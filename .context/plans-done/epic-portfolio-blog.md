# Epic: Landing Blog page — `/blog` as the writing surface (DDL-driven full redesign)

> Status: completed (2026-05-28)
> Depends on: `epic-blog-post` (done, in `plans-done/` — provides BE module, console CMS, schema, `BlogDataService` + DTOs, `/api/blog` endpoints), `epic-portfolio-e5-implementation` (done — landing platform, page-shell pattern, DDL sandbox), `epic-portfolio-about` (done — SEO + JSON-LD pattern to copy from commit 96a0cd4).
> Defers to: `epic-portfolio-rich-text-editor` (task 314 — RTE renderer swap for blog detail. This epic ships with the current `MarkdownService` + Shiki pipeline; 314 swaps the renderer later without touching layout).
> Feeds: launch readiness. `/blog` is the third deep surface after `/projects` and `/about` — the **writing voice** complement to project-as-artifact and about-as-credibility.

## Specialized Skills
- **design-ingest** — capture any new blog UX patterns into the design bank as variants ship
- **component-bank** — document any new shared components introduced (e.g. `landing-post-card`, `landing-share-row`) per family overview rules
- **aqa-expert** — Playwright POM + console/network monitoring for list + detail flows + URL-param filters
- **ng-lib** — only if new shared sub-libs are extracted from `feature-blog` during graduation

## Purpose

Replace the `coming-soon` placeholder at `/blog` (`apps/landing/src/app/app.routes.ts:31-33`) with a real list + detail experience that respects the diverse voice mix Phuong intends to publish in (deep-dives, project retros, essays, short notes / TILs). The current `libs/landing/feature-blog/` was built early as part of the BE epic and treats the blog as a generic Medium-clone; it does not handle the 4-voice mix, does not match the landing design system that matured around `/about` + `/projects`, and was never wired to the route. **Replace, don't extend.**

Two simultaneous audiences:

- **Recruiter / hiring manager (scan):** can tell within 5 seconds that the author writes regularly, can sample a representative post quickly, can see depth via at least one long-form piece.
- **Developer / peer (browse):** can filter by topic / type / language, can read a deep-dive comfortably (TOC, code blocks, prose rhythm), can share a post.

## Non-goals

- **Featured magazine-hero at top of list.** Research (Maggie Appleton, Lee Robinson, Josh Comeau, swyx, Cassidy Williams, Dan Abramov) shows magazine-style featured heroes are publication patterns, not personal-blog patterns. Featured posts surface as a **filter chip or dedicated tab**, never as a banner card stealing visual weight from chronology.
- **Newsletter signup / email capture.** No provider integration (ConvertKit, Buttondown, etc.) in this epic. Defer.
- **RSS feed.** Deferred to a follow-up task; not blocking launch.
- **Bilingual language switcher UI** (cross-page language toggle). Each post is single-language (EN or VI) and not translatable; in-page filter by language is in scope, but a global site language switcher is not.
- **Comments / reactions / discussion.** Defer permanently or to a much later epic.
- **RTE renderer swap** — task 314 owns the `<redoc-rte-render>` swap. This epic keeps `MarkdownService` (marked + Shiki) and is contractually compatible — task 314 must not require layout changes.
- **Console CMS work.** Backend + console editor already shipped (`epic-blog-post`, done 2026-04-20). No BE / console changes in this epic.
- **New schema fields.** All needed data already exists on `BlogPost` (slug, language, title, excerpt, content, status, featured, publishedAt, readTimeMinutes, metaTitle, metaDescription, featuredImageId, categories[], tags[], author).
- **Series / multi-part posts.** Defer — `BlogPost` has no series field, and Phuong has no series planned.

## Direction Pivot — 2026-05-24 (afternoon)

The first round of DDL list variants (A Maggie matrix / B Year-anchored bibliography / C Two-track editorial) shipped to `/ddl/blog-list-variants`, then Phuong revisited the brief. The structure below **supersedes** the list-variant decisions further down in this file (which are kept for historical record only). Detail variants (350 + 351 onward) are unchanged by this pivot.

**New shape for `/blog`:**

1. **Hero** — reuse `/projects` page hero verbatim (`LandingPageShellComponent` + breadcrumb + page-hero copy). No bespoke hero; coherence with `/projects` is mandatory.
2. **Featured strip (bento)** — directly below hero, 2-5 featured posts in a bento layout. Hero + strip must fit within **one desktop viewport**.
3. **List section** — below the strip, full archive with project-style **filter + sort + view-toggle + search**. Cards show cover image · title · first excerpt · time-ago · category.

**Cover image is now mandatory** — domain rule **PST-011** added. Every blog post must have a `featuredImageId`. Enforced at: domain entity, BE schema (`NOT NULL` migration), BE create/update commands, console form validation. Seed must give all six seed posts a cover.

**Filter / sort contract:**

- Filters surfaced today: `category` only. Shape must be extensible (enum-like, easy to add `language`, `featured`, `tag` later).
- Sort: `newest` (default) / `oldest`. Shape extensible (`mostRead`, `featuredFirst`, etc.).
- **Search** is mandatory (free-text against title + excerpt; BE-side LIKE or pg full-text — pick the simplest correct path).

**DDL strip variants to stage** (all four, side-by-side, real seeded covers):

- **V1 — Asymmetric 1+small.** 1 lead card (~60% width) + 2 stacked small (~40%). Editorial weight, max 3 featured.
- **V2 — Even row.** 3-4 equal cards in a row, cover-on-top, title/excerpt/meta below. Democratic, scannable.
- **V3 — Mosaic bento.** Irregular grid (one tall, one wide, two square). Visual variety; needs cover ratios that compose. 4-5 featured.
- **V4 — Horizontal scroll strip.** Equal-size cards, scroll-snap horizontally. Dense; scales to many featured but hides cards past fold-right.

**Reuse-first audit before code** — `/projects` already provides `LandingFilterChipComponent`, `LandingResultsCountComponent`, `LandingViewToggleComponent`, `LandingPageShellComponent`, query-port pattern, CSV-encoded URL params, `asyncResource`. Reuse → extend → invent. Search input has no existing equivalent at the page level; either reuse `landing-input` debounced or add a small wrapper.

**New work this pivot introduces:**

- Domain rule **PST-011** (cover required) — added to `domain.md`.
- BE schema migration — `featuredImageId` nullable → NOT NULL with backfill safety.
- BE list query extension — `search` + `sortBy` parameters on `ListPublicPostsQuery`.
- Console form validation — reject submit without cover.
- Seed patch — covers on the remaining four `seed-*` posts (deep-dive + retro already had them).

Tasks 346 + 349 are patched in place; new tasks **357** (BE cover required), **358** (BE list query: search + sort), **359** (Console form validation) are appended. Old tasks 350-356 (detail variants → graduate → route swap → E2E → cleanup) carry forward unchanged.

---

## Decisions locked this session (2026-05-24, morning — partially superseded by pivot above)

Ground truth for every downstream task in this epic.

### Audience & voice

- **4 post types in one feed**: Deep-dive (long, code-heavy) · Retro (project build log) · Essay (opinion / short-form) · Note (TIL / quick tip, <200 words). All four mix in the same reverse-chronological list.
- **Type is surfaced per card** via a chip on the eyebrow line (`landing-chip` with `prominence="default"`, mono-caps). This is the Maggie Appleton pattern and the **only** survey reference that handles mixed lengths honestly.
- **Read-time is hidden on list cards** for variants A and C — the peer set (Lee Robinson, Maggie, Dan, Cassidy) does not show read-time on the index. Read-time **does** show on detail page metadata strip. Variant B (bibliography) hides it everywhere.
- **Author chip is hidden** on list cards (single-author blog — implied). Author shows on detail page only.

### Information Architecture — staged on DDL, winner picked by Phuong

`/blog` route remains placeholder until DDL comparison concludes. Three list variants and three detail variants ship to DDL **simultaneously** so they can be compared side-by-side at the same data fidelity.

#### List variants (stage at `/ddl/blog-list-variants`)

- **Variant A — "Maggie matrix"** *(handles 4 voices most honestly)*
  - Single-column reverse-chronological list.
  - Card structure: eyebrow `[type chip] · [lang chip] · category` → title (`text-display-sm`) → 1-line excerpt (`text-body-md`) → footer `date · readTimeMinutes hidden`.
  - **Density adapts to type**: Notes render at ~60% card height — no excerpt, smaller title (`text-display-xs` if available else `text-body-xl` bold), tighter padding. Short content reads as short.
  - Filter bar above list (sticky on scroll): type toggle (All / Deep-dive / Retro / Essay / Note) + category pills + language toggle (All / EN / VI) + "Featured only" chip.
  - URL-driven filters (`?type=`, `?category=`, `?tag=`, `?lang=`, `?featured=1`), shareable / bookmarkable.
  - `landing-pagination` at bottom (10 per page).

- **Variant B — "Year-anchored bibliography"** (Cassidy Williams pattern)
  - Pure text list, grouped by year. Each year is an `<h2>` with sticky offset; jump-anchor strip across the top (`2026 · 2025 · 2024`).
  - Per-row: `[type chip] [lang chip]` title → 1-line description on hover or always-inline → `Mon DD` date right-aligned.
  - No images, no read-time, no excerpt by default (configurable per row).
  - Tags + category accessed via dedicated `?category=` URL param (rendered as a filter strip when active).
  - Featured: not surfaced in the archive view — only via `?featured=1` filter.

- **Variant C — "Two-track editorial"** *(opinionated, no filter chrome)*
  - Two stacked sections separated by `landing-section-rule`:
    - **"Long form"** — Deep-dive + Retro + Essay rendered as larger editorial cards (date eyebrow + title + 2-line excerpt + category footer).
    - **"Notes"** — Note rendered as a dense 2-column grid of title-only tiles with `Mon DD` underneath.
  - Categories shown as metadata on cards only — no in-page filter chips (filtering via URL or follow-up category sub-routes).
  - Featured: surfaced via small badge on card, not as separate section.
  - Solves length-mixing by physical separation; commits to editorial voice over database voice.

#### Detail variants (stage at `/ddl/blog-detail-variants`)

- **Variant 1 — "Editorial banner" (Josh Comeau style)**
  - Centered hero: eyebrow `[type chip · lang chip · category]` → title → 1-line dek (from `excerpt`) → meta strip `date · readTimeMinutes · author`.
  - Inline TOC immediately below hero — auto-hidden for posts <800 words or type=Note.
  - Single-column prose (`max-w-[680px]` content column).
  - Code blocks: filename header + copy button + language label (already provided by `MarkdownService` Shiki output).
  - Footer: 3 related posts (by category match) + share row + JSON-LD `Article`.

- **Variant 2 — "Dan minimal" (Overreacted style)**
  - Left-aligned title, date directly underneath, straight into prose. No dek, no TOC, no read-time, no banner.
  - Same chrome for 200-word note and 2000-word deep-dive.
  - Footer: tags strip + share row + 3 related + JSON-LD.

- **Variant 3 — "Sticky meta rail"** *(reuse `landing-toc-sidebar`)*
  - 2-column layout: main prose column | right rail.
  - Right rail (desktop only, collapses to top on mobile <1024px): sticky `landing-toc-sidebar` + metadata block (date, read-time, category, tags, language) + share buttons that follow scroll.
  - Hero is left-aligned, compact; rail does the metadata heavy lifting.
  - Best for technical deep-dives with many H2s.

### Featured posts UX (open inside DDL stage)

Stage **both** treatments inside whichever list variant Phuong leans toward:

- **Treatment α — Filter chip**: `Featured only` chip in the filter bar; toggles a `?featured=1` URL filter; ranks featured posts first within the result set when off (i.e. soft pin), filters strictly when on.
- **Treatment β — Dedicated tab**: Segmented control above the list (`All / Featured`); featured is a true mode switch.

Decision deferred to DDL feedback. Both must work with URL params (Treatment α uses `?featured=1`, Treatment β uses `?tab=featured`).

### Per-post language (filter, not translate)

- `BlogPost.language` is `EN | VI`, fixed per record. No translation field, no per-locale variants.
- UI: language filter chip in list (default = show both). Detail page shows a `landing-chip` with the language code in the meta strip.
- Site global locale (if any) does **not** filter the blog; users see all languages by default, opt to filter.
- URL param `?lang=EN` or `?lang=VI`.

### Render pipeline (unchanged for this epic)

- `MarkdownService.render(markdown)` → `{ html, toc: TocEntry[] }`. Returns h2/h3 TOC entries.
- Detail page applies `landingProseAnchors` directive on the prose container with `[innerHTML]="html"`.
- Code blocks already Shiki-highlighted (github-dark, supports common languages).
- Variant 1 inline TOC + Variant 3 sticky TOC both consume the same `toc` payload.
- **Contract for task 314**: post-RTE swap, the detail components must still receive `{ html, toc }` from a unified service signature. Document this in the graduate-winner task acceptance criteria.

### SEO + JSON-LD

- **Meta tags**: `title`, `description`, `og:title`, `og:description`, `og:image` (from `featuredImageUrl`), `og:type=article`, `article:published_time`, `article:author`. Set via Angular `Meta` service inside `effect()` on post signal. Pattern source: `libs/landing/feature-about/src/lib/feature-about/feature-about.ts:100-113`.
- **JSON-LD**: `Article` schema (BlogPosting), SSR-injected only (`isPlatformServer` guard). Fields: `@type`, `headline`, `description`, `image`, `datePublished`, `dateModified`, `author { @type: Person, name, url }`, `publisher`, `mainEntityOfPage`. Add a `GetBlogPostJsonLdQuery` to the BE module mirroring the profile JSON-LD pattern (`apps/api/src/modules/profile/application/queries/get-json-ld.query.ts:10-27`).
- List page meta: static title `Writing | Phuong Tran` + description summarizing the blog. No `Article` JSON-LD on list page; consider `Blog` or `CollectionPage` if low-effort, otherwise skip.

### Share buttons (detail page footer)

- X (Twitter) intent URL, LinkedIn share URL, copy-link button (uses `landingCopyToClipboard` directive).
- Render as a small horizontal strip after prose body, before related posts.
- Use `landing-button kind="ghost"` + icon. No new dependencies.

### Related posts (detail page)

- Server-side: extend `GetPublicPostBySlugQuery` (or wrap with a separate query) to return `relatedPosts: BlogPostListItem[]` populated by **category match** — same primary category, exclude self, order by `publishedAt desc`, limit 3.
- If fewer than 3 matches by category, do not pad with recents (better to show 1-2 honest matches than fake relevance).
- Render below share row using same card style as list (small variant of `landing-post-card`).

### Seed posts (for DDL fidelity + content sparseness mitigation)

- 1 real post already exists in the database.
- Add **5-6 idempotent seed posts** via a prisma seed script extension. Stable slugs prefixed `seed-` so they're easy to identify and clean up later. Mix:
  - 1 Deep-dive (>1500 words, EN, multiple H2/H3 → triggers TOC on Variants 1 & 3)
  - 1 Retro (project build log, EN, ~600 words, embedded code blocks, links to a `/projects/<slug>`)
  - 1 Essay (opinion, VI, ~400 words, no code)
  - 2 Notes (<200 words each, mix EN + VI, no excerpt)
  - 1 Essay marked `featured: true` (to test Featured treatments)
- Cover all 4 categories ('Engineering', 'Process', 'Industry', 'Notes' — to be created in seed if not present).
- Seed authored by a known author (seed user from existing seed flow).
- Idempotent: `upsert` by `slug`. Re-running seed must not duplicate or trash CMS-authored content. Never touch posts whose slug does not start with `seed-`.

## Information Architecture (final shape, post-graduation)

```
/blog                          → BlogListPage (winner of A/B/C)
/blog?type=note                → filtered list
/blog?category=engineering     → filtered list
/blog?tag=ssr                  → filtered list
/blog?lang=VI                  → filtered list
/blog?featured=1               → featured filter active
/blog/:slug                    → BlogDetailPage (winner of 1/2/3)
```

Sub-routes (e.g. `/blog/category/:slug`) are **not** in scope; URL params are sufficient.

## High-Level Requirements

1. `/blog` route serves the list page (winner of DDL variants), replacing `ComingSoonPage`.
2. `/blog/:slug` route serves the detail page (winner of DDL variants).
3. List page supports filtering by type (4 categories), language (EN/VI), category, tag, and featured — all reflected in URL query params and shareable.
4. List page supports pagination (10 per page) via `landing-pagination`.
5. Detail page renders markdown via `MarkdownService` + Shiki with no visual regressions vs the existing `feature-blog/blog-detail-page` baseline (code blocks, links, images, headings, anchors all work).
6. Detail page shows: hero (per variant) → prose body → tags → share row → related posts → end.
7. Detail page injects `Article` JSON-LD on SSR only.
8. Detail page sets meta tags (`title`, `description`, `og:*`, `article:*`) via Angular `Meta` service.
9. Related posts (3 by category match) are returned by the BE on detail fetch.
10. Seed script provides 5-6 placeholder posts spanning all voice types and both languages.
11. DDL pages `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` ship all three variants each, side-by-side, using the same seeded data. Both pages register in `DDL_SUBROUTES` and follow the existing `showcase / prototypes / usage` tab convention.
12. All six DDL variants must work on mobile (responsive at 360px, 768px, 1280px breakpoints). Variant 3 sticky rail collapses to top of body on mobile.
13. Existing `feature-blog` library is replaced (not deleted — old pages stay until winner graduates, then are deleted in the graduation task) per the "DDL pages stay after graduation" rule for the DDL pages themselves; the production `feature-blog` lib gets refactored to host only the winner.
14. E2E coverage (Playwright, POM) for list page (load + filter + paginate + click-through to detail) and detail page (render + TOC + share + related + JSON-LD presence in SSR output).
15. SEO meta tags + JSON-LD verified in SSR'd HTML (curl test or Playwright HTML snapshot, not just client-side).

## Technical Considerations

### Architecture

- **Frontend** (`libs/landing/feature-blog/`): Angular standalone components, signals, `ChangeDetectionStrategy.OnPush`. New components: `BlogListPage` (replaces existing), `BlogDetailPage` (replaces existing), `BlogPostCard` (new shared, may belong in `libs/landing/shared/ui/` if reused), `BlogShareRow` (new), `BlogRelatedPosts` (new, may inline).
- **Shared UI**: reuse `landing-page-shell`, `landing-page-hero`, `landing-breadcrumb`, `landing-eyebrow`, `landing-chip`, `landing-card`, `landing-figure`, `landing-pull-quote`, `landing-section-rule`, `landing-toc-sidebar`, `landing-pagination`, `landing-filter-chip`, `landing-results-count`, `landing-empty-state`, `landingProseAnchors` directive, `landingCopyToClipboard` directive.
- **Data access** (`libs/landing/shared/data-access/`): extend `BlogPostDetail` interface to include `relatedPosts: BlogPostListItem[]` if not already present (verify).
- **Backend** (`apps/api/src/modules/blog-post/`): add `GetBlogPostJsonLdQuery` + handler. Update `GetPublicPostBySlugQuery` (or add a wrapper) to populate `relatedPosts` field with 3 category-matched posts.
- **Routing**: `app.routes.ts:31-33` swap from `ComingSoonPage` to `loadChildren: () => import('@portfolio/landing/feature-blog').then((m) => m.BLOG_ROUTES)`. Do this in the graduation task only.
- **DDL routing**: add entries to `DDL_SUBROUTES` constant in `apps/landing/src/app/pages/ddl/ddl.component.ts`.

### Component Domain Separation (per CLAUDE.md)

- All new components in this epic are **`landing-*` prefixed** (landing page domain).
- Do not import or create Angular Material components anywhere in landing-blog code.

### Subpage Canonical Structure (per project memory)

```html
<article>
  <header>
    <landing-breadcrumb [items]="..." />
    <landing-page-hero [eyebrowLabel]="...">
      <ng-container hero-heading>...</ng-container>
      <p hero-lede>...</p>
    </landing-page-hero>
  </header>
  <section aria-labelledby="...">...</section>
  <!-- more sections as needed -->
</article>
```

Wrap with `landing-page-shell` which provides this structure plus the container + footer slot.

### Typography Discipline (per CLAUDE.md guardrail)

- **Only** `text-display-{xl|lg|md|sm}`, `text-body-{xl|lg|md|sm}`, `text-mono-{md|sm}` and `--landing-*` CSS vars permitted in landing-blog code. The shared `text-{2xs..5xl}` scale and console role classes (`.text-page-title` etc.) are banned.

### 4px Grid (per CLAUDE.md guardrail)

- All fixed px values multiples of 4. Use Tailwind utilities preferentially.

### Dependencies

- `marked` + `shiki` already loaded by `MarkdownService` — no new deps.
- No new packages.

### Data Model (no schema changes)

All requirements satisfied by existing `BlogPost`, `PostCategory`, `PostTag`, `Category`, `Tag`, `Media`, `User` tables.

### SSR + Hydration

- All blog routes must be SSR-rendered (Angular SSR is already configured for landing).
- HTTP transfer cache must populate from SSR fetch — verify per `.context/landing-ssr.md` rules.
- JSON-LD injected only on the server (`isPlatformServer` guard) so client doesn't double-inject.

## Risks & Warnings

⚠️ **DDL variant decision is downstream**
- Tasks 1-6 produce the DDL stage. Task 7 ("graduate winner") cannot be written with a concrete component name until Phuong picks. Task 7 is **placeholder** in the breakdown until the pick happens.
- Don't graduate prematurely. Wait for the comparison conversation.

⚠️ **Replace, don't extend**
- The existing `libs/landing/feature-blog/blog-list-page` and `blog-detail-page` are **not** reused. Data layer (`BlogDataService`, types) stays. Old pages can be deleted in the graduation task or after — coordinate with task 314 (RTE swap) so the swap target is the new winner, not the deprecated pages.

⚠️ **Featured-post UX trap**
- Magazine-style featured hero violates personal-blog conventions and was explicitly rejected by Phuong. Do **not** add a hero strip back in any variant under any name. Featured posts surface only via filter chip (Treatment α) or tab (Treatment β).

⚠️ **Mixed-length list rendering**
- Variant A is the only one that explicitly handles short notes adapting density. Variants B and C handle it via separate visual zones. Variant 2 (Dan minimal) deliberately ignores the problem. If you find yourself wanting to "tweak" Variant A to look more like a uniform card grid, stop — that defeats the entire point of staging this variant.

⚠️ **Per-post language is NOT a global toggle**
- Do not surface a language switcher that *translates* the post. The label "language filter" must be unambiguous (e.g. "Show only: EN | VI | both").

⚠️ **SSR JSON-LD injection**
- Must guard with `isPlatformServer`. Otherwise client re-injects `<script>` tags on hydration → duplicate JSON-LD in DOM, SEO confusion.

⚠️ **Seed safety**
- Seed script must be **idempotent** (`upsert` by slug) and must **never delete or modify** posts whose slug does not start with `seed-`. CMS-authored content must be safe across re-seeding.

⚠️ **Mobile pagination + filter bar collisions**
- Filter bar in Variant A could become unwieldy on mobile (4 chip groups). Plan for responsive collapse (e.g. into a single `landing-select` or a horizontal scroll strip with snap points).

⚠️ **Variant 3 (sticky rail) breaks below 1024px**
- Document the breakpoint in the variant. Below 1024px, rail must collapse to top of body or be hidden. Don't ship a half-broken sticky rail at narrow widths.

⚠️ **`MarkdownService` is async** — `render()` returns a Promise. Detail page must `await` or use `from()` to resolve before render. Verify SSR doesn't double-fetch or block hydration.

## Alternatives Considered

### Extend existing `feature-blog` pages instead of replacing
- **Pros:** less file churn, preserves any test coverage on old pages.
- **Cons:** old pages use the early-blog style that pre-dates the mature design system (about, projects), use components not aligned with current conventions, and bake in assumptions (e.g. always-on sidebar TOC) that contradict the variant exploration this epic exists to do.
- **Why not chosen:** the variants must be radically different from each other to be a meaningful comparison. Extending forces baseline assumptions; replacing lets variants be honest.

### Skip DDL staging; pick one variant in the epic and build directly
- **Pros:** faster, fewer files.
- **Cons:** Phuong's track record (per memory `feedback_ddl_as_sandbox`) is that DDL comparison consistently produces a better final design than picking blind, especially when 4 voice types compound the design problem.
- **Why not chosen:** the design-problem complexity (4 voices, filter UX, featured treatment, sticky-vs-inline TOC) is exactly the type of decision DDL exists for.

### Magazine featured hero (1 large featured card at top)
- **Pros:** familiar pattern, draws attention.
- **Cons:** every personal-blog reference in the peer survey deliberately avoids this; Phuong has rejected it twice in this discussion.
- **Why not chosen:** explicit user decision.

### Build RTE renderer swap (task 314) inside this epic
- **Pros:** end-to-end finish; one shipping moment.
- **Cons:** doubles the epic scope, blocks blog launch on RTE work that has its own upstream deps (305/308/310/311), and conflates "layout decision" with "renderer swap" — two unrelated risks.
- **Why not chosen:** decoupled by design. This epic ships with `MarkdownService`; task 314 swaps the renderer later behind a stable layout.

## Success Criteria

- [ ] `/blog` route shows real list page (winner variant) with seeded + real posts rendering correctly.
- [ ] `/blog/:slug` route shows real detail page (winner variant) with markdown rendering, TOC (where applicable), tags, share, related.
- [ ] All 4 post types render visibly different in the list (chip + density treatment as per winner variant).
- [ ] Filter by type, category, tag, language, featured all work via URL params; filters survive page refresh.
- [ ] Pagination works at page boundaries (>10 posts in seed flow).
- [ ] `Article` JSON-LD present in SSR HTML for any `/blog/:slug` curl request (verifiable).
- [ ] Meta tags (`title`, `description`, `og:image`) present and correct in SSR HTML.
- [ ] Share buttons (X, LinkedIn, copy-link) work in browser.
- [ ] Related posts (3 by category) appear when present; gracefully shows fewer when fewer matches.
- [ ] DDL pages `/ddl/blog-list-variants` + `/ddl/blog-detail-variants` ship all variants and stay in DDL after graduation (per `feedback_ddl_keep_after_graduate`).
- [ ] Mobile (360px, 768px) renders cleanly for winner variant — no overflow, no sticky-rail breakage.
- [ ] Playwright E2E covers list (load, filter, paginate, click) and detail (render, TOC if present, share, related, SSR meta presence).
- [ ] Existing `epic-blog-post` console editor still works end-to-end (no regression).
- [ ] Lighthouse on `/blog` and `/blog/:slug` returns reasonable SEO + perf (≥90 both).

## Estimated Complexity
**L** — large, multi-task, spans BE (small JSON-LD + related-posts work), seed, DDL staging (6 variants), production graduation, SEO wiring, E2E.

**Reasoning:** Not XL because schema is stable, BE module is shipped, data layer is typed, and component primitives are all in the shared lib. The size comes from staging 6 distinct variants and the post-graduation refactor. If Phuong picks Variant 3 (sticky rail), complexity is at the upper end of L because of mobile collapse work.

## Task Breakdown (preview — finalize via `/ctx:breakdown`)

Ordered for parallelism where possible.

1. **Seed posts** — extend `prisma/seed.ts` (or sibling) with idempotent seed of 5-6 `seed-*` posts covering all 4 voices + both languages + 1 featured. Categories created if absent.
2. **BE: related-posts query** — extend `GetPublicPostBySlugQuery` to populate `relatedPosts` (3, by primary category). Update DTO.
3. **BE: blog JSON-LD query** — `GetBlogPostJsonLdQuery` + handler + controller endpoint (`/api/blog/:slug/json-ld` or include in detail response — decide in task).
4. **DDL: list variants page** — `/ddl/blog-list-variants` with all 3 variants (A, B, C) side-by-side. Both Featured treatments (α, β) shown inside whichever variant they apply to.
5. **DDL: detail variants page** — `/ddl/blog-detail-variants` with all 3 variants (1, 2, 3) side-by-side. Same post used across all three so visual comparison is fair.
6. **User pick** — Phuong reviews DDL, picks list winner + detail winner + featured treatment. Not a code task — gated by review.
7. **Graduate list winner** — replace `BlogListPage` in `libs/landing/feature-blog/` with winner variant. Wire SEO meta + JSON-LD (if `Blog` collection schema chosen).
8. **Graduate detail winner** — replace `BlogDetailPage` with winner variant. Wire SEO meta + `Article` JSON-LD (SSR-guarded). Wire share row + related posts.
9. **Route swap** — `apps/landing/src/app/app.routes.ts:31-33`: replace `ComingSoonPage` with `BLOG_ROUTES`. Verify SSR.
10. **E2E** — Playwright POM for list (load, filter, paginate, click-through) and detail (render, TOC if present, share buttons, related, SSR-injected JSON-LD via HTML snapshot).
11. **Cleanup** — remove deprecated old `BlogListPage` / `BlogDetailPage` from `feature-blog` lib (replaced by winner). DDL pages stay (per memory rule).

Tasks 1, 2, 3 can run in parallel. Tasks 4 + 5 in parallel after 1 (need seed for fidelity). Task 6 is a review gate. Tasks 7 + 8 + 9 are sequential within the graduation step. Tasks 10 + 11 last.

## Status
completed

> Broken down into tasks 346-356 on 2026-05-24. Pivot afternoon 2026-05-24 appended 357-359. Closed 2026-05-28 (task 356). Winners: list V1+V3 hybrid, detail V4, featured γ. DDL pages `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` kept in place. Carry-over: 359 (console form validation) tracked in `progress.md` under Portfolio Blog follow-up.

## Created
2026-05-24

## Completed
2026-05-28
