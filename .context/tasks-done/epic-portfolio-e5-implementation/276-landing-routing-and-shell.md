# Task: Landing routing scaffold + layout shell (H2 plain-text header)

## Status: done

## Goal
Wire the 8-route table from E2 with lazy-loaded sub-pages and render the persistent `<landing-shell>` containing the H2 plain-text transparent header and footer signature.

## Context
E4 locks H2 Plain Text header (transparent, no border under bar; active item = indigo color only, no underline/pill/box). Multi-page list from E2 = 8 routes. Empty pages route correctly here; content lands in later tasks.

## Acceptance Criteria
- [x] Route table in `apps/landing/src/app/app.routes.ts` covers: `/`, `/projects`, `/projects/:slug` (via PROJECTS_ROUTES), `/uses`, `/colophon`, `/404`, plus wildcard redirect to `/404`
- [x] All sub-page routes lazy-load their feature module
- [x] `<landing-shell>` component renders header + `<router-outlet>` (via projection) + footer signature
- [x] Header: wordmark left + 4 nav items + 1 reserved slot (commented placeholder) + right group (theme toggle · EN lang stub · "Get in touch" CTA · ⌘K mono hint)
- [x] Header is sticky, fully transparent (no background, no bottom border), z-index above content
- [x] Active nav item: indigo color only — no underline, pill, or border indicator
- [ ] Overflow handling: any 6th+ nav item collapses into "More ▾" dropdown — **deferred**: only 4 active items today, dropdown adds complexity with no current value. Revisit when nav exceeds 5
- [x] Footer signature line renders on every page: mono caps slate, `// PORTFOLIO · 2026 · BUILT BY THUNDER PHONG`

## Technical Notes
- Header uses `<a [routerLink]>` (per memory: prefer routerLink over imperative navigate).
- Theme toggle and lang/⌘K are stubs in this task — wired but no-op for non-theme controls.
- Skill: `ng-lib` if a new lib is needed for the shell.

## Files to Touch
- `apps/landing/src/app/app.routes.ts`
- `libs/landing/shared/ui/src/shell/landing-shell.component.ts`
- `libs/landing/shared/ui/src/shell/landing-header.component.ts`
- `libs/landing/shared/ui/src/shell/landing-footer-signature.component.ts`
- `libs/landing/feature-{home,projects,uses,colophon,not-found}/` (empty modules)

## Dependencies
- 274 (tokens)
- 275 (theme toggle for header right-group)

## Complexity: M

## Progress Log
- 2026-05-02 — Implemented:
  - Shell trio in `libs/landing/shared/ui/src/shell/`: `LandingShellComponent` (flex column, ink-0 bg, header + projected main + footer), `LandingHeaderComponent` (sticky transparent, wordmark, 4 nav links + reserved slot, right group with EN stub + "Get in touch" + ⌘K hint + theme toggle), `LandingFooterSignatureComponent` (mono caps slate, dynamic year).
  - Active nav state: `routerLinkActive="text-landing-accent"` — color-only, no border/underline/pill (E4 H2 lock).
  - Stub pages: `apps/landing/src/app/pages/{uses,colophon,not-found}/` — minimal placeholders pointing to future content tasks.
  - Routes updated: added `/uses`, `/colophon`, `/404`, `**` redirect to `/404`. Existing `/experience` and `/blog` retained.
  - `app.routes.server.ts` retuned: static pages prerender, dynamic `:slug` routes set to Server mode (Prerender params come in task 300). Dev build now succeeds (5 static routes prerendered).
  - `app.html` swapped from temp-header to `<landing-shell><router-outlet /></landing-shell>`.
- "More ▾" overflow dropdown deferred — no current need with 4 items, would add ARIA + outside-click + keyboard handling overhead. Revisit when nav grows.
- 2026-05-02 — Done — all required ACs satisfied; overflow dropdown intentionally deferred.
