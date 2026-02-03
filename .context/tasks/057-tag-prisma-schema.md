# Task: Tag Module - Prisma Schema

## Status: pending

## Goal
Define Tag model in Prisma schema with User relation for audit fields.

## Context
Tag is the simplest content entity - perfect for establishing the full module pattern.

## Acceptance Criteria
- [ ] Tag model in schema.prisma with all 6 fields
- [ ] Foreign key relations to User (createdById, updatedById)
- [ ] Unique constraints on name and slug
- [ ] Migration created and applied
- [ ] Prisma types generated

## Technical Notes
Fields:
- id (UUID v7, PK)
- name (unique)
- slug (unique)
- createdAt, updatedAt
- createdById, updatedById (FK → User)

```prisma
model Tag {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String
  updatedById String
  createdBy   User     @relation("TagCreatedBy", fields: [createdById], references: [id])
  updatedBy   User     @relation("TagUpdatedBy", fields: [updatedById], references: [id])
}
```

## Files to Touch
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/

## Dependencies
- 056-user-module-wiring (User must exist for FK)

## Complexity: S

## Progress Log
