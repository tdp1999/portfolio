# Task: Landing interactive primitives (button, link, icon-arrow)

## Status: done

## Goal
Build the 3 interactive primitives every page composes from: button (3 variants), link (text with arrow variants), and the arrow icon used in indigo accent moments.

## Context
Per CLAUDE.md: landing pages MUST use `landing-*` components exclusively. These three are the workhorses — every CTA, nav item, link list, and "view more" arrow uses them.

## Acceptance Criteria
- [x] `landing-button` (selector `landing-button`): variants `solid` (indigo bg, white text), `ghost` (transparent + 1px hairline border), `link` (inline text-style); sizes sm/md; disabled state; focus ring per tokens
- [x] `landing-link` (selector `landing-link`): plain text link, optional trailing arrow (`→` for same-domain, `↗` for external); active state in indigo (color only); hover changes color, never adds underline (per E4 rule)
- [x] `landing-icon-arrow` (selector `landing-icon-arrow`): SVG icon component, two glyph variants (`right`, `up-right`); inherits currentColor; aria-hidden by default
- [x] All standalone Angular components, signal inputs, OnPush change detection
- [x] All testable on `/ddl` route with light + dark themes

## Technical Notes
- Use Angular v21+ syntax: `input()`, `output()`, signals, control flow (`@if`/`@for`).
- No box-shadow on solid button (project rule); solid button hover = brighten accent by 10%.
- Refer to component-bank skill before authoring — check if a primitive doc exists; if not, suggest creating one after the component lands.

## Files to Touch
- `libs/landing/shared/ui/src/button/landing-button.component.ts`
- `libs/landing/shared/ui/src/link/landing-link.component.ts`
- `libs/landing/shared/ui/src/icon/landing-icon-arrow.component.ts`
- `apps/landing/src/app/ddl/ddl-primitives.component.ts` (showcase)

## Dependencies
- 274 (tokens for color/type/motion)
- 276 (shell renders these in header)

## Complexity: M

## Progress Log
- [2026-05-03] Refit `landing-button` to solid/ghost/link × sm/md, OnPush, landing tokens; no box-shadow on solid; hover brightens accent.
- [2026-05-03] Replaced legacy `landingLink` directive with `<landing-link>` component (RouterLink for internal, target=_blank for external, color-only hover, no underline, indigo active).
- [2026-05-03] Added `<landing-icon-arrow>` SVG primitive (right / up-right, currentColor, aria-hidden default true).
- [2026-05-03] Replaced old DDL Button + Link sections with E5 "Landing Primitives" showcase (per DDL replacement rule); migrated feature-home CTAs to new variant names.
- [2026-05-03] All 21 unit tests pass (button 11, link 6, icon-arrow 5); feature-home spec green; pre-existing 4 DDL spec failures (.color-test/.semantic-test) unrelated.
- [2026-05-03] Done — all ACs satisfied.
