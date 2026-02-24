# Task: Configure Tailwind and theming for console app

## Status: done

## Goal
Ensure the console app uses the same Tailwind config and semantic design tokens as the landing app. Dark mode must work identically.

## Context
Both apps share the root `tailwind.config.js`. Need to verify the console app's build picks it up and that semantic tokens (CSS custom properties) are available.

## Acceptance Criteria
- [x] Console app references shared `tailwind.config.js`
- [x] Semantic tokens (`--color-text`, `--color-background`, etc.) available in console
- [x] Tailwind utility classes work in console components
- [x] Dark mode toggle (`.dark` class on `<html>`) works
- [x] Shared global styles (thin scrollbar, etc.) imported

## Technical Notes
- Check if `tailwind.config.js` content paths include `apps/console/` and `libs/console/`
- Import shared token stylesheet in console's `styles.scss`
- Verify by rendering a test element with semantic tokens

## Files to Touch
- `tailwind.config.js` (add console paths to content)
- `apps/console/src/styles.scss`

## Dependencies
- 076-console-app-scaffold

## Complexity: S
