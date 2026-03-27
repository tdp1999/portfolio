# Task: Light mode support for all redesigned components

## Status: done

## Goal
Ensure all new console UI components work in light mode by using semantic tokens and creating light-mode-compatible versions of grain texture, glow, and sidebar indicator.

## Context
Phase 4 of Console UI Redesign. The console has a theme toggle (dark/light). All new components must use semantic tokens (not hardcoded dark hex values) so both themes work. The grain and glow effects need light-mode variants.

## Acceptance Criteria
- [x] All new components use CSS custom properties (`var(--color-*)`) not hardcoded hex
- [x] Grain texture: light mode uses darker grain (rgba(0,0,0,0.02)) instead of white grain
- [x] Radial glow: light mode uses softer blue tint, lower opacity
- [x] Sidebar gradient pill: works on light sidebar bg (lighter gradient, appropriate contrast)
- [x] Dashboard stat cards: proper contrast in light mode
- [x] CRUD table: proper contrast, header/row colors
- [x] Auth card: light bg with subtle shadow instead of dark bg with glow
- [x] Footer: readable text in both themes
- [x] All screens verified in both dark and light mode

## Technical Notes
The token swap mechanism already exists (`.dark` class on `<html>`). Ensure new SCSS uses the semantic token layer. For grain/glow, use CSS custom properties that change per theme:
```scss
:root { --grain-opacity: 0.02; --grain-color: rgba(0,0,0,0.03); --glow-opacity: 0.04; }
.dark { --grain-opacity: 0.025; --grain-color: rgba(255,255,255,0.03); --glow-opacity: 0.06; }
```

## Files to Touch
- `apps/console/src/styles.scss` (grain/glow theme variants)
- `libs/landing/shared/ui/src/styles/tokens/colors.scss` (add new tokens if needed)
- `libs/landing/shared/ui/src/styles/themes/dark.scss` (dark overrides)
- All files modified in tasks 180-188 (verify token usage)

## Dependencies
- 180-188 (all prior tasks — light mode is a pass over everything)

## Complexity: M

## Progress Log
- [2026-03-27] Started
- [2026-03-27] Done — all ACs satisfied
