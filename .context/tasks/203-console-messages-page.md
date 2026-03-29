# Task: Console messages inbox page + sidebar badge

## Status: pending

## Goal
Build the Angular console frontend for managing contact messages: inbox list view, message detail, status actions, search/filter, bulk actions, and unread count badge in sidebar.

## Context
This is the console (admin dashboard) frontend for the ContactMessage module. Follows existing console page patterns (Category, Skill, Media pages). The inbox-style UI is the primary way the admin manages visitor inquiries.

## Acceptance Criteria

### Feature Library Setup
- [ ] Create `libs/console/feature-messages/` library (use `ng-lib` skill)
- [ ] Route: `/messages` in console app routes
- [ ] Lazy-loaded module

### Inbox List View
- [ ] Table/list layout showing messages (responsive)
- [ ] Columns: status indicator (colored dot), sender name, purpose (badge), subject preview (truncated), date (relative: "2h ago", "3 days ago")
- [ ] Unread messages: bold text + accent-colored dot
- [ ] Read messages: normal weight, muted dot
- [ ] Replied messages: different color indicator
- [ ] Spam messages: muted/strikethrough styling
- [ ] Pagination controls (page/limit)
- [ ] Empty state: "No messages yet" illustration/text

### Search & Filters
- [ ] Search input: debounced (300ms), searches name/email/subject
- [ ] Status filter: dropdown/chips — All, Unread, Read, Replied, Archived, Deleted
- [ ] Purpose filter: dropdown — All, General, Job Opportunity, Freelance, Collaboration, Bug Report, Other
- [ ] Active filters shown as removable chips/badges
- [ ] Filters update URL query params (shareable/bookmarkable)

### Message Detail
- [ ] Click message → navigates to `/messages/:id` (or side panel — follow console pattern)
- [ ] Auto-dispatches MarkAsRead command when message is opened (if currently UNREAD)
- [ ] Shows: full message body, sender name, email, purpose, subject, locale, timestamps (created, read, replied, archived)
- [ ] Does NOT show ipAddress or userAgent (internal data)
- [ ] Action buttons: Mark Unread, Archive, Delete, Reply
- [ ] Reply button: opens `mailto:{{email}}?subject=Re: {{subject}}` + dispatches SetReplied command
- [ ] Restore button (visible only if soft-deleted)
- [ ] Back button to return to list

### Bulk Actions
- [ ] Checkbox on each list item + "select all on page" checkbox
- [ ] When items selected, toolbar appears: "Mark as Read", "Archive", "Delete"
- [ ] Confirmation dialog for bulk delete
- [ ] Deselect all after action completes
- [ ] Action dispatches multiple API calls (or future bulk endpoint)

### Sidebar Badge
- [ ] Unread count badge next to "Messages" nav item in sidebar
- [ ] Fetches from `GET /contact-messages/unread-count` on app init and after navigation
- [ ] Badge hidden when count is 0
- [ ] Badge shows "99+" if count > 99

### Data Service
- [ ] `ContactMessageService` in `libs/console/feature-messages/`
- [ ] Methods: `list(params)`, `getById(id)`, `getUnreadCount()`, `markAsRead(id)`, `markAsUnread(id)`, `setReplied(id)`, `archive(id)`, `softDelete(id)`, `restore(id)`, `submit(data)` (for testing)
- [ ] Uses `HttpClient` to call API endpoints
- [ ] Returns typed responses

### Loading & Error States
- [ ] Loading skeleton for list and detail views
- [ ] Error handling with user-friendly messages
- [ ] Toast/snackbar for action confirmations ("Message archived", "Marked as read")

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
