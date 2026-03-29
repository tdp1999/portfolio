# Task: ContactMessage Zod DTOs + presenter

## Status: pending

## Goal
Define Zod validation schemas for all ContactMessage operations and the presenter for response shaping.

## Context
DTOs handle validation in command/query handlers (not controllers). ContactMessage has a unique public-facing DTO (submit) that differs from admin DTOs (list, update status). The honeypot field is validated here — silently accepted if filled.

## Acceptance Criteria

### Submit DTO (Public)
- [ ] `SubmitContactMessageSchema`: name (1-200 chars, trimmed, HTML stripped), email (valid format, max 320), purpose (ContactPurpose enum, default GENERAL), subject (max 500, optional, trimmed), message (10-5000 chars, trimmed), locale (enum 'en'|'vi', default 'en'), consentGivenAt (ISO datetime, required)
- [ ] `website` field (honeypot): optional string, used for spam detection — if non-empty, flag as spam
- [ ] Email validation: format check via Zod
- [ ] Disposable email check: separate utility function `isDisposableEmail(email)` (can be used in handler)

### Query DTO (Admin)
- [ ] `ContactMessageQuerySchema`: page (int, min 1, default 1), limit (int, min 1, max 100, default 20), status (ContactMessageStatus or array, optional), purpose (ContactPurpose or array, optional), search (string, optional), includeDeleted (boolean, default false), includeSpam (boolean, default false), sortBy (enum: 'createdAt', default 'createdAt'), sortOrder (enum: 'asc'|'desc', default 'desc')

### Response DTO
- [ ] `ContactMessageResponseDto` type: id, name, email, purpose, subject, message, status, isSpam, locale, createdAt, readAt, repliedAt, archivedAt, expiresAt, deletedAt
- [ ] Does NOT include ipAddress or userAgent in response (internal/security data)

### Presenter
- [ ] `ContactMessagePresenter.toResponse(entity)` — maps domain entity to `ContactMessageResponseDto`
- [ ] `ContactMessagePresenter.toListItem(entity)` — lighter version for list view: id, name, email, purpose, subject (truncated to 100 chars), status, isSpam, createdAt
- [ ] `ContactMessagePresenter.toUnreadCount(count)` — simple `{ unreadCount: number }`

### Disposable Email Utility
- [ ] `isDisposableEmail(email: string): boolean` — checks domain against known list
- [ ] Inline list of ~50 most common disposable domains (mailinator, guerrillamail, tempmail, etc.)
- [ ] Extensible: list as const array, easy to add more

### Unit Tests
- [ ] Submit schema: valid input, missing required fields, HTML stripping, email format, message length bounds, honeypot detection
- [ ] Query schema: defaults, valid filters, invalid page/limit
- [ ] Disposable email: known disposable rejected, normal domains accepted

## Technical Notes
- Use Zod v4 syntax per project standard (e.g., `z.email()` not `z.string().email()`)
- `stripHtmlTags` utility already exists in shared libs (used by Category/Tag DTOs)
- Honeypot field is part of the schema but NOT part of the domain entity — it's consumed and discarded in the command handler
- Disposable email list: keep it small and maintainable. No npm package needed for ~50 domains

## Files to Touch
- New: `apps/api/src/modules/contact-message/application/contact-message.dto.ts`
- New: `apps/api/src/modules/contact-message/application/contact-message.dto.spec.ts`
- New: `apps/api/src/modules/contact-message/application/contact-message.presenter.ts`
- New: `apps/api/src/modules/contact-message/infrastructure/utils/disposable-email.ts`
- New: `apps/api/src/modules/contact-message/infrastructure/utils/disposable-email.spec.ts`

## Dependencies
- 197 (Domain entity types for presenter)

## Complexity: M

## Progress Log
