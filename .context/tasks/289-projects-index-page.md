# Task: /projects index page (B3.c stacked editorial)

## Status: pending

## Goal
Render the `/projects` index showing the full archive in B3.c stacked-editorial layout: each project a row with year, name, role, 1-line summary, link to detail page.

## Context
B3.c was reserved in E4 for this route specifically — the home only shows 3 curated projects via B3.d, full archive lives here.

## Acceptance Criteria
- [ ] Page header: eyebrow + H1 ("Projects" or per E2 label) + 1-line page subline
- [ ] List: each project a row with year (mono caps left), project name (sans bold), role/employer (slate), 1-line summary (Newsreader italic if E2 specifies), `→` link to `/projects/:slug`
- [ ] 1px hairline rule between rows
- [ ] Sub-page tone: quieter (D1 rule) — no B2.c lift, accent restricted to row-link arrow on hover
- [ ] All projects from API listed regardless of `featured` flag — full archive
- [ ] Empty state if no projects: "No projects yet" copy

## Technical Notes
- Pull projects via `ProjectService.list()`; sort by year desc by default.
- Page is statically prerenderable — content is bounded.

## Files to Touch
- `libs/landing/feature-projects-index/src/projects-index.page.ts`
- `apps/landing/src/app/app.routes.ts` (lazy-load wire-up)

## Dependencies
- 274, 276, 278
- 277 (Project API)

## Complexity: M

## Progress Log
