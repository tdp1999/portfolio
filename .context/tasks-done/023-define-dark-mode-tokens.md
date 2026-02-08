# Task: Define Dark Mode Token Overrides

## Status: completed

## Goal
Create dark mode CSS token overrides that activate when `.dark` class is present on the root element.

## Context
Phase 1 of Design System epic. Dark mode works by overriding semantic tokens (Layer 2) when `.dark` class is applied to `<html>`. This approach:
- Keeps primitives (Layer 1) unchanged
- Only semantic tokens need dark mode versions
- Components automatically inherit correct colors

Note: `darkMode: 'class'` is configured in `tailwind.config.js`.
Note: Phase 5 (future) will add runtime toggle UI. For now, dark mode can be tested by manually adding `.dark` class in DevTools.

## Acceptance Criteria
- [x] `libs/landing/shared/ui/src/styles/themes/dark.scss` contains `.dark` class overrides
- [x] Background/surface colors inverted (light -> dark gray hex values)
- [x] Text colors inverted (dark -> light gray hex values)
- [x] Primary accent shifted for dark mode visibility (500 -> 400)
- [x] Border colors adjusted for dark mode contrast
- [x] Adding `.dark` to `<html>` in DevTools shows correct dark theme
- [x] All semantic tokens have dark mode equivalents

## Technical Notes
```scss
/* themes/dark.scss */
.dark {
  --color-background: #030712;   /* gray-950 */
  --color-surface: #111827;      /* gray-900 */
  --color-surface-elevated: #1f2937; /* gray-800 */

  --color-primary: hsl(var(--accent-hue) var(--accent-saturation) 62%); /* accent-400 */
  --color-primary-hover: hsl(var(--accent-hue) var(--accent-saturation) 74%); /* accent-300 */

  --color-text: #f9fafb;         /* gray-50 */
  --color-text-secondary: #9ca3af; /* gray-400 */
  --color-text-muted: #6b7280;   /* gray-500 */

  --color-border: #1f2937;       /* gray-800 */
  --color-border-strong: #374151; /* gray-700 */
}
```

Test by adding class to html element: `document.documentElement.classList.add('dark')`

## Files to Touch
- `libs/landing/shared/ui/src/styles/themes/dark.scss` (populate)
- `libs/landing/shared/ui/src/styles/index.scss` (ensure import)

## Dependencies
- 021-define-color-tokens (semantic tokens must exist first)

## Complexity: S

## Progress Log
- [2026-02-08] Completed — dark mode tokens implemented with interactive toggle on /ddl
