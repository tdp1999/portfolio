# Task: Define HSL-Based Color Tokens

## Status: pending

## Goal
Create the color token system with HSL-based accent palette generation and semantic color mappings.

## Context
Phase 1 of Design System epic. The color system uses a three-layer token architecture:
- Layer 1 (Primitives): HSL-based accent palette (50-900) defined in `tailwind.config.js`
- Layer 2 (Semantic): CSS custom properties in `:root` like --color-primary, --color-surface, --color-text

The accent color is hardcoded initially (hue: 210 blue, saturation: 65%). Phase 5 (future epic) will make this dashboard-configurable.

## Acceptance Criteria
- [ ] `tailwind.config.js` contains accent color palette (50-900) using HSL variables
- [ ] `tailwind.config.js` contains semantic color mappings referencing CSS custom properties
- [ ] `:root` block in `index.scss` contains hardcoded base values (--accent-hue: 210, --accent-saturation: 65%)
- [ ] `:root` block contains semantic tokens (--color-primary, --color-surface, --color-text, etc.)
- [ ] Tailwind utilities work: `bg-accent-500`, `text-primary`, `border-border`
- [ ] Feedback colors defined (success, warning, error, info) as CSS custom properties
- [ ] Gray scale uses hex values matching Tailwind defaults

## Technical Notes
```js
// tailwind.config.js - accent colors
colors: {
  accent: {
    500: 'hsl(var(--accent-hue) var(--accent-saturation) 50%)',
    // ...
  },
  primary: 'var(--color-primary)',
  // ...
}
```

```scss
// index.scss - CSS custom properties
:root {
  --accent-hue: 210;
  --accent-saturation: 65%;
  --color-primary: hsl(var(--accent-hue) var(--accent-saturation) 50%);
  --color-background: #f9fafb; /* gray-50 */
  // ...
}
```

Reference epic section "1. Color System" for full specification.

## Files to Touch
- `tailwind.config.js` (color definitions)
- `libs/landing/shared/ui/src/styles/index.scss` (CSS custom properties in :root)

## Dependencies
- 020-install-tailwind-v3

## Complexity: M

## Progress Log
