# Task: Home hero (B1.e Type + Blueprint Background)

## Status: pending

## Goal
Build the home hero matching B1.e composition with locked deltas from E4: type-led, faint hairline grid background, status block bottom-right, no clock/scroll-prompt, Angular-led core stack chips.

## Context
The hero is the single most important visual moment — friend-test priority `visual >> projects >> content`. E4 captured 4 deltas from the Stitch reference that must hold here.

## Acceptance Criteria
- [ ] H1 sans bold + serif italic emphasis on "Engineer." (or whichever word from E2 locked copy carries the italic)
- [ ] Sub-line sans + Newsreader italic phrase per E2 copy
- [ ] Status block bottom-right: `landing-status-dot` (available state) + city `HCMC` + `AVAILABLE_FOR_HIRE` mono caps
- [ ] **No** system clock in hero (E4 delta 1)
- [ ] **No** "↓ READ" or scroll-prompt indicator in hero (E4 delta 2)
- [ ] **Core stack chips: Angular-led** — final 3-item pick to be confirmed during build (candidates `ANGULAR · TYPESCRIPT · NESTJS` or `ANGULAR · TIPTAP · NESTJS`); NOT React/Next.js (E4 delta 3)
- [ ] Eyebrow rules per E4 delta 4: drop "FRONTEND ENGINEER" (duplicates H1); HCMC moves OUT of eyebrow into status block; eyebrow either empty or carries a different micro-label
- [ ] Background: faint hairline grid receding to vanishing point (5–8% opacity, technical-cool blueprint feel) — pure CSS; no JS animation
- [ ] Hero fits viewport on 1440-wide desktop without scroll; tablet/mobile responsive
- [ ] No box-shadow, no gradient, no scroll-triggered effects

## Technical Notes
- Reference image: `assets/moodboard/stitch-b1/B1e-grid-bg.png` — composition only, content from E2.
- Background grid: layered `linear-gradient` or SVG pattern; ensure perf-cheap (no canvas).
- Avoid LCP regression: hero text is the LCP candidate; preconnect fonts.

## Files to Touch
- `libs/landing/feature-home/src/hero/home-hero.component.ts`
- `libs/landing/feature-home/src/hero/home-hero.component.html`
- `libs/landing/feature-home/src/hero/home-hero.component.scss`

## Dependencies
- 274 (tokens), 278/279 (eyebrow + chip + status-dot primitives), 277 (Profile data via API)

## Complexity: M

## Progress Log
