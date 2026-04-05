# Task: Experience Prisma schema + new enums + migration

## Status: done

## Goal
Define the Experience model, ExperienceSkill junction table, and two new enums (EmploymentType, LocationType) in Prisma, then apply migration.

## Context
Experience is a work history entity with ~25 fields including 4 translatable JSON fields (position, description, achievements, teamRole). It introduces two new enums and a many-to-many junction with Skill. This is the second module using extensive JsonB fields (after Profile). No destructive enum changes — both enums are new additions.

## Acceptance Criteria

### New Enums
- [x] `EmploymentType` enum: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP, SELF_EMPLOYED
- [x] `LocationType` enum: REMOTE, HYBRID, ONSITE

### Experience Model
- [x] All fields per epic spec:
  - Identity: `id` (UUID v7), `slug` (unique, VarChar 200)
  - Company: `companyName` (VarChar 200), `companyUrl` (VarChar 500, nullable), `companyLogoId` (FK→Media, nullable)
  - Translatable: `position` (JsonB, not null), `description` (JsonB, nullable), `achievements` (JsonB, default {}), `teamRole` (JsonB, nullable)
  - Employment: `employmentType` (EmploymentType, default FULL_TIME), `locationType` (LocationType, default ONSITE)
  - Location: `locationCountry`, `locationCity` (VarChar 100, nullable), `locationPostalCode` (VarChar 20, nullable), `locationAddress1`, `locationAddress2` (VarChar 300, nullable)
  - Client context: `clientName` (VarChar 200, nullable), `clientIndustry` (VarChar 100, nullable), `domain` (VarChar 100, nullable), `teamSize` (Int, nullable)
  - Dates: `startDate` (DateTime, not null), `endDate` (DateTime, nullable)
  - Display: `displayOrder` (Int, default 0)
  - Audit: `createdAt`, `updatedAt`, `createdById` (FK→User), `updatedById` (FK→User), `deletedAt` (nullable), `deletedById` (FK→User, nullable)

### ExperienceSkill Junction
- [x] Composite PK: `experienceId` + `skillId`
- [x] FK to Experience with `onDelete: Cascade`
- [x] FK to Skill with `onDelete: Cascade`
- [x] Corresponding `skills ExperienceSkill[]` relation on Experience model
- [x] Corresponding `experiences ExperienceSkill[]` relation on Skill model

### Relations
- [x] `companyLogo` (Media, "ExperienceCompanyLogo" relation)
- [x] `createdBy` / `updatedBy` / `deletedBy` (User, named relations)
- [x] Corresponding relation fields added to User, Media, and Skill models

### Indexes
- [x] `@@index([startDate])` (default sort)
- [x] `@@index([deletedAt])` (soft delete filter)
- [x] `@@index([displayOrder])` (manual sort)
- [x] `slug` already unique via `@unique`

### Migration
- [x] Migration applies cleanly to local Docker PostgreSQL
- [x] `npx prisma generate` succeeds
- [x] New enums created (additive, no destructive changes)

**Specialized Skill:** prisma-migrate — use `/prisma-migrate` for migration workflow.

## Technical Notes
- Both enums are new — no destructive migration concerns (unlike Profile's SocialPlatform changes)
- `achievements` default is `"{}"` (TranslatableStringArray object), not `"[]"` (plain array)
- `companyLogoId` should use `onDelete: SetNull` on the Media relation (logo disappears gracefully if Media deleted)
- JsonB columns for all translatable fields (better PostgreSQL query performance)
- Slug has `@unique` constraint — collision handling is in application layer, not DB

## Files to Touch
- Update: `apps/api/prisma/schema.prisma` (add enums, Experience model, ExperienceSkill model, update User/Media/Skill relations)
- New: migration file (auto-generated)

## Dependencies
- None (User, Media, Skill models already exist)

## Complexity: M

## Progress Log
- [2026-04-04] Started — adding enums, Experience model, ExperienceSkill, updating relations
- [2026-04-04] Done — all ACs satisfied, migration applied, prisma generate clean, tsc clean
