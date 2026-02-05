# Task: Install Angular Material v21 and Configure Theme

## Status: pending

## Goal
Install Angular Material v21 and integrate it with the custom design system tokens.

## Context
Phase 2 of Design System epic. Angular Material provides robust, accessible components. This task installs Material and configures it to use our semantic color tokens via `mat.theme-overrides()`.

## Acceptance Criteria
- [ ] @angular/material v21 installed via `ng add @angular/material`
- [ ] Custom theme option selected during installation (not prebuilt)
- [ ] Material overrides SCSS file created at `libs/landing/shared/ui/src/styles/material/overrides.scss`
- [ ] Material theme configured to use semantic tokens (--color-primary, etc.)
- [ ] Basic Material component renders correctly (mat-button with custom colors)
- [ ] Material components respond to `.dark` class
- [ ] No style conflicts between Tailwind utilities and Material

## Technical Notes
```scss
/* libs/landing/shared/ui/src/styles/material/overrides.scss */
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  @include mat.theme((
    color: mat.$azure-palette,
    typography: 'Inter',
    density: 0,
  ));

  // Override Material tokens with semantic tokens
  @include mat.theme-overrides((
    primary: var(--color-primary),
    on-primary: var(--color-text-on-primary),
    surface: var(--color-surface),
    on-surface: var(--color-text),
  ));
}
```

Installation command: `ng add @angular/material --project=landing`
- Select "Custom" theme option
- Enable global typography: Yes
- Enable animations: Yes (or BrowserAnimationsModule)

Note: SCSS can import other SCSS files, so `index.scss` can import `./material/overrides.scss`

## Files to Touch
- `package.json` (Material added by ng add)
- `libs/landing/shared/ui/src/styles/material/overrides.scss` (populate)
- `libs/landing/shared/ui/src/styles/index.scss` (add import for Material overrides)
- `apps/landing/src/app/app.config.ts` (may need provideAnimations)

## Dependencies
- 024-verify-phase1-tailwind (tokens must be working first)

## Complexity: M

## Progress Log
