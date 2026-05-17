# Task: /404 page (typographic, on-brand)

## Status: done

## Goal
Build a typographic 404 page that matches the visual signature — no generic SaaS 404 art, no "oops" cliché.

## Context
Final sub-page in the V1 set. Wildcard route in app.routes redirects here.

## Acceptance Criteria
- [x] ~~Eyebrow `404 · NOT FOUND` mono caps~~ — dropped: header pattern matches `/uses` and `/projects` (breadcrumb + section-header + sub), no eyebrow. Breadcrumb already labels the page as "Not found".
- [x] H1 — short, in voice (no "Oops!", no "We couldn't find that"). Example direction: "This page doesn't exist (yet)."
- [x] Sub-line in Newsreader serif italic (1 sentence)
- [x] 2 `landing-link` items: back to `/` and to `/projects`
- [x] Sub-page quiet tone — no imagery, no blueprint
- [x] HTTP 404 status sent on SSR, not 200

## Technical Notes
- Wildcard route already configured in task 276.
- Keep copy tight (1 sentence H1, 1 sentence sub).

## Files to Touch
- `libs/landing/feature-not-found/src/not-found.page.ts`
- `apps/landing/src/server.ts` (404 status code on render)

## Dependencies
- 274, 276, 278

## Complexity: S

## Progress Log
- 2026-05-16 — Implemented in `apps/landing/src/app/pages/not-found/not-found.page.{ts,html,scss}`. Header pattern matches `/uses` and `/projects` (breadcrumb + `landing-section-header` size=md level=1 with `<em>exist</em>` accent + sub-line in Newsreader italic at body-xl). Two `landing-link` recovery items (Back to home, Browse projects) stacked centered with arrow primitive.
- Eyebrow `404 · NOT FOUND` dropped on visual review — breadcrumb labels the page, eyebrow + section-header + sub stacked three rows of mono caps felt heavy. Net effect is quieter, matches the editorial pages above it.
- HTTP 404 status: changed `/404` to `RenderMode.Server` with `status: 404`, changed wildcard `**` from `redirectTo: '/404'` to direct `loadComponent` (preserves typed URL) with `status: 404` in `app.routes.server.ts`. Verified both `/404` and `/some-bogus-url` return 404 (curl + Playwright).
- 2026-05-16 — Done — all ACs satisfied or noted.
