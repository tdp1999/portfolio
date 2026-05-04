# Task: Home intro / about strip (Section 6 — The Story)

## Status: done

## Goal
Render the **§6 Story** section per E2 §9 layout master, sourced from `Profile.bioLong`.

## Context
This is **Section 6 (The Story)** of the locked 9-section home layout, not a generic "about strip". It currently sits visually under hero only because §3 Bio Card Grid (task 284), §4 Selected Work (task 283), and §5 The Stack (E5 P4 gap) ship later — those slots are filled by `<landing-home-section-placeholder>` in `feature-home.html` and must be replaced in lockstep.

Quiet section per B2.c (no rule lift, just whitespace separation). Voice-bearing — Procida Rules 4/8/12 apply.

**Voice re-question (2026-05-04):** Owner re-read the locked E2 §2 copy and flagged it as too literary. Code renders `Profile.bioLong` unchanged from API; rewrite happens in Console (no code change needed). See E2 §2 voice re-review note.

## Acceptance Criteria
- [x] Section uses E2 locked copy verbatim (no re-writes in component)
- [x] Layout: narrow centered column for paragraphs (~680px), Newsreader italic emphasis on the locked italic phrase
- [x] No rule above or below; whitespace separates from neighbors
- [x] No imagery in this section

## Technical Notes
- Copy comes from `Profile.bioLong` (translatable JSONB, Owner-edited via Console form from task 277b). **No hardcoded copy** per E5 content authoring rule.
- Italic emphasis convention: `*phrase*` in source markdown → Newsreader serif italic at render. Component owns the parse (`parseBioLong` in `home-intro.component.ts`). Bold convention TBD when needed.
- Verify voice during code review against `vision.md` and E2 §2.

## Files to Touch
- `libs/landing/feature-home/src/lib/intro/home-intro.component.{ts,html,scss}`
- `libs/landing/feature-home/src/lib/placeholders/home-section-placeholder.component.{ts,scss}` (sister-section reservations until 283/284/stack/286/287 land)
- `libs/landing/feature-home/src/lib/feature-home/feature-home.{ts,html}` (compose hero → placeholders → story → placeholders in E2 §9 order)

## Dependencies
- 274, 280

## Complexity: S

## Progress Log
- 2026-05-04 Started — pulled E2 §2 90s Story Arc locked copy.
- 2026-05-04 Built `HomeIntroComponent` under `lib/intro/` with locked copy module (`home-intro.copy.ts`) carrying inline italic runs ("Real problems, real users, good people.", "I build the rails before I build the train.", "if there is one"). 680px column, body sans + Newsreader italic accent, 96px block padding (64px on mobile), no rule, no imagery.
- 2026-05-04 Wired `<landing-home-intro/>` directly under hero in `feature-home.html`. tsc clean for feature-home lib + landing app.
- 2026-05-04 Done — all ACs satisfied.
- 2026-05-04 **Refactor**: removed hardcoded `home-intro.copy.ts` (violated E5 content rule). `HomeIntroComponent` now takes `bioLong` input from `Profile.bioLong` via FeatureHome; italic phrases parsed from `*...*` markdown markers. Added `<landing-home-section-placeholder>` for §3/§4/§5/§7/§8 so The Story sits at its locked §6 position. Cleaned legacy Experience/FeaturedProjects blocks from `feature-home.html` (those move to /experience and §4 task 283). Spec updated. tsc clean.
