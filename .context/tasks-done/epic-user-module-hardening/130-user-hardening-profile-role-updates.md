# Task: Frontend — UserProfile Update & Admin Badge

## Status: done

## Goal
Update the frontend UserProfile interface to include `role` and `hasGoogleLinked`, and show an admin badge in the sidebar.

## Context
Part of epic-user-module-hardening Phase 5 (Frontend). The API now returns `role` and `hasGoogleLinked` in `toPublicProps()` but the frontend doesn't consume them yet.

## Acceptance Criteria
- [x] `UserProfile` interface updated with `role: 'ADMIN' | 'USER'` and `hasGoogleLinked: boolean`
- [x] Auth store / `fetchCurrentUser()` correctly maps the new fields
- [x] Sidebar displays an admin badge/label next to user name when `role === 'ADMIN'`
- [x] Badge uses appropriate Material/UI styling (subtle, professional)
- [x] Non-admin users see no badge (no empty space either)
- [x] Unit tests for sidebar admin badge rendering (with/without admin role)

## Technical Notes
- `UserProfile` is at `libs/console/shared/data-access/src/lib/interfaces/user-profile.ts`
- Sidebar component: check `libs/shared/ui/` or wherever the sidebar is defined
- Keep the badge simple — a small chip or text label, not a full component

## Files to Touch
- `libs/console/shared/data-access/src/lib/interfaces/user-profile.ts`
- Sidebar component (find exact path)
- Sidebar component spec

## Dependencies
- [124] Foundation (API must return role and hasGoogleLinked)

## Complexity: S

## Progress Log
- 2026-03-16: Added `role` and `hasGoogleLinked` to `UserProfile` interface
- 2026-03-16: Added `isAdmin` computed signal and admin badge to sidebar footer
- 2026-03-16: Updated auth store spec with new fields, created main-layout spec for badge logic
- 2026-03-16: All tests passing (console-shared-ui, console-shared-data-access)
