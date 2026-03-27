# Task: Visual effects — box-shadow, hover glow, transitions

## Status: done

## Goal
Apply subtle visual effects across all console components: box-shadows on cards, hover glow on interactive elements, smooth transitions.

## Context
Phase 4 of Console UI Redesign. Effects should be minimal and elegant — no animations, parallax, or attention-grabbing effects.

## Acceptance Criteria
- [x] Stat cards: no box-shadow (user preference), hover bg transition
- [x] Table container: no box-shadow (user preference)
- [x] Media grid cards: hover glow on hover
- [x] Interactive elements hover glow: `box-shadow: 0 0 20px -5px rgba(99,102,241,0.15)` on hover
- [x] All interactive elements: `transition: all 0.15s ease`
- [x] Buttons: brightness shift on hover (filled), hover glow (outlined)
- [x] No parallax, bouncing, scaling animations, or flashy effects
- [x] Effects work in both dark and light modes

## Files to Touch
- `libs/console/shared/ui/src/styles/material/_overrides.scss`
- `apps/console/src/styles.scss` (global hover/transition utilities)

## Dependencies
- 189 (light mode — effects should work in both themes)

## Complexity: S

## Progress Log
- [2026-03-27] Started
- [2026-03-27] Done — all ACs satisfied (box-shadow removed per user feedback)
