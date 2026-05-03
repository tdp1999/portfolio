# Task: Landing content primitives (figure, pull-quote, section-rule)

## Status: done

## Goal
Build the 3 content primitives that frame editorial moments inside reading flows: image figure with caption, serif italic pull-quote, and section rule (with optional indigo top accent for B2.c lift).

## Context
Used heavily in D3.c project detail (figures + pull-quote in reading column) and across home sections (section-rule for transitions).

## Acceptance Criteria
- [x] `landing-figure` (selector `landing-figure`): wraps `<img>` with 1px hairline border, mono caps caption below in form `FIG. 0X · CAPTION TEXT`; takes inputs `src`, `alt`, `caption`, `figureNumber`
- [x] `landing-pull-quote` (selector `landing-pull-quote`): Newsreader serif italic body, 2px indigo left border, padding-left aligned to grid; optional cite slot
- [x] `landing-section-rule` (selector `landing-section-rule`): 1px hairline horizontal rule; variant `lift` adds an additional 1px indigo top stripe + the section it precedes gets a tonal background lift (#11151c) — per B2.c rule, used by Selected Work and Get In Touch
- [x] All standalone, signal inputs, OnPush
- [x] Figure supports `srcset` (1× / 2×) and `loading="lazy"` by default; preload override input for above-the-fold use
- [x] Showcase on `/ddl`

## Technical Notes
- `landing-section-rule` exposes the lift behavior via a class hook so the section ABOVE/BELOW the rule can pick up the tonal shift — implement either as data attribute on rule or a sibling-selector pattern in tokens.
- Caption text wraps gracefully under the image; figure number is optional for screenshots without numbering.

## Files to Touch
- `libs/landing/shared/ui/src/components/figure/figure.component.ts`
- `libs/landing/shared/ui/src/components/pull-quote/pull-quote.component.ts`
- `libs/landing/shared/ui/src/components/section-rule/section-rule.component.ts`
- `apps/landing/src/app/pages/ddl/ddl.component.html` (showcase)

## Dependencies
- 274 (tokens)

## Complexity: S

## Progress Log
- [2026-05-03] Started — followed existing repo convention `components/<name>/`.
- [2026-05-03] Added `<landing-figure>` with hairline frame, two-digit `FIG. 0X · CAPTION` caption, `srcset` passthrough, `loading="lazy"` default with `preload` override (sets `fetchpriority="high"` and `decoding="sync"`).
- [2026-05-03] Added `<landing-pull-quote>` (Newsreader italic, 2px indigo left border, optional `cite` footer in mono caps).
- [2026-05-03] Added `<landing-section-rule>` plain hairline + `lift` variant (indigo top stripe via gradient, sibling-selector lifts the next section to ink-1 — implements B2.c rule directly).
- [2026-05-03] Wired both showcases into `/ddl` next to label primitives.
- [2026-05-03] All 14 new unit tests pass; full `ui` lib suite green (17 suites / 136 tests).
- [2026-05-03] Done — all ACs satisfied.
