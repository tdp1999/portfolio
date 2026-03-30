# Task: ContactMessage commands + handlers + tests

## Status: done

## Goal
Implement all write operations for ContactMessage via CQRS command handlers, including spam protection logic and email sending.

## Context
The submit command is the most complex — it validates, checks spam layers, stores the message, sends auto-reply, and sends admin notification. Admin commands (mark read, archive, delete, etc.) are simpler status transitions. The purge command is used by the cron job.

## Acceptance Criteria

### SubmitContactMessage Command
- [x] Validates input via `SubmitContactMessageSchema.safeParse()`
- [x] **Honeypot check:** if `website` field is non-empty, return `{ id: generated-uuid, success: true }` silently (no store, no emails)
- [x] **Rate limit check (email):** query repo `countRecentByEmail` — if >= 3 in last hour, throw `RATE_LIMITED` error
- [x] **Rate limit check (IP):** query repo `countRecentByIpHash` — if >= 5 in last hour, throw `RATE_LIMITED` error
- [x] **Disposable email check:** if `isDisposableEmail(email)`, throw `DISPOSABLE_EMAIL` error
- [x] Creates `ContactMessage` entity via `ContactMessage.create()`
- [x] Stores via repository `add()`
- [x] Sends auto-reply email: gets template from `EMAIL_TEMPLATE_REPOSITORY`, sends via `EMAIL_SERVICE`
- [x] Sends admin notification: gets template, sends to `ADMIN_NOTIFICATION_EMAIL` env var
- [x] Email failures are logged but do NOT block submission (try/catch around email sending)
- [x] Returns `{ id: string }`

### MarkAsRead Command
- [x] Validates message ID
- [x] Fetches message, throws NOT_FOUND if missing
- [x] Calls `entity.markAsRead()`, saves via `repo.update()`
- [x] Returns void

### MarkAsUnread Command
- [x] Same pattern, calls `entity.markAsUnread()`

### SetReplied Command
- [x] Calls `entity.setReplied()`, saves
- [x] Entity enforces: must be in READ status first (throws INVALID_TRANSITION)

### ArchiveMessage Command
- [x] Calls `entity.archive()`, saves

### RestoreMessage Command
- [x] Calls `entity.restore()`, saves (clears deletedAt)

### SoftDeleteMessage Command
- [x] Calls `entity.softDelete()`, saves

### PurgeExpiredMessages Command
- [x] Calls `repo.hardDeleteExpired()` — returns count of purged expired messages
- [x] Calls `repo.hardDeleteOldSoftDeleted(now - 30 days)` — returns count of purged soft-deleted
- [x] Returns `{ expiredCount, softDeletedCount }`
- [x] No validation needed (internal system command)

### Unit Tests (for each handler)
- [x] SubmitContactMessage: happy path (store + emails), honeypot silent accept, rate limit email, rate limit IP, disposable email rejection, email send failure doesn't block
- [x] MarkAsRead/Unread: happy path, not found
- [x] SetReplied: happy path, invalid transition (not READ)
- [x] Archive: happy path, already archived
- [x] SoftDelete: happy path, already deleted
- [x] Restore: happy path, not deleted
- [x] PurgeExpired: returns counts

## Technical Notes
- Inject: `CONTACT_MESSAGE_REPOSITORY`, `EMAIL_TEMPLATE_REPOSITORY`, `EMAIL_SERVICE`, `ConfigService` (for ADMIN_NOTIFICATION_EMAIL)
- Honeypot: generate a fake UUID and return success — bot thinks submission worked
- Rate limit in handler (not guard) because we need repo access for email-based limiting. IP-based limit can also use `@Throttle` on controller as additional layer
- Email sending: wrap in try/catch, log error with `Logger.warn()`, continue
- `ADMIN_NOTIFICATION_EMAIL` from `ConfigService.get('ADMIN_NOTIFICATION_EMAIL')`
- Console URL for notification: `ConfigService.get('CONSOLE_URL')` or hardcode for MVP

## Files to Touch
- New: `apps/api/src/modules/contact-message/application/commands/submit-contact-message.command.ts`
- New: `apps/api/src/modules/contact-message/application/commands/submit-contact-message.handler.ts`
- New: `apps/api/src/modules/contact-message/application/commands/submit-contact-message.handler.spec.ts`
- New: (same pattern for mark-as-read, mark-as-unread, set-replied, archive-message, restore-message, soft-delete-message, purge-expired-messages)
- New: `apps/api/src/modules/contact-message/application/commands/index.ts`

## Dependencies
- 195 (EmailTemplate module for template rendering)
- 197 (Domain entity)
- 198 (Repository)
- 199 (DTOs + disposable email utility)

## Complexity: L

## Progress Log
- [2026-03-29] Started
- [2026-03-29] Done — all ACs satisfied. 8 commands, 21 tests passing, type check clean.
