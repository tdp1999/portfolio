# Task: Home philosophy strip

## Status: done

## Goal
Render the philosophy strip section using E2-locked copy.

## Context
A short voice-bearing transitional section between the bio card grid and Get In Touch. Quiet B2.c default (no lift).

## Acceptance Criteria
- [x] Section uses E2 locked copy verbatim
- [x] Narrow centered column ~680px; sans body with one Newsreader italic emphasis
- [x] No imagery, no rule above, whitespace separation only

## Technical Notes
- Trivial component; reuse content-module pattern from intro.

## Files to Touch
- `libs/landing/feature-home/src/philosophy/home-philosophy-strip.component.ts`

## Dependencies
- 274, 280

## Complexity: S

## Progress Log
- 2026-05-08 Started — pulled E2 §6 Card B locked copy (`Profile.bioShort`) as the strip's source. Placed strip immediately before §7 Get in Touch (quiet B2.c before the indigo lift). Renders 680px centered column, sans body, italic emphasis on the closing sentence (`Less glamorous; more durable.`). Component supports `*phrase*` parsing too — falls back to last-sentence italic when no markers.
- 2026-05-08 Done — `HomePhilosophyStripComponent` under `lib/philosophy/`, wired into `feature-home.html` between §6 Story and §7 Get in Touch placeholder. Type check clean. All ACs satisfied.
