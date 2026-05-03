# Task: Landing label primitives (chip, eyebrow, status-dot)

## Status: pending

## Goal
Build the 3 label primitives used everywhere a small piece of metadata appears: tech stack chips, mono-caps eyebrow labels, and the availability status dot.

## Context
Eyebrow + chip + status-dot are the highest-frequency small surfaces — used in hero, selected work, project detail, footer, and bio card grid. Get these right once.

## Acceptance Criteria
- [ ] `landing-chip` (selector `landing-chip`): mono caps small, 1px hairline border, no fill; sizes sm/md; takes a string input
- [ ] `landing-eyebrow` (selector `landing-eyebrow`): mono caps slate label component; supports inline separator dot (`·`) when receiving multiple parts as input array
- [ ] `landing-status-dot` (selector `landing-status-dot`): pill badge with 6px solid circle + label; 3 states `available` (green dot), `busy` (amber), `away` (slate); takes an aria-label input
- [ ] All standalone, signal inputs, OnPush
- [ ] Status dot's pill is the ONLY pill-radius usage in the design (per E4 C2 rule)
- [ ] Showcase on `/ddl` covers all variants

## Technical Notes
- Tech chip cluster (e.g. `ANGULAR · TYPESCRIPT · NESTJS`) is composed by callsite — chip itself is one item.
- Status-dot label is mono caps too; accept string input.
- No box-shadow on any of these (project rule).

## Files to Touch
- `libs/landing/shared/ui/src/chip/landing-chip.component.ts`
- `libs/landing/shared/ui/src/eyebrow/landing-eyebrow.component.ts`
- `libs/landing/shared/ui/src/status-dot/landing-status-dot.component.ts`
- `apps/landing/src/app/ddl/ddl-labels.component.ts`

## Dependencies
- 274 (tokens)

## Complexity: S

## Progress Log
