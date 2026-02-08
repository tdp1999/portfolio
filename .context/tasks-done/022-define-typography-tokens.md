# Task: Define Typography Tokens and Base Styles

## Status: done

## Goal
Create the typography token system with font families and fluid type scale using clamp(), plus base HTML element styles.

## Context
Phase 1 of Design System epic. Typography system includes:
- Font families: Inter (sans) and JetBrains Mono (mono)
- Fluid type scale: text-xs through text-5xl using clamp() for responsive sizing
- Base element styles: h1-h6, p, code in @layer base

## Acceptance Criteria
- [x] `libs/landing/shared/ui/src/styles/tokens/typography.scss` contains typography definitions
- [x] Font families defined in `tailwind.config.js`: `theme.extend.fontFamily` (sans: Inter, mono: JetBrains Mono)
- [x] Fluid type scale defined using CSS custom properties and clamp()
- [x] `libs/landing/shared/ui/src/styles/base/typography.scss` contains @layer base element styles
- [x] h1-h6 styled with appropriate font sizes and weights
- [x] Tailwind utilities work: `font-sans`, `font-mono`, `text-xl`, etc.
- [x] Typography scales smoothly between viewport sizes

## Technical Notes
```js
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
    },
  },
}
```

```scss
/* base/typography.scss */
@layer base {
  h1 { @apply text-5xl font-semibold leading-tight tracking-tight; }
  /* ... */
}
```

Note: May need to add @fontsource/jetbrains-mono if not already included with Inter.

## Files to Touch
- `tailwind.config.js` (font family already added, may need fluid scale additions)
- `libs/landing/shared/ui/src/styles/tokens/typography.scss` (populate)
- `libs/landing/shared/ui/src/styles/base/typography.scss` (populate)
- `libs/landing/shared/ui/src/styles/index.scss` (ensure imports)
- `package.json` (if @fontsource/jetbrains-mono needed)

## Dependencies
- 020-install-tailwind-v3

## Complexity: M

## Progress Log
- [2026-02-08] Completed - installed @fontsource/jetbrains-mono, defined fluid type scale with clamp(), base element styles, extended Tailwind fontSize, added DDL showcase
