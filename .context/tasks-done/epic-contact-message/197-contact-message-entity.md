# Task: ContactMessage domain entity + types + errors

## Status: done

## Goal
Create the ContactMessage domain entity with factory methods, status transitions, and domain-specific error codes.

## Context
ContactMessage is simpler than other entities — no audit FKs, no slug. But it has unique patterns: status workflow with timestamp tracking, expiry calculation, and IP hashing. The entity enforces business rules CTM-001 through CTM-005 from domain.md.

## Acceptance Criteria

### Domain Entity
- [x] `ContactMessage` class with private constructor
- [x] `ContactMessage.create(data)` factory — generates UUID v7, computes `expiresAt = now + 12 months`, sets status UNREAD, hashes IP
- [x] `ContactMessage.load(props)` factory — reconstitutes from DB
- [x] `markAsRead()` — transitions to READ, sets `readAt`
- [x] `markAsUnread()` — transitions back to UNREAD, clears `readAt`
- [x] `setReplied()` — transitions to REPLIED, sets `repliedAt` (must be READ first)
- [x] `archive()` — transitions to ARCHIVED, sets `archivedAt`
- [x] `softDelete()` — sets `deletedAt`
- [x] `restore()` — clears `deletedAt`
- [x] `markAsSpam()` / `clearSpam()` — toggles `isSpam`
- [x] All transition methods return new instance (immutable pattern)
- [x] Getters for all public properties

### Types
- [x] `IContactMessageProps` interface with all fields
- [x] `ICreateContactMessagePayload` — input for `create()`: name, email, purpose, subject, message, locale, ipAddress, userAgent, consentGivenAt
- [x] Types in separate file (`contact-message.types.ts`)

### Error Codes
- [x] `ContactMessageErrorCode` enum: `NOT_FOUND`, `INVALID_INPUT`, `ALREADY_DELETED`, `ALREADY_ARCHIVED`, `INVALID_TRANSITION`, `RATE_LIMITED`, `DISPOSABLE_EMAIL`, `SPAM_DETECTED`
- [x] In separate file (`contact-message.error.ts`)

### Validation Rules (in entity)
- [x] `setReplied()` throws if status is not READ (must read before replying — rule CTM-001)
- [x] `archive()` throws if already archived
- [x] `softDelete()` throws if already deleted
- [x] `restore()` throws if not deleted

### Unit Tests
- [x] `create()` generates valid UUID v7, sets UNREAD status, computes expiresAt 12 months ahead
- [x] `create()` hashes ipAddress (SHA-256)
- [x] All status transitions produce correct state + timestamps
- [x] Invalid transitions throw with correct error code
- [x] `load()` reconstitutes entity from raw props without modification

## Technical Notes
- IP hashing: use Node.js `crypto.createHash('sha256').update(ip).digest('hex')` — done in entity factory, not infrastructure
- Expiry: use `TemporalValue` if available, or plain `new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)`
- Entity does NOT extend `BaseCrudEntity` — no audit FKs. Standalone entity with its own base props
- Follow `DomainError` pattern from existing modules for transition errors

## Files to Touch
- New: `apps/api/src/modules/contact-message/domain/entities/contact-message.entity.ts`
- New: `apps/api/src/modules/contact-message/domain/entities/contact-message.entity.spec.ts`
- New: `apps/api/src/modules/contact-message/domain/contact-message.types.ts`
- New: `apps/api/src/modules/contact-message/domain/contact-message.error.ts`

## Dependencies
- 196 (Prisma schema must exist for type reference)

## Complexity: M

## Progress Log
- [2026-03-29] Started
- [2026-03-29] Done — all ACs satisfied. Entity, types, error codes, 21 unit tests passing.
