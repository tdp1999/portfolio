# Task: Category Module - Prisma Schema

## Status: done

## Goal

Define Category model in Prisma schema with audit fields, soft delete, and User relations.

## Context

Category is structurally similar to Tag but adds `description` and `displayOrder` fields. First module to validate the established pattern as a separate epic (vertical slice).

## Acceptance Criteria

- [x] Category model in schema.prisma with all fields per epic schema
- [x] Foreign key relations to User (createdById, updatedById, deletedById)
- [x] Unique constraints on `name` and `slug`
- [x] `displayOrder` with default 0
- [x] `description` nullable String
- [x] Soft delete fields (deletedAt, deletedById)
- [x] Migration created and applied
- [x] Prisma types generated successfully
- [x] User model updated with Category relation names

## Technical Notes

```prisma
model Category {
  id          String    @id @db.Uuid
  name        String    @unique
  slug        String    @unique
  description String?
  displayOrder Int      @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdById String    @db.Uuid
  updatedById String    @db.Uuid
  deletedAt   DateTime?
  deletedById String?   @db.Uuid

  createdBy   User      @relation("CategoryCreatedBy", fields: [createdById], references: [id])
  updatedBy   User      @relation("CategoryUpdatedBy", fields: [updatedById], references: [id])
  deletedBy   User?     @relation("CategoryDeletedBy", fields: [deletedById], references: [id])

  @@map("categories")
}
```

## Files to Touch

- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/

## Dependencies

- None (User model already exists)

## Complexity: S

Single model addition, straightforward migration.

## Progress Log
- [2026-03-17] Done — all ACs satisfied
