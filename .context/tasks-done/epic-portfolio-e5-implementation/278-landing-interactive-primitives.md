# Task: Landing interactive primitives (button, link, icon-arrow)

## Status: pending

## Goal
Build the 3 interactive primitives every page composes from: button (3 variants), link (text with arrow variants), and the arrow icon used in indigo accent moments.

## Context
Per CLAUDE.md: landing pages MUST use `landing-*` components exclusively. These three are the workhorses — every CTA, nav item, link list, and "view more" arrow uses them.

## Acceptance Criteria
- [ ] `landing-button` (selector `landing-button`): variants `solid` (indigo bg, white text), `ghost` (transparent + 1px hairline border), `link` (inline text-style); sizes sm/md; disabled state; focus ring per tokens
- [ ] `landing-link` (selector `landing-link`): plain text link, optional trailing arrow (`→` for same-domain, `↗` for external); active state in indigo (color only); hover changes color, never adds underline (per E4 rule)
- [ ] `landing-icon-arrow` (selector `landing-icon-arrow`): SVG icon component, two glyph variants (`right`, `up-right`); inherits currentColor; aria-hidden by default
- [ ] All standalone Angular components, signal inputs, OnPush change detection
- [ ] All testable on `/ddl` route with light + dark themes

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
