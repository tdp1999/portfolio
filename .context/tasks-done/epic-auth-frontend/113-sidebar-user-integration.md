# Task: Wire Auth User Data into Sidebar

## Status: done

## Goal
Replace the hardcoded "User" / "user@example.com" placeholder in the sidebar footer with real auth user data and add logout functionality.

## Context
The `ConsoleMainLayoutComponent` uses the sidebar from `@portfolio/shared/ui/sidebar`. The sidebar footer currently shows static placeholder text. It should display the authenticated user's name and email, plus a logout button.

## Acceptance Criteria
- [x] Sidebar footer shows `AuthStore.user().name` and `AuthStore.user().email`
- [x] Logout button/menu item in sidebar footer
- [x] Logout calls `AuthStore.logout()`, shows success toast, redirects to login
- [x] "Logout All Devices" option (secondary, e.g., in a dropdown menu)
- [x] Graceful handling if user is null (shouldn't happen behind auth guard, but defensive)

## Technical Notes
- Inject `AuthStore` into `ConsoleMainLayoutComponent`
- The sidebar components are in `@portfolio/shared/ui/sidebar` — don't modify the shared lib
- Add logout logic in the console layout component, using sidebar's existing footer slot

## Files to Touch
- `libs/console/shared/ui/src/lib/layouts/console-main-layout.component.ts`
- Possibly `libs/console/shared/ui/src/lib/layouts/console-main-layout.component.html` (if separate template)

## Dependencies
- 103-auth-store
- 106-toast-service

## Complexity: S
