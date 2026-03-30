# Task: ContactMessage queries + handlers + tests

## Status: done

## Goal
Implement all read operations for ContactMessage via CQRS query handlers.

## Context
Three queries support the console inbox: list (paginated, filtered, searchable), get by ID (detail view), and unread count (sidebar badge). All admin-only.

## Acceptance Criteria

### ListMessages Query
- [x] Validates params via `ContactMessageQuerySchema.safeParse()`
- [x] Delegates to `repo.findAll()` with parsed options
- [x] Returns `{ data: ContactMessageListItemDto[], total, page, limit }` via `ContactMessagePresenter.toListItem()`
- [x] Default: non-deleted, non-spam, sorted by createdAt desc

### GetMessageById Query
- [x] Validates ID (UUID format)
- [x] Fetches via `repo.findById(id)`
- [x] Throws NOT_FOUND if null
- [x] Returns full `ContactMessageResponseDto` via `ContactMessagePresenter.toResponse()`
- [x] Does NOT auto-mark as read (separate command — frontend triggers this)

### GetUnreadCount Query
- [x] No params needed
- [x] Returns `{ unreadCount: number }` via `ContactMessagePresenter.toUnreadCount()`
- [x] Excludes soft-deleted and spam messages

### Unit Tests
- [x] ListMessages: happy path with pagination, search filter, status filter, purpose filter, defaults
- [x] GetMessageById: happy path, not found
- [x] GetUnreadCount: correct count excluding deleted/spam

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
- [2026-03-30] Started
- [2026-03-30] Done — all ACs satisfied
