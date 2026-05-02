# Task: Landing Tailwind tokens + font loading

## Status: pending

## Goal
Establish the design-token foundation (palette, type scale, spacing, motion) and load the 3 font families so every landing component composes from a shared base.

## Context
First building block of E5 Phase 1. All subsequent UI work depends on these tokens. Direction inputs come from E4: technical-cool palette with single indigo accent (~#6E66D9), Newsreader serif + Inter sans + JetBrains Mono.

## Acceptance Criteria
- [ ] Tailwind config under `libs/landing/shared/ui/` exposes palette tiers: `bg-ink-0` (#0a0d12), `bg-ink-1` (#11151c), `bg-ink-2` (#1a2030), slate text tiers (300/400/500/600/700), `accent-indigo` (#6E66D9 + 1 hover/active variant)
- [ ] Type scale: display 56/48/40/32, body 17/15/13, mono 12/11 — all multiples of 4 line-heights
- [ ] Spacing scale aligned to 4px grid (already enforced project-wide; verify token names)
- [ ] Motion tokens: `--motion-fast: 150ms`, `--motion-base: 200ms`, `--motion-slow: 250ms`, easing `cubic-bezier(0.2, 0, 0, 1)`
- [ ] Font loading via `@fontsource` (or self-hosted): Newsreader (regular + italic), Inter (400/500/600/700), JetBrains Mono (400/500). Subset Latin only.
- [ ] `font-display: swap` set; variable fonts where available
- [ ] Sample text in `/ddl` route renders all 3 families with correct weights

## Technical Notes
- Tokens live in `libs/landing/shared/ui/src/tokens/` — Tailwind preset `landing.preset.ts` consumed by `apps/landing` Tailwind config.
- Light-mode tokens derived from dark: invert background tiers, flip text tiers, accent stays the same hue but slightly desaturated.
- Bundle audit will run later (task 301); aim for total font payload ≤ 80 kB gzipped.

## Files to Touch
- `libs/landing/shared/ui/src/tokens/colors.ts`
- `libs/landing/shared/ui/src/tokens/typography.ts`
- `libs/landing/shared/ui/src/tokens/motion.ts`
- `libs/landing/shared/ui/landing.preset.ts`
- `apps/landing/tailwind.config.ts`
- `apps/landing/src/styles/fonts.scss`

## Dependencies
None (foundation).

## Complexity: M

## Progress Log
