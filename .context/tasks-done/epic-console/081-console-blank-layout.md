# Task: Build blank layout for console auth views

## Status: done

## Goal
Create `console-blank-layout` component in `libs/console/shared/ui/` — a styled, branded shell for auth pages (login, signup, logout).

## Context
Auth views need a clean, centered layout without the sidebar. Should be visually consistent with the landing design system — same tokens, same feel, but appropriate for a form-centric auth flow.

## Acceptance Criteria
- [x] `ConsoleBlankLayoutComponent` created in `libs/console/shared/ui/`
- [x] Selector: `console-blank-layout`
- [x] Centered card layout with branding (logo/app name)
- [x] Responsive — works on mobile and desktop
- [x] Uses semantic design tokens (consistent with landing)
- [x] Dark mode supported
- [x] Contains `<router-outlet>` for child auth routes
- [x] Exported from library barrel (`index.ts`)

## Technical Notes
- Standalone component, SCSS styling
- Pattern: full-height centered flex container with a card
- Branding can be minimal — app name + optional subtitle
- No sidebar, no navigation

## Files to Touch
- `libs/console/shared/ui/src/lib/blank-layout/`
- `libs/console/shared/ui/src/index.ts`

## Dependencies
- 079-console-shared-libs
- 080-console-theming

## Complexity: M
