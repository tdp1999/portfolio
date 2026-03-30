# Task: ContactMessage repository + mapper

## Status: done

## Goal
Implement the ContactMessage repository (port + adapter) and Prisma-to-domain mapper.

## Context
Standard repository pattern following existing modules. Key differences from other repos: no soft-delete filtering by default (explicit via query params), email-based rate limit query, and expiry-based purge queries.

## Acceptance Criteria

### Repository Port
- [x] `IContactMessageRepository` interface defined in `application/ports/`
- [x] Methods:
  - `add(entity: ContactMessage): Promise<string>` — returns ID
  - `findById(id: string): Promise<ContactMessage | null>` — includes soft-deleted (admin needs to see them)
  - `findAll(options: ContactMessageFindAllOptions): Promise<PaginatedResult<ContactMessage>>` — filtered by status, purpose, search, deletedAt
  - `getUnreadCount(): Promise<number>` — count where status=UNREAD and deletedAt=null
  - `update(id: string, entity: ContactMessage): Promise<void>`
  - `hardDelete(id: string): Promise<void>` — permanent removal
  - `hardDeleteExpired(): Promise<number>` — delete where expiresAt < now, return count
  - `hardDeleteOldSoftDeleted(olderThan: Date): Promise<number>` — delete where deletedAt < olderThan, return count
  - `countRecentByEmail(email: string, since: Date): Promise<number>` — for rate limiting
  - `countRecentByIpHash(ipHash: string, since: Date): Promise<number>` — for rate limiting
- [x] `CONTACT_MESSAGE_REPOSITORY` DI token exported

### Mapper
- [x] `ContactMessageMapper.toDomain(prisma)` — converts Prisma model to domain entity via `ContactMessage.load()`
- [x] `ContactMessageMapper.toPrisma(domain)` — converts domain entity props to Prisma create/update data
- [x] Handles nullable fields correctly (readAt, repliedAt, archivedAt, deletedAt)

### Repository Implementation
- [x] `ContactMessageRepository` implements `IContactMessageRepository`
- [x] `findAll` supports:
  - Filter by `status` (single or array)
  - Filter by `purpose` (single or array)
  - Filter by `deletedAt` (null = active, not-null = deleted, all = both)
  - Search across `name`, `email`, `subject` fields (case-insensitive ILIKE)
  - Pagination (page, limit) with total count
  - Sort by `createdAt` descending (default)
- [x] `getUnreadCount` excludes soft-deleted and spam messages
- [x] Rate limit queries use indexed `email` and `createdAt` fields

### FindAll Options Type
- [x] `ContactMessageFindAllOptions`: page, limit, status?, purpose?, search?, includeDeleted?, includeSpam?

## Technical Notes
- Unlike other repos, `findById` does NOT filter by `deletedAt: null` — admin needs to see deleted messages for restore
- `findAll` defaults to `deletedAt: null` but supports `includeDeleted: true` for trash view
- `hardDeleteExpired` and `hardDeleteOldSoftDeleted` use `deleteMany` for efficiency
- Rate limit queries: `countRecentByEmail` checks unhashed email; `countRecentByIpHash` checks hashed IP

## Files to Touch
- New: `apps/api/src/modules/contact-message/application/ports/contact-message.repository.port.ts`
- New: `apps/api/src/modules/contact-message/application/contact-message.token.ts`
- New: `apps/api/src/modules/contact-message/infrastructure/mapper/contact-message.mapper.ts`
- New: `apps/api/src/modules/contact-message/infrastructure/repositories/contact-message.repository.ts`

## Dependencies
- 196 (Prisma schema for generated types)
- 197 (Domain entity for mapper)

## Complexity: M

## Progress Log
- [2026-03-29] Started
- [2026-03-29] Done — all ACs satisfied. Port, mapper, repository implementation, DI token, type check clean.
