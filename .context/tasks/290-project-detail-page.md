# Task: /projects/:slug detail page (D3.c sticky sidebar)

## Status: pending

## Goal
Build the project detail page in D3.c layout: full-width hero screenshot, left sticky sidebar (ToC + metadata + links), right ~680px reading column with section headings, body, figures, pull-quote, and next-project footer.

## Context
The single most-detailed page in V1. All 3 V1 projects use this uniformly — Console MVP justifies the depth, the other 2 stretch to match (good forcing function for content quality).

## Acceptance Criteria
- [ ] Hero: full-width beautified screenshot inside browser-window chrome on bg-ink-1, ~96px padding around it
- [ ] Body: 2-column layout — left sticky sidebar ~220px, right reading column ~680px, gap per grid
- [ ] Sidebar block 1 — "ON THIS PAGE" mono caps eyebrow + ToC list rendered from `Project.tocAnchors`; active item indigo on scroll (IntersectionObserver)
- [ ] Sidebar block 2 — "METADATA" eyebrow + stacked rows: ROLE / STACK / YEAR / STATUS sourced from project data
- [ ] Sidebar block 3 — "LINKS" eyebrow + vertical `landing-link` list from `Project.links` (each with `↗` arrow); ordered repo / demo / case-study / doc / post
- [ ] Reading column — eyebrow + H1 + Newsreader serif italic deck + hairline rule + section headings (mono caps small) iterating over `Project.sections` + section bodies (markdown rendered to sans 17px line-height 1.7)
- [ ] In-column `landing-figure` placements where section body references one (markdown extension or component-driven mapping)
- [ ] At least one `landing-pull-quote` per project (Newsreader italic + 2px indigo left border)
- [ ] Footer line: `// PROJECTS · 0X OF 0Y · NEXT: <NEXT PROJECT NAME>` mono caps slate with indigo arrow → `/projects/:next-slug`
- [ ] Anchor scroll on direct link (`/projects/foo#approach`) lands at section heading
- [ ] SSR renders ToC inert; client wires IntersectionObserver after hydration

## Technical Notes
- Reference: `assets/moodboard/stitch-b1/D3c-sticky-sidebar.png`.
- Markdown rendering: pick an existing pipeline if console already has one (e.g. for blog), else `marked` + `dompurify` minimal setup.
- Sticky sidebar uses `position: sticky; top: <header offset>`.
- Pre-render route per project for SSR.

## Files to Touch
- `libs/landing/feature-project-detail/src/project-detail.page.ts`
- `libs/landing/feature-project-detail/src/sidebar/project-sidebar.component.ts`
- `libs/landing/feature-project-detail/src/sidebar/toc-active.directive.ts`
- `libs/landing/feature-project-detail/src/reading/project-reading.component.ts`
- `libs/landing/feature-project-detail/src/markdown.pipe.ts` (or reuse)
- `apps/landing/src/app/app.routes.ts`

## Dependencies
- 274, 276, 278, 279, 280
- 277 (Project.links / sections / tocAnchors via API)

## Complexity: L

## Progress Log
