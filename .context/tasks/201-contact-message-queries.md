# Task: ContactMessage queries + handlers + tests

## Status: pending

## Goal
Implement all read operations for ContactMessage via CQRS query handlers.

## Context
Three queries support the console inbox: list (paginated, filtered, searchable), get by ID (detail view), and unread count (sidebar badge). All admin-only.

## Acceptance Criteria

### ListMessages Query
- [ ] Validates params via `ContactMessageQuerySchema.safeParse()`
- [ ] Delegates to `repo.findAll()` with parsed options
- [ ] Returns `{ data: ContactMessageListItemDto[], total, page, limit }` via `ContactMessagePresenter.toListItem()`
- [ ] Default: non-deleted, non-spam, sorted by createdAt desc

### GetMessageById Query
- [ ] Validates ID (UUID format)
- [ ] Fetches via `repo.findById(id)`
- [ ] Throws NOT_FOUND if null
- [ ] Returns full `ContactMessageResponseDto` via `ContactMessagePresenter.toResponse()`
- [ ] Does NOT auto-mark as read (separate command — frontend triggers this)

### GetUnreadCount Query
- [ ] No params needed
- [ ] Returns `{ unreadCount: number }` via `ContactMessagePresenter.toUnreadCount()`
- [ ] Excludes soft-deleted and spam messages

### Unit Tests
- [ ] ListMessages: happy path with pagination, search filter, status filter, purpose filter, defaults
- [ ] GetMessageById: happy path, not found
- [ ] GetUnreadCount: correct count excluding deleted/spam

## Technical Notes
- Follow existing query handler pattern (Category, Tag modules)
- `GetMessageById` intentionally does not auto-mark as read — this keeps queries side-effect-free (CQRS principle). Frontend dispatches `MarkAsRead` command separately when opening a message.

## Files to Touch
- New: `apps/api/src/modules/contact-message/application/queries/list-messages.query.ts`
- New: `apps/api/src/modules/contact-message/application/queries/list-messages.handler.ts`
- New: `apps/api/src/modules/contact-message/application/queries/list-messages.handler.spec.ts`
- New: (same pattern for get-message-by-id, get-unread-count)
- New: `apps/api/src/modules/contact-message/application/queries/index.ts`

## Dependencies
- 198 (Repository)
- 199 (DTOs + presenter)

## Complexity: S

## Progress Log
