# Task: Frontend — Admin User Management Page

## Status: pending

## Goal
Create a full admin user management page at `/admin/users` with user listing, invite dialog, and soft-delete action.

## Context
Part of epic-user-module-hardening Phase 5 (Frontend). Admins need a UI to manage invited users. This is a new route section that doesn't exist yet.

## Acceptance Criteria

### Route & Guard
- [ ] New `/admin/users` route section in console app
- [ ] Admin role guard (frontend) protects the route — checks `authStore.user().role === 'ADMIN'`
- [ ] Non-admin users redirected to home
- [ ] Navigation link to admin section visible only for admins (in sidebar or appropriate location)

### User List
- [ ] Material table displaying users: name, email, role, status (active/soft-deleted), created date
- [ ] Server-side pagination (page, limit) with Material paginator
- [ ] Search input filtering by name or email (debounced, server-side)
- [ ] Loading skeleton/spinner during data fetch

### Invite User
- [ ] "Invite User" button opens a Material dialog
- [ ] Dialog form: name (required), email (required, validated)
- [ ] Submits to `POST /users` API
- [ ] On success: closes dialog, refreshes list, shows success toast
- [ ] On error (duplicate email, etc.): shows error in dialog

### Soft-Delete
- [ ] Delete icon button per user row (not for self, not for already-deleted)
- [ ] Confirmation dialog before deleting
- [ ] Calls `DELETE /users/:id` API
- [ ] On success: refreshes list, shows toast
- [ ] Soft-deleted users shown with visual distinction (greyed out or "Deleted" status)

### Data Access
- [ ] User admin service/store created for API calls (list, invite, delete)
- [ ] Uses `GET /users`, `POST /users`, `DELETE /users/:id` endpoints

### Tests
- [ ] Unit tests for the admin page component
- [ ] Unit tests for the admin guard
- [ ] Unit tests for the admin data service

## Technical Notes
- Create as a new feature lib: `libs/console/feature-admin/` (use ng-lib skill if needed)
- Use Angular Material table, paginator, dialog, form field components
- Admin guard can be a simple functional guard checking auth store signal
- Debounce search input with `rxjs debounceTime` or signal-based approach
- Follow existing console app patterns (feature-auth, feature-settings)

## Files to Touch
- `libs/console/feature-admin/` (new library)
- `apps/console/src/app/app.routes.ts` (add admin route)
- Sidebar component (add admin nav link, conditional on role)

## Dependencies
- [124] Foundation (API returns role)
- [126] Functional (list, invite, soft-delete API endpoints must exist)
- [130] Profile/role updates (admin guard needs role in UserProfile)

## Complexity: L

## Progress Log
