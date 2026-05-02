# Task: /404 page (typographic, on-brand)

## Status: pending

## Goal
Build a typographic 404 page that matches the visual signature — no generic SaaS 404 art, no "oops" cliché.

## Context
Final sub-page in the V1 set. Wildcard route in app.routes redirects here.

## Acceptance Criteria
- [ ] Eyebrow `404 · NOT FOUND` mono caps
- [ ] H1 — short, in voice (no "Oops!", no "We couldn't find that"). Example direction: "This page doesn't exist (yet)."
- [ ] Sub-line in Newsreader serif italic (1 sentence)
- [ ] 2 `landing-link` items: back to `/` and to `/projects`
- [ ] Sub-page quiet tone — no imagery, no blueprint
- [ ] HTTP 404 status sent on SSR, not 200

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
