# Task: Define Typography Tokens and Base Styles

## Status: pending

## Goal
Create the typography token system with font families and fluid type scale using clamp(), plus base HTML element styles.

## Context
Phase 1 of Design System epic. Typography system includes:
- Font families: Inter (sans) and JetBrains Mono (mono)
- Fluid type scale: text-xs through text-5xl using clamp() for responsive sizing
- Base element styles: h1-h6, p, code in @layer base

## Acceptance Criteria
- [ ] `libs/ui/src/styles/tokens/typography.css` contains @theme typography definitions
- [ ] Font families defined: --font-sans (Inter), --font-mono (JetBrains Mono)
- [ ] Fluid type scale defined: --text-xs through --text-5xl using clamp()
- [ ] `libs/ui/src/styles/base/typography.css` contains @layer base element styles
- [ ] h1-h6 styled with appropriate font sizes and weights
- [ ] Tailwind utilities work: `font-sans`, `font-mono`, `text-xl`, etc.
- [ ] Typography scales smoothly between viewport sizes

## Technical Notes
```css
/* typography.css tokens */
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Fluid scale using clamp(min, preferred, max) */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-base: clamp(1rem, 0.925rem + 0.4vw, 1.125rem);
  --text-5xl: clamp(3rem, 2rem + 4vw, 4.5rem);
  /* ... */
}

/* base/typography.css */
@layer base {
  h1 { @apply text-5xl font-semibold leading-tight tracking-tight; }
  /* ... */
}
```

Note: May need to add @fontsource/jetbrains-mono if not already included with Inter.

## Files to Touch
- `libs/ui/src/styles/tokens/typography.css` (populate)
- `libs/ui/src/styles/base/typography.css` (populate)
- `libs/ui/src/styles/index.css` (ensure imports)
- `package.json` (if @fontsource/jetbrains-mono needed)

## Dependencies
- 020-install-tailwind-v4

## Complexity: M

## Progress Log
