# Task: Install Tailwind CSS v3 and Configure Base Setup

## Status: completed

## Goal

Install Tailwind CSS v3 and create the foundational styles directory structure for the design system.

## Context

Phase 1 of the Design System epic. Tailwind v3 uses a JS config file (`tailwind.config.js`) with `@tailwind` directives. This task sets up the package and file structure that subsequent tasks will populate with tokens.

Note: Downgraded from v4 due to compatibility issues with Angular v21 (ref: angular/angular-cli#29789). ADR-008 documents this decision.

## Acceptance Criteria

- [ ] Tailwind CSS v3 installed via pnpm
- [ ] autoprefixer installed as PostCSS plugin
- [ ] @fontsource/inter installed for Inter font
- [ ] `tailwind.config.js` created at workspace root with content paths
- [ ] `postcss.config.js` created at workspace root with `tailwindcss` + `autoprefixer`
- [ ] Styles directory structure exists at `libs/landing/shared/ui/src/styles/`
- [ ] Main entry file `libs/landing/shared/ui/src/styles/index.scss` has `@tailwind` directives
- [ ] Basic Tailwind utility (e.g., `bg-gray-100`) renders in landing app
- [ ] No build errors or warnings

## Technical Notes

- Tailwind v3 uses `tailwind.config.js` for configuration (not v4's `@theme` directive)
- PostCSS config uses `tailwindcss` + `autoprefixer` plugins (not v4's `@tailwindcss/postcss`)
- Entry file uses `@tailwind base; @tailwind components; @tailwind utilities;` directives

## Files to Touch

- `package.json` (add dependencies)
- `tailwind.config.js` (create)
- `postcss.config.js` (create)
- `libs/landing/shared/ui/src/styles/index.scss` (add directives)

## Dependencies

- None (first task in Phase 1)

## Complexity: M

## Progress Log
