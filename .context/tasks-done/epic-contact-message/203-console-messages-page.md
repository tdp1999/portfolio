# Task: Console messages inbox page + sidebar badge

## Status: done

## Goal
Build the Angular console frontend for managing contact messages: inbox list view, message detail, status actions, search/filter, bulk actions, and unread count badge in sidebar.

## Context
This is the console (admin dashboard) frontend for the ContactMessage module. Follows existing console page patterns (Category, Skill, Media pages). The inbox-style UI is the primary way the admin manages visitor inquiries.

## Acceptance Criteria

### Feature Library Setup
- [x] Create `libs/console/feature-messages/` library (use `ng-lib` skill)
- [x] Route: `/messages` in console app routes
- [x] Lazy-loaded module

### Inbox List View
- [x] Table/list layout showing messages (responsive)
- [x] Columns: status indicator (colored dot), sender name, purpose (badge), subject preview (truncated), date (relative: "2h ago", "3 days ago")
- [x] Unread messages: bold text + accent-colored dot
- [x] Read messages: normal weight, muted dot
- [x] Replied messages: different color indicator
- [x] Spam messages: muted/strikethrough styling
- [x] Pagination controls (page/limit)
- [x] Empty state: "No messages yet" illustration/text

### Search & Filters
- [x] Search input: debounced (300ms), searches name/email/subject
- [x] Status filter: dropdown/chips — All, Unread, Read, Replied, Archived, Deleted
- [x] Purpose filter: dropdown — All, General, Job Opportunity, Freelance, Collaboration, Bug Report, Other
- [x] Active filters shown as removable chips/badges
- [x] Filters update URL query params (shareable/bookmarkable)

### Message Detail
- [x] Click message → navigates to `/messages/:id` (or side panel — follow console pattern)
- [x] Auto-dispatches MarkAsRead command when message is opened (if currently UNREAD)
- [x] Shows: full message body, sender name, email, purpose, subject, locale, timestamps (created, read, replied, archived)
- [x] Does NOT show ipAddress or userAgent (internal data)
- [x] Action buttons: Mark Unread, Archive, Delete, Reply
- [x] Reply button: opens `mailto:{{email}}?subject=Re: {{subject}}` + dispatches SetReplied command
- [x] Restore button (visible only if soft-deleted)
- [x] Back button to return to list

### Bulk Actions
- [x] Checkbox on each list item + "select all on page" checkbox
- [x] When items selected, toolbar appears: "Mark as Read", "Archive", "Delete"
- [x] Confirmation dialog for bulk delete
- [x] Deselect all after action completes
- [x] Action dispatches multiple API calls (or future bulk endpoint)

### Sidebar Badge
- [x] Unread count badge next to "Messages" nav item in sidebar
- [x] Fetches from `GET /contact-messages/unread-count` on app init and after navigation
- [x] Badge hidden when count is 0
- [x] Badge shows "99+" if count > 99

### Data Service
- [x] `ContactMessageService` in `libs/console/feature-messages/`
- [x] Methods: `list(params)`, `getById(id)`, `getUnreadCount()`, `markAsRead(id)`, `markAsUnread(id)`, `setReplied(id)`, `archive(id)`, `softDelete(id)`, `restore(id)`, `submit(data)` (for testing)
- [x] Uses `HttpClient` to call API endpoints
- [x] Returns typed responses

### Loading & Error States
- [x] Loading skeleton for list and detail views
- [x] Error handling with user-friendly messages
- [x] Toast/snackbar for action confirmations ("Message archived", "Marked as read")

## Technical Notes
- Follow existing console page patterns: check Category/Skill/Media pages for layout, table, and action patterns
- Use Angular Signals for reactive state management
- Use `landing-*` components are FORBIDDEN in console — use Angular Material + `ui-*` shared components
- Sidebar badge: use a shared signal/service that other components can read
- `mailto:` link: use `window.open()` or `<a href="mailto:...">` — both work
- Bulk actions: call individual API endpoints in parallel (Promise.all). Bulk endpoint is a future optimization
- Date formatting: use relative dates ("2h ago") for list, absolute dates for detail

**Specialized Skill:** ng-lib — use for creating the feature library with correct tags/directory/importPath.

## Files to Touch
- New: `libs/console/feature-messages/` (entire library — component, service, routes)
- Update: console app routes (add `/messages` route)
- Update: console sidebar component (add Messages nav item + badge)

## Dependencies
- 202 (API endpoints must exist)

## Complexity: L

## Progress Log
- [2026-03-30] Started
- [2026-03-30] Using ng-lib for library creation
- [2026-03-30] Created library, service, list page, detail page, bulk actions, sidebar badge
- [2026-03-30] Type check passes. Added removable filter chips + URL query params sync
- [2026-03-30] Done — all ACs satisfied
