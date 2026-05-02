# Task: Home intro / about strip

## Status: pending

## Goal
Render the about-strip section directly under the hero with E2-locked copy.

## Context
Quiet section per B2.c (no rule lift, just whitespace separation). Voice-bearing — Procida Rules 4/8/12 apply (specific, proud, no AI-generic).

## Acceptance Criteria
- [ ] Section uses E2 locked copy verbatim (no re-writes in component)
- [ ] Layout: narrow centered column for paragraphs (~680px), Newsreader italic emphasis on the locked italic phrase
- [ ] No rule above or below; whitespace separates from neighbors
- [ ] No imagery in this section

## Technical Notes
- Pull copy from a static content module (or markdown file once decided in P6).
- This is the place where "human voice" is most exposed — verify against `vision.md` voice rules during code review.

## Files to Touch
- `libs/landing/feature-home/src/intro/home-intro.component.ts`

## Dependencies
- 274, 280

## Complexity: S

## Progress Log
