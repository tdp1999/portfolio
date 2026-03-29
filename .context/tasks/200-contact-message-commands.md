# Task: ContactMessage commands + handlers + tests

## Status: pending

## Goal
Implement all write operations for ContactMessage via CQRS command handlers, including spam protection logic and email sending.

## Context
The submit command is the most complex — it validates, checks spam layers, stores the message, sends auto-reply, and sends admin notification. Admin commands (mark read, archive, delete, etc.) are simpler status transitions. The purge command is used by the cron job.

## Acceptance Criteria

### SubmitContactMessage Command
- [ ] Validates input via `SubmitContactMessageSchema.safeParse()`
- [ ] **Honeypot check:** if `website` field is non-empty, return `{ id: generated-uuid, success: true }` silently (no store, no emails)
- [ ] **Rate limit check (email):** query repo `countRecentByEmail` — if >= 3 in last hour, throw `RATE_LIMITED` error
- [ ] **Rate limit check (IP):** query repo `countRecentByIpHash` — if >= 5 in last hour, throw `RATE_LIMITED` error
- [ ] **Disposable email check:** if `isDisposableEmail(email)`, throw `DISPOSABLE_EMAIL` error
- [ ] Creates `ContactMessage` entity via `ContactMessage.create()`
- [ ] Stores via repository `add()`
- [ ] Sends auto-reply email: gets template from `EMAIL_TEMPLATE_REPOSITORY`, sends via `EMAIL_SERVICE`
- [ ] Sends admin notification: gets template, sends to `ADMIN_NOTIFICATION_EMAIL` env var
- [ ] Email failures are logged but do NOT block submission (try/catch around email sending)
- [ ] Returns `{ id: string }`

### MarkAsRead Command
- [ ] Validates message ID
- [ ] Fetches message, throws NOT_FOUND if missing
- [ ] Calls `entity.markAsRead()`, saves via `repo.update()`
- [ ] Returns void

### MarkAsUnread Command
- [ ] Same pattern, calls `entity.markAsUnread()`

### SetReplied Command
- [ ] Calls `entity.setReplied()`, saves
- [ ] Entity enforces: must be in READ status first (throws INVALID_TRANSITION)

### ArchiveMessage Command
- [ ] Calls `entity.archive()`, saves

### RestoreMessage Command
- [ ] Calls `entity.restore()`, saves (clears deletedAt)

### SoftDeleteMessage Command
- [ ] Calls `entity.softDelete()`, saves

### PurgeExpiredMessages Command
- [ ] Calls `repo.hardDeleteExpired()` — returns count of purged expired messages
- [ ] Calls `repo.hardDeleteOldSoftDeleted(now - 30 days)` — returns count of purged soft-deleted
- [ ] Returns `{ expiredCount, softDeletedCount }`
- [ ] No validation needed (internal system command)

### Unit Tests (for each handler)
- [ ] SubmitContactMessage: happy path (store + emails), honeypot silent accept, rate limit email, rate limit IP, disposable email rejection, email send failure doesn't block
- [ ] MarkAsRead/Unread: happy path, not found
- [ ] SetReplied: happy path, invalid transition (not READ)
- [ ] Archive: happy path, already archived
- [ ] SoftDelete: happy path, already deleted
- [ ] Restore: happy path, not deleted
- [ ] PurgeExpired: returns counts

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
