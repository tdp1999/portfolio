# Task: Define HSL-Based Color Tokens in Tailwind @theme

## Status: pending

## Goal
Create the color token system with HSL-based accent palette generation and semantic color mappings.

## Context
Phase 1 of Design System epic. The color system uses a three-layer token architecture:
- Layer 1 (Primitives): HSL-based accent palette (50-900) + Tailwind's default gray scale
- Layer 2 (Semantic): Contextual mappings like --color-primary, --color-surface, --color-text

The accent color is hardcoded initially (hue: 210 blue, saturation: 65%). Phase 5 (future epic) will make this dashboard-configurable.

## Acceptance Criteria
- [ ] `libs/landing/shared/ui/src/styles/tokens/colors.scss` contains @theme color definitions
- [ ] HSL-based accent palette (--color-accent-50 through --color-accent-900)
- [ ] Semantic tokens defined (--color-primary, --color-surface, --color-text, etc.)
- [ ] :root contains hardcoded base values (--accent-hue: 210, --accent-saturation: 65%)
- [ ] Tailwind utilities work: `bg-accent-500`, `text-primary`, `border-border`
- [ ] Gray scale uses Tailwind defaults via `theme(colors.gray.X)`
- [ ] Feedback colors defined (success, warning, error, info)

## Technical Notes
```scss
/* Example structure for colors.scss */
@theme {
  /* Accent palette from HSL variables */
  --color-accent-50: hsl(var(--accent-hue) var(--accent-saturation) 97%);
  /* ... 100-900 */

  /* Semantic tokens */
  --color-primary: var(--color-accent-500);
  --color-surface: #ffffff;
  --color-background: theme(colors.gray.50);
  --color-text: theme(colors.gray.900);
  --color-border: theme(colors.gray.200);
  /* ... */
}

:root {
  --accent-hue: 210;
  --accent-saturation: 65%;
}
```

Reference epic section "1. Color System" for full specification.

## Files to Touch
- `libs/landing/shared/ui/src/styles/tokens/colors.scss` (populate)
- `libs/landing/shared/ui/src/styles/index.scss` (ensure import)

## Dependencies
- 020-install-tailwind-v4

## Complexity: M

## Progress Log
