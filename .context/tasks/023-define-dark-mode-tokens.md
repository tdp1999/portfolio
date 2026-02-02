# Task: Define Dark Mode Token Overrides

## Status: pending

## Goal
Create dark mode CSS token overrides that activate when `.dark` class is present on the root element.

## Context
Phase 1 of Design System epic. Dark mode works by overriding semantic tokens (Layer 2) when `.dark` class is applied to `<html>`. This approach:
- Keeps primitives (Layer 1) unchanged
- Only semantic tokens need dark mode versions
- Components automatically inherit correct colors

Note: Phase 5 (future) will add runtime toggle UI. For now, dark mode can be tested by manually adding `.dark` class in DevTools.

## Acceptance Criteria
- [ ] `libs/ui/src/styles/themes/dark.css` contains `.dark` class overrides
- [ ] Background/surface colors inverted (light → gray.950, gray.900)
- [ ] Text colors inverted (dark → gray.50, gray.400)
- [ ] Primary accent shifted for dark mode visibility (500 → 400)
- [ ] Border colors adjusted for dark mode contrast
- [ ] Adding `.dark` to `<html>` in DevTools shows correct dark theme
- [ ] All semantic tokens have dark mode equivalents

## Technical Notes
```css
/* themes/dark.css */
.dark {
  --color-background: theme(colors.gray.950);
  --color-surface: theme(colors.gray.900);
  --color-surface-elevated: theme(colors.gray.800);

  --color-primary: var(--color-accent-400);
  --color-primary-hover: var(--color-accent-300);

  --color-text: theme(colors.gray.50);
  --color-text-secondary: theme(colors.gray.400);
  --color-text-muted: theme(colors.gray.500);

  --color-border: theme(colors.gray.800);
  --color-border-strong: theme(colors.gray.700);
}
```

Test by adding class to html element: `document.documentElement.classList.add('dark')`

## Files to Touch
- `libs/ui/src/styles/themes/dark.css` (populate)
- `libs/ui/src/styles/index.css` (ensure import)

## Dependencies
- 021-define-color-tokens (semantic tokens must exist first)

## Complexity: S

## Progress Log
