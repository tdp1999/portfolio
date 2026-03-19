# Task: Skill Module - Prisma Schema & Migration

## Status: done

## Goal

Define Skill model in Prisma schema with self-referential parent relation, SkillCategory enum, and all metadata fields.

## Context

Skill is more complex than Tag/Category due to self-referential `parentSkillId` (1-level hierarchy), `SkillCategory` enum, and additional metadata fields. This is the first self-referential FK in the project.

## Acceptance Criteria

- [x] `SkillCategory` enum in schema.prisma: `TECHNICAL`, `TOOLS`, `ADDITIONAL`
- [x] Skill model with all fields per epic schema table
- [x] Self-referential relation: `parentSkill` / `childSkills` using `@relation("SkillParent")`
- [x] Foreign key relations to User (createdById, updatedById, deletedById)
- [x] Unique constraints on `name` and `slug`
- [x] `isLibrary` Boolean default false, `isFeatured` Boolean default false
- [x] `displayOrder` Int default 0
- [x] Nullable fields: description, parentSkillId, yearsOfExperience, iconUrl, proficiencyNote
- [x] Soft delete fields (deletedAt, deletedById)
- [x] Migration created and applied via `prisma-migrate` skill
- [x] Prisma types generated successfully
- [x] User model updated with Skill relation names

## Technical Notes

```prisma
enum SkillCategory {
  TECHNICAL
  TOOLS
  ADDITIONAL
}

model Skill {
  id                String         @id @db.Uuid
  name              String         @unique
  slug              String         @unique
  description       String?
  category          SkillCategory
  isLibrary         Boolean        @default(false)
  parentSkillId     String?        @db.Uuid
  yearsOfExperience Int?
  iconUrl           String?
  proficiencyNote   String?
  isFeatured        Boolean        @default(false)
  displayOrder      Int            @default(0)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  createdById       String         @db.Uuid
  updatedById       String         @db.Uuid
  deletedAt         DateTime?
  deletedById       String?        @db.Uuid

  parentSkill  Skill?  @relation("SkillParent", fields: [parentSkillId], references: [id])
  childSkills  Skill[] @relation("SkillParent")
  createdBy    User    @relation("SkillCreatedBy", fields: [createdById], references: [id])
  updatedBy    User    @relation("SkillUpdatedBy", fields: [updatedById], references: [id])
  deletedBy    User?   @relation("SkillDeletedBy", fields: [deletedById], references: [id])

  @@map("skills")
}
```

## Files to Touch

- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/

## Dependencies

- None (User model already exists)

## Complexity: S

Single model + enum addition, self-referential FK is well-supported in Prisma.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied
