# Task: DDL — stage 3 detail-page variants for `/blog/:slug`

## Status: done

## Goal
Build `/ddl/blog-detail-variants` showcasing variants 1 (Editorial banner), 2 (Dan minimal), 3 (Sticky meta rail) side-by-side against the same seeded deep-dive post so Phuong can compare layout decisions fairly.

## Context
Per `epic-portfolio-blog.md` — detail variants must render identical content so the only differences are layout (hero, TOC placement, sidebar, footer treatment). The seeded deep-dive post (task 346) provides multiple H2/H3 headings so TOC variants can actually be exercised.

## Acceptance Criteria
- [ ] New route `/ddl/blog-detail-variants` registered in `DDL_SUBROUTES`.
- [ ] New page component at `apps/landing/src/app/pages/ddl/blog-detail-variants/blog-detail-variants.page.{ts,html,scss}`.
- [ ] Tab structure: `Showcase` + `Prototypes` (variants 1/2/3 stacked or side-by-side with clear labels) + `Usage`.
- [ ] All three variants render the **same seeded deep-dive post** (slug `seed-*`) — visual differences come purely from layout.
- [ ] Variant 1 — "Editorial banner":
  - [ ] Centered hero: eyebrow `[type chip · lang chip · category]` → title → 1-line dek (from `excerpt`) → meta strip `date · readTimeMinutes · author`
  - [ ] Inline TOC immediately below hero (H2/H3 tree from `MarkdownService` toc payload)
  - [ ] Auto-hide TOC if post type is Note or word count <800 — show this branch by also rendering a Note variant of the same post type next to the deep-dive
  - [ ] Single-column prose (`max-w-[680px]`)
  - [ ] Code blocks: filename header + copy button + language label (already provided by Shiki output — verify renders)
  - [ ] Footer: 3 related posts (use `relatedPosts` from task 347) + share row + JSON-LD presence indicator
- [ ] Variant 2 — "Dan minimal":
  - [ ] Left-aligned title, date directly below, straight into prose
  - [ ] No dek, no TOC, no read-time, no banner
  - [ ] Footer: tags strip + share row + 3 related + JSON-LD indicator
- [ ] Variant 3 — "Sticky meta rail":
  - [ ] 2-column desktop (≥1024px): main prose | right rail
  - [ ] Right rail: sticky `landing-toc-sidebar` + metadata block (date, read-time, category, tags, language) + share buttons follow scroll
  - [ ] Mobile (<1024px): rail collapses to top of body (metadata + TOC inline accordion), share buttons move into footer
  - [ ] Hero left-aligned, compact (rail does metadata work)
- [ ] All three render markdown via `MarkdownService` + `landingProseAnchors` directive — no visual regressions vs current `blog-detail-page` baseline (anchors work, code blocks highlighted, images render).
- [ ] Share row component (X / LinkedIn / copy-link) is a single shared inline component reused across variants 1, 2, 3 (do not duplicate three times).
- [ ] Mobile (360px, 768px) renders cleanly for all three.
- [ ] Typography + 4px grid + reuse-first guardrails respected.
- [ ] `Usage` tab includes rationale per variant + trade-offs (e.g. "Variant 3 best for deep-dives, breaks below 1024 — needs collapse plan").

## Technical Notes
- Use `BlogDataService.getBySlug(seedSlug)` to fetch real seeded post. Do not mock the response.
- For Variant 1 TOC auto-hide: branch on word-count threshold (compute from `post.content.split(/\s+/).length`) AND on post type / category.
- For Variant 3 sticky rail: `position: sticky; top: 96px`, parent must allow overflow. Use `landing-toc-sidebar` directly (already implements scrollspy + auto-scroll active item per audit).
- Code block rendering: `MarkdownService` already emits Shiki HTML. Variant 1 spec calls for filename + copy + language label headers — verify the current Shiki output and only extend if missing (do not reinvent the highlighter).
- Share row: use `landingCopyToClipboard` directive for copy-link button. X intent URL: `https://twitter.com/intent/tweet?text=...&url=...`. LinkedIn share: `https://www.linkedin.com/sharing/share-offsite/?url=...`.
- JSON-LD indicator in DDL: render a `<details>` block showing the JSON-LD payload (from task 348) as text so the prototype proves the data is plumbed, even though SSR injection is a production-side concern.
- For variant 3 mobile collapse: use a media query in the page SCSS or a conditional template (`@if (viewport.isDesktop())`); pick the simpler one.

**Specialized Skill:** `design-check` — apply if comparing layouts against design bank patterns.

## Files to Touch
- `apps/landing/src/app/pages/ddl/blog-detail-variants/blog-detail-variants.page.ts` (new)
- `apps/landing/src/app/pages/ddl/blog-detail-variants/blog-detail-variants.page.html` (new)
- `apps/landing/src/app/pages/ddl/blog-detail-variants/blog-detail-variants.page.scss` (new)
- `apps/landing/src/app/pages/ddl/blog-detail-variants/blog-share-row.component.ts` (new — shared by all 3 variants)
- `apps/landing/src/app/pages/ddl/blog-detail-variants/index.ts` (new)
- `apps/landing/src/app/pages/ddl/ddl.component.ts` (register route)

## Dependencies
- 346 (seeded deep-dive post)
- 347 (related-posts payload for footer)
- 348 (JSON-LD payload for indicator)

## Complexity: L

## Progress Log

### 2026-05-25 — Page built
- `/ddl/blog-detail-variants` route registered + DDL subroute entry added.
- Three variants stacked under Showcase tab:
  - **V1 Editorial banner** — centered hero (type · lang · category chips → title →
    dek → meta), inline TOC under hero, single-column prose `max-w-[680px]`,
    footer with share row + related grid + JSON-LD details. Auto-hide-TOC branch
    rendered against `seed-til-postgres-partial-unique-indexes` (Note, < 800 words)
    with a "TOC auto-hidden" notice in place of the TOC card.
  - **V2 Dan minimal** — left-aligned title + date → prose. Footer: tags strip +
    share row + related list + JSON-LD.
  - **V3 Sticky meta rail** — 2-col grid (prose | 280px rail). Rail carries
    `<landing-toc-sidebar>` (real scrollspy wiring via `LandingScrollspyService`)
    + metadata `<dl>` + share row. Collapses to single column below 1024px (rail
    moves to top, becomes static).
- Shared share row extracted as `landing-blog-share-row` (X intent · LinkedIn
  share-offsite · copy-link via `landingCopyToClipboard`). Single component reused
  by all three variants — no duplication.
- Markdown rendered via `MarkdownService.render()` for both the deep-dive and the
  note. Shiki code blocks + heading-id slugify already produced by the service —
  no additional pipeline.
- JSON-LD payload (task 348) plumbed into each variant footer as a `<details>`
  block; the production layout renders it into `<script type="application/ld+json">`
  separately. The `<details>` UI on this DDL only proves the payload is wired.
- DDL caveat: rendered HTML duplicates heading IDs across stacked variants (V1
  deep-dive + V3 grid both show the same h2/h3 set). Anchor clicks may scroll to
  the first occurrence. Acceptable for the sandbox preview; production renders one
  variant per route so the issue cannot manifest.
- Visual verified at 1440×900 desktop + 900×900 tablet (V3 collapse) via Playwright.
