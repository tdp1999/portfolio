# Task: Configure console routing skeleton with layout groups

## Status: done

## Goal
Set up the console app's route configuration with two layout-based groups: blank (auth) and main (sidebar).

## Context
Routes use Angular's layout-route pattern — a parent route with a layout component wrapping child `<router-outlet>`. Auth routes get the blank layout, all other routes get the main layout.

## Acceptance Criteria
- [x] `app.routes.ts` configured with two route groups:
  - `/auth/login` → Blank Layout → placeholder login component
  - `/auth/signup` → Blank Layout → placeholder signup component
  - `/` → Main Layout → placeholder home component
- [x] Wildcard `**` redirects to `/`
- [x] Lazy loading for route groups
- [x] Placeholder components are minimal (just a heading/text)
- [x] Navigation between routes works
- [x] `pnpm dev:console` shows main layout at `/` and blank layout at `/auth/login`
- [x] Auth guard placeholder comment in routes (TODO comments added)

## Technical Notes
- Pattern:
  ```typescript
  { path: 'auth', component: BlankLayoutComponent, children: [...] },
  { path: '', component: MainLayoutComponent, children: [...] }
  ```
- Placeholder components can live directly in `apps/console/src/app/pages/`
- Keep it minimal — feature modules will replace placeholders later

## Files to Touch
- `apps/console/src/app/app.routes.ts`
- `apps/console/src/app/pages/` (placeholder components)

## Dependencies
- 081-console-blank-layout
- 082-console-main-layout

## Complexity: M
