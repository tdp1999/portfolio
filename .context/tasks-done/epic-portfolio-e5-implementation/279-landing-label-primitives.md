# Task: Landing label primitives (chip, eyebrow, status-dot)

## Status: done

## Goal
Build the 3 label primitives used everywhere a small piece of metadata appears: tech stack chips, mono-caps eyebrow labels, and the availability status dot.

## Context
Eyebrow + chip + status-dot are the highest-frequency small surfaces — used in hero, selected work, project detail, footer, and bio card grid. Get these right once.

## Acceptance Criteria
- [x] `landing-chip` (selector `landing-chip`): mono caps small, 1px hairline border, no fill; sizes sm/md; takes a string input
- [x] `landing-eyebrow` (selector `landing-eyebrow`): mono caps slate label component; supports inline separator dot (`·`) when receiving multiple parts as input array
- [x] `landing-status-dot` (selector `landing-status-dot`): pill badge with 6px solid circle + label; 3 states `available` (green dot), `busy` (amber), `away` (slate); takes an aria-label input
- [x] All standalone, signal inputs, OnPush
- [x] Status dot's pill is the ONLY pill-radius usage in the design (per E4 C2 rule)
- [x] Showcase on `/ddl` covers all variants

## Technical Notes
- Tech chip cluster (e.g. `ANGULAR · TYPESCRIPT · NESTJS`) is composed by callsite — chip itself is one item.
- Status-dot label is mono caps too; accept string input.
- No box-shadow on any of these (project rule).

## Files to Touch
- `libs/landing/shared/ui/src/components/chip/chip.component.ts`
- `libs/landing/shared/ui/src/components/eyebrow/eyebrow.component.ts`
- `libs/landing/shared/ui/src/components/status-dot/status-dot.component.ts`
- `apps/landing/src/app/pages/ddl/ddl.component.html` (showcase)

## Dependencies
- 274 (tokens)

## Complexity: S

## Progress Log
- [2026-05-03] Started — followed existing repo convention `components/<name>/` (instead of literal task paths).
- [2026-05-03] Added `<landing-chip>` (sm/md, hairline border, mono caps, no fill, no pill radius).
- [2026-05-03] Added `<landing-eyebrow>` (single string or array; renders `·` separators between parts).
- [2026-05-03] Added `<landing-status-dot>` (available/busy/away; 6px solid dot in pill — only pill-radius surface in the design).
- [2026-05-03] Wired showcase into `/ddl` and removed legacy "Badge Component" DDL section per the DDL replacement rule (chip + status-dot supersede it; landing-badge remains exported because feature-home/projects/blog still consume it).
- [2026-05-03] All 14 new unit tests pass; full `ui` lib suite green (17 suites / 136 tests).
- [2026-05-03] Done — all ACs satisfied.
