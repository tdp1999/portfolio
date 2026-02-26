# Task: Implement Auth and Guest Route Guards

## Status: completed

## Goal
Create `authGuard` and `guestGuard` to protect dashboard routes and redirect appropriately.

## Context
The console app routes already have TODO comments for guards. `authGuard` prevents unauthenticated access to dashboard pages. `guestGuard` prevents authenticated users from seeing login/auth pages.

## Acceptance Criteria
- [ ] `authGuard`: checks `AuthStore.isAuthenticated()` — if false, stores attempted URL and redirects to `/auth/login`
- [ ] `guestGuard`: checks `AuthStore.isAuthenticated()` — if true, redirects to `/`
- [ ] After login, user is redirected to the stored URL (return URL pattern)
- [ ] Guards wait for bootstrap to complete before evaluating (check `isBootstrapping` signal)
- [ ] Guards wired into `app.routes.ts` (replace TODO comments)
- [ ] Unit tests for both guards

## Technical Notes
- Use Angular's functional guard pattern (`CanActivateFn`)
- Return URL: store in `AuthStore` or a query param `?returnUrl=/some/page`
- Bootstrap wait: if `isBootstrapping()` is true, wait for it to become false (use `toObservable` + `filter`)
- Place guards in `libs/console/shared/data-access/` alongside the AuthStore

## Files to Touch
- `libs/console/shared/data-access/src/lib/guards/auth.guard.ts`
- `libs/console/shared/data-access/src/lib/guards/guest.guard.ts`
- `libs/console/shared/data-access/src/lib/guards/*.spec.ts`
- `apps/console/src/app/app.routes.ts`
- `libs/console/shared/data-access/src/index.ts`

## Dependencies
- 103-auth-store

## Complexity: M
