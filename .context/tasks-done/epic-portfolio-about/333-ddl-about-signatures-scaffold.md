# Task: `/ddl/about-signatures` page scaffold (3 sections, placeholder variants)

## Status: done

## Goal
Create the DDL sandbox page that stages 3 signature elements (depth-map, failures, currently-shipping) as side-by-side variants. Per epic, this is the staging ground for visual comparison before graduating winners into `/about`.

## Context
Per project rule "DDL as exploration sandbox": when uncertain on UI direction, stage 2-4 variants on `/ddl/<topic>` for comparison. This task creates the page shell; tasks 334-336 populate each section with actual variants. Page stays after graduation per "DDL pages stay after graduation" rule.

## Acceptance Criteria
- [x] Route `/ddl/about-signatures` registered as a child of the DDL routes config
- [x] Page component `DdlAboutSignaturesPage` renders 3 clearly separated sections with headers:
  - "1. Depth map" — placeholder content + comparison container ready
  - "2. Failures & lessons" — same
  - "3. Currently shipping" — same
- [x] Each section has space for 2-3 variants side-by-side (or stacked with clear dividers on narrow viewports)
- [x] Section anchor links (`#depth-map`, `#failures`, `#currently-shipping`) and a small in-page TOC at the top
- [x] Inline note per section: "Winner: TBD" — to be updated with `Winner: Variant N (graduated to /about YYYY-MM-DD)` when task 337 graduates
- [ ] Type-check + landing prod build clean

## Technical Notes
- Mirror existing DDL pages (`/ddl/story-variants`, `/ddl/bio-card-grid`, `/ddl/hero-variants`) for layout convention.
- Each variant block uses a `BrowserWindowComponent` chrome OR a labeled `CardComponent` for visual separation — check what existing DDL pages use; prefer consistency.
- Add to DDL index page (`/ddl`) so it's discoverable.
- Page is purely a sandbox; no real `/about` rendering happens here.

## Files to Touch
- `apps/landing/src/app/features/ddl-about-signatures/` (new) OR `libs/landing/feature-ddl/...` depending on current DDL structure — audit
- `apps/landing/src/app/app.routes.ts` (add child route under `/ddl`)
- DDL index page (audit for the right file)

## Dependencies
- 329 (feature-about lib exists — DDL variants will import experimental components from it)

## Complexity: S

## Progress Log
- 2026-05-22 Created `apps/landing/src/app/pages/ddl/about-signatures/` page with bordered header (breadcrumb + title + lede + in-page TOC) and three sections — `#depth-map`, `#failures`, `#currently-shipping`. Each section block: `landing-eyebrow` (NN · Title) + display-sm heading + summary + "Open question:" prompt + "Winner: TBD" mono line + 3-card variant grid (`grid-auto-fit minmax(280px, 1fr)`, dashed placeholder stages, single column on narrow viewports). Cards mirror the `bio-improvements` chrome (bordered surface card, dashed stage inside, mono labels + body-sm hints). Per-section "Open question" baked into the data so the design dialogue is visible on the page itself.
- 2026-05-22 Registered `/ddl/about-signatures` in `app.routes.ts` and added a discoverability entry in `ddl.component.ts` under the `compositions` subroute group (next to other page-level section explorations like story-variants, philosophy-strip, get-in-touch).