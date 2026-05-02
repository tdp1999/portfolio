# Task: Landing routing scaffold + layout shell (H2 plain-text header)

## Status: pending

## Goal
Wire the 8-route table from E2 with lazy-loaded sub-pages and render the persistent `<landing-shell>` containing the H2 plain-text transparent header and footer signature.

## Context
E4 locks H2 Plain Text header (transparent, no border under bar; active item = indigo color only, no underline/pill/box). Multi-page list from E2 = 8 routes. Empty pages route correctly here; content lands in later tasks.

## Acceptance Criteria
- [ ] Route table in `apps/landing/src/app/app.routes.ts` covers: `/`, `/projects`, `/projects/:slug`, `/uses`, `/colophon`, `/404`, plus wildcard redirect to `/404`
- [ ] All sub-page routes lazy-load their feature module
- [ ] `<landing-shell>` component renders header + `<router-outlet>` + footer signature
- [ ] Header: wordmark left + 5 nav items (Home, Projects, Uses, Colophon, plus 1 reserved slot) + right group (theme toggle from task 275 · lang switcher stub · CTA text-link · ⌘K mono hint stub)
- [ ] Header is sticky, fully transparent (no background, no bottom border), z-index above content
- [ ] Active nav item: indigo color only — no underline, pill, or border indicator
- [ ] Overflow handling: any 6th+ nav item collapses into "More ▾" dropdown
- [ ] Footer signature line renders on every page: mono caps slate, e.g. `// PORTFOLIO · 2026 · BUILT BY <NAME>`

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
