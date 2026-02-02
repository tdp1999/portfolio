# Task: Install Tailwind CSS v4 and Configure Base Setup

## Status: pending

## Goal
Install Tailwind CSS v4 and create the foundational styles directory structure for the design system.

## Context
Phase 1 of the Design System epic. Tailwind v4 uses CSS-first architecture with the @theme directive. This task sets up the package and file structure that subsequent tasks will populate with tokens.

Note: ADR-007 standardized the project on SCSS, but the Design System epic explicitly requires Tailwind v4 for utilities. An ADR update will be needed to document this hybrid approach (Tailwind for utilities, SCSS for Angular Material mixins).

## Acceptance Criteria
- [ ] Tailwind CSS v4 installed via pnpm
- [ ] @fontsource/inter installed for Inter font
- [ ] Styles directory structure created at `libs/ui/src/styles/`
- [ ] Main entry file `libs/ui/src/styles/index.css` created with `@import "tailwindcss";`
- [ ] `apps/landing/src/styles.scss` renamed to `styles.css` and imports UI styles
- [ ] `apps/landing/project.json` updated to reference `styles.css`
- [ ] Basic Tailwind utility (e.g., `bg-gray-100`) renders in landing app
- [ ] No build errors or warnings

## Technical Notes
- Tailwind v4 uses CSS-first config with `@theme` directive (not tailwind.config.js)
- File structure to create:
  ```
  libs/ui/src/styles/
  ├── index.css              # @import "tailwindcss"; + token imports
  ├── tokens/
  │   ├── colors.css         # (empty, populated in task 021)
  │   └── typography.css     # (empty, populated in task 022)
  ├── themes/
  │   └── dark.css           # (empty, populated in task 023)
  ├── base/
  │   └── typography.css     # (empty, populated in task 022)
  └── material/
      └── overrides.scss     # (empty, populated in task 025)
  ```
- Landing app styles entry point changes from .scss to .css for Tailwind

## Files to Touch
- `package.json` (add dependencies)
- `libs/ui/src/styles/index.css` (create)
- `libs/ui/src/styles/tokens/colors.css` (create empty)
- `libs/ui/src/styles/tokens/typography.css` (create empty)
- `libs/ui/src/styles/themes/dark.css` (create empty)
- `libs/ui/src/styles/base/typography.css` (create empty)
- `libs/ui/src/styles/material/overrides.scss` (create empty)
- `apps/landing/src/styles.scss` → `apps/landing/src/styles.css` (rename)
- `apps/landing/project.json` (update styles reference line 23)

## Dependencies
- None (first task in Phase 1)

## Complexity: M

## Progress Log
