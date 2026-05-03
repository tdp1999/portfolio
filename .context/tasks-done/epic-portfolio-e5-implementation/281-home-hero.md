# Task: Home hero (B1.e Type + Blueprint Background)

## Status: done

## Goal
Build the home hero matching B1.e composition with locked deltas from E4: type-led, faint hairline grid background, status block bottom-right, no clock/scroll-prompt, Angular-led core stack chips.

## Context
The hero is the single most important visual moment — friend-test priority `visual >> projects >> content`. E4 captured 4 deltas from the Stitch reference that must hold here.

## Acceptance Criteria
- [x] H1 sans bold + serif italic emphasis on "Engineer." (or whichever word from E2 locked copy carries the italic)
- [x] Sub-line sans + Newsreader italic phrase per E2 copy
- [x] Status block bottom-right: `landing-status-dot` (available state) + city `HCMC` + `AVAILABLE_FOR_HIRE` mono caps
- [x] **No** system clock in hero (E4 delta 1)
- [x] **No** "↓ READ" or scroll-prompt indicator in hero (E4 delta 2)
- [x] **Core stack chips: Angular-led** — final 3-item pick to be confirmed during build (candidates `ANGULAR · TYPESCRIPT · NESTJS` or `ANGULAR · TIPTAP · NESTJS`); NOT React/Next.js (E4 delta 3)
- [x] Eyebrow rules per E4 delta 4: drop "FRONTEND ENGINEER" (duplicates H1); HCMC moves OUT of eyebrow into status block; eyebrow either empty or carries a different micro-label
- [x] Background: faint hairline grid receding to vanishing point (5–8% opacity, technical-cool blueprint feel) — pure CSS; no JS animation
- [x] Hero fits viewport on 1440-wide desktop without scroll; tablet/mobile responsive
- [x] No box-shadow, no gradient, no scroll-triggered effects

## Technical Notes
- Reference image: `assets/moodboard/stitch-b1/B1e-grid-bg.png` — composition only, content from E2.
- Background grid: layered `linear-gradient` or SVG pattern; ensure perf-cheap (no canvas).
- Avoid LCP regression: hero text is the LCP candidate; preconnect fonts.
- Component placed under nx convention path `libs/landing/feature-home/src/lib/hero/` (not `src/hero/`); task path was indicative.
- Stack pick: `ANGULAR · TYPESCRIPT · NESTJS` (TypeScript chosen over Tiptap — Tiptap is a tool inside Document Engine and earns its surface in the project card, not the hero).
- Italic emphasis in sub-line: "Singapore market" — the voice-distinguishing phrase from E2 locked copy.

## Files to Touch
- `libs/landing/feature-home/src/lib/hero/home-hero.component.ts`
- `libs/landing/feature-home/src/lib/hero/home-hero.component.html`
- `libs/landing/feature-home/src/lib/hero/home-hero.component.scss`
- `libs/landing/feature-home/src/lib/feature-home/feature-home.{ts,html}` (replaced legacy hero block with `<landing-home-hero/>`)

## Dependencies
- 274 (tokens), 278/279 (eyebrow + chip + status-dot primitives), 277 (Profile data via API)

## Complexity: M

## Progress Log
- 2026-05-03 Started — pulled E2 locked H1/sub copy and E4 B1.e deltas.
- 2026-05-03 Built `HomeHeroComponent` with sans+serif-italic H1, italic "Singapore market" in sub, ANGULAR/TS/NESTJS chips, bottom-right status block (HCMC + AVAILABLE_FOR_HIRE), and a CSS-only blueprint grid receding via perspective transform.
- 2026-05-03 Replaced legacy hero block in `feature-home.html` with `<landing-home-hero/>`; existing Experience and Featured Projects sections retained below the fold.
- 2026-05-03 Done — all ACs satisfied, tsc clean for feature-home lib + landing app.
