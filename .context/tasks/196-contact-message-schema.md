# Task: ContactMessage Prisma schema + migration

## Status: pending

## Goal
Define the ContactMessage model in Prisma schema with enums, indexes, and apply migration.

## Context
First step of the ContactMessage module. The model stores visitor inquiries with status workflow, spam detection fields, GDPR consent tracking, and retention expiry. No audit FKs (createdById/updatedById) since messages come from anonymous public visitors.

## Acceptance Criteria

### Prisma Schema
- [ ] `ContactPurpose` enum: `GENERAL`, `JOB_OPPORTUNITY`, `FREELANCE`, `COLLABORATION`, `BUG_REPORT`, `OTHER`
- [ ] `ContactMessageStatus` enum: `UNREAD`, `READ`, `REPLIED`, `ARCHIVED`
- [ ] `ContactMessage` model with all fields per epic spec:
  - `id` (UUID v7, PK)
  - `name` (VarChar 200, not null)
  - `email` (VarChar 320, not null — RFC 5321 max)
  - `purpose` (ContactPurpose, default GENERAL)
  - `subject` (VarChar 500, nullable)
  - `message` (Text, not null)
  - `status` (ContactMessageStatus, default UNREAD)
  - `isSpam` (Boolean, default false)
  - `ipAddress` (VarChar 64, nullable — stored hashed)
  - `userAgent` (VarChar 512, nullable)
  - `locale` (VarChar 5, default "en")
  - `consentGivenAt` (DateTime, not null)
  - `createdAt` (DateTime, default now())
  - `readAt`, `repliedAt`, `archivedAt` (DateTime, nullable)
  - `expiresAt` (DateTime, not null)
  - `deletedAt` (DateTime, nullable — soft delete)

### Indexes
- [ ] Composite index on `[status, deletedAt]` (inbox queries)
- [ ] Index on `createdAt` (ordering)
- [ ] Index on `expiresAt` (purge cron)
- [ ] Index on `email` (rate limit checks)

### Migration
- [ ] Migration applies cleanly to local Docker PostgreSQL
- [ ] `npx prisma generate` succeeds
- [ ] Generated types available in `@prisma/client`

**Specialized Skill:** prisma-migrate — use `/prisma-migrate` for migration workflow.

## Technical Notes
- No relations to other tables (standalone entity)
- No `createdById`/`updatedById` — public submissions, no user context
- `ipAddress` stored as SHA-256 hash (hashing done in application layer, not DB)
- `expiresAt` computed at application layer: `createdAt + 12 months`

## Files to Touch
- Update: `apps/api/prisma/schema.prisma`
- New: migration file (auto-generated)

## Dependencies
- None

## Complexity: S

## Progress Log
