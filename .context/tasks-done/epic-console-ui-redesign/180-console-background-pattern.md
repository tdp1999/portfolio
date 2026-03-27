# Task: Add grain noise + radial glow background to console

## Status: done

## Goal
Add a subtle grain texture overlay and single radial glow to the console app's dark background, replacing the flat #0f1117 void.

## Context
Phase 1 of Console UI Redesign (epic-console-ui-redesign). This is the foundation layer — all other visual changes build on top of this. The pattern follows Linear/Vercel's approach: grain for "materiality" + glow for focal depth.

## Acceptance Criteria
- [x] Grain noise overlay visible on #0f1117 background (SVG feTurbulence, ~2.5-3% opacity, soft-light blend)
- [x] Single radial glow (indigo, ~6% opacity) positioned behind main content area
- [x] `pointer-events: none` on both overlay layers
- [x] No performance impact (no jank on scroll)
- [x] Grain does not appear on sidebar or topbar (content area only, or full page if it looks better)
- [x] Works in dark mode (current default)

## Technical Notes
Grain implementation via inline SVG data URI on `::before` pseudo-element:
```css
.grain::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,...feTurbulence...");
  background-repeat: repeat;
  background-size: 256px 256px;
  mix-blend-mode: soft-light;
  z-index: 1;
}
```

Radial glow via `::after` pseudo-element or separate radial-gradient layer.

Apply to `apps/console/src/styles.scss` or the content area wrapper in main-layout.

## Files to Touch
- `apps/console/src/styles.scss`
- `libs/console/shared/ui/src/lib/main-layout/main-layout.scss` (if scoping to content area)

## Dependencies
- None (first task)

## Complexity: S

## Progress Log
- [2026-03-23] Done — all ACs satisfied. Grain + glow added to main-layout.scss scoped to .console-content
