# Task: Visual effects — box-shadow, hover glow, transitions

## Status: pending

## Goal
Apply subtle visual effects across all console components: box-shadows on cards, hover glow on interactive elements, smooth transitions.

## Context
Phase 4 of Console UI Redesign. Effects should be minimal and elegant — no animations, parallax, or attention-grabbing effects.

## Acceptance Criteria
- [ ] Stat cards: `box-shadow: 0 1px 3px rgba(0,0,0,0.3)`
- [ ] Table container: same subtle shadow
- [ ] Media grid cards: shadow on hover
- [ ] Interactive elements hover glow: `box-shadow: 0 0 20px -5px rgba(99,102,241,0.15)` on hover
- [ ] All interactive elements: `transition: all 0.15s ease`
- [ ] Buttons: subtle scale or brightness shift on hover (not both)
- [ ] No parallax, bouncing, scaling animations, or flashy effects
- [ ] Effects work in both dark and light modes

## Files to Touch
- `libs/console/shared/ui/src/styles/material/_overrides.scss`
- `apps/console/src/styles.scss` (global hover/transition utilities)

## Dependencies
- 189 (light mode — effects should work in both themes)

## Complexity: S

## Progress Log
