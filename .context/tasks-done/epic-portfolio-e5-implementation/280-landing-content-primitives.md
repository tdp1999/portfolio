# Task: Landing content primitives (figure, pull-quote, section-rule)

## Status: pending

## Goal
Build the 3 content primitives that frame editorial moments inside reading flows: image figure with caption, serif italic pull-quote, and section rule (with optional indigo top accent for B2.c lift).

## Context
Used heavily in D3.c project detail (figures + pull-quote in reading column) and across home sections (section-rule for transitions).

## Acceptance Criteria
- [ ] `landing-figure` (selector `landing-figure`): wraps `<img>` with 1px hairline border, mono caps caption below in form `FIG. 0X · CAPTION TEXT`; takes inputs `src`, `alt`, `caption`, `figureNumber`
- [ ] `landing-pull-quote` (selector `landing-pull-quote`): Newsreader serif italic body, 2px indigo left border, padding-left aligned to grid; optional cite slot
- [ ] `landing-section-rule` (selector `landing-section-rule`): 1px hairline horizontal rule; variant `lift` adds an additional 1px indigo top stripe + the section it precedes gets a tonal background lift (#11151c) — per B2.c rule, used by Selected Work and Get In Touch
- [ ] All standalone, signal inputs, OnPush
- [ ] Figure supports `srcset` (1× / 2×) and `loading="lazy"` by default; preload override input for above-the-fold use
- [ ] Showcase on `/ddl`

## Technical Notes
- `landing-section-rule` exposes the lift behavior via a class hook so the section ABOVE/BELOW the rule can pick up the tonal shift — implement either as data attribute on rule or a sibling-selector pattern in tokens.
- Caption text wraps gracefully under the image; figure number is optional for screenshots without numbering.

## Files to Touch
- `libs/landing/shared/ui/src/figure/landing-figure.component.ts`
- `libs/landing/shared/ui/src/pull-quote/landing-pull-quote.component.ts`
- `libs/landing/shared/ui/src/section-rule/landing-section-rule.component.ts`
- `apps/landing/src/app/ddl/ddl-content.component.ts`

## Dependencies
- 274 (tokens)

## Complexity: S

## Progress Log
