# Task: Experience Prisma schema + new enums + migration

## Status: pending

## Goal
Define the Experience model, ExperienceSkill junction table, and two new enums (EmploymentType, LocationType) in Prisma, then apply migration.

## Context
Experience is a work history entity with ~25 fields including 4 translatable JSON fields (position, description, achievements, teamRole). It introduces two new enums and a many-to-many junction with Skill. This is the second module using extensive JsonB fields (after Profile). No destructive enum changes — both enums are new additions.

## Acceptance Criteria

### New Enums
- [ ] `EmploymentType` enum: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP, SELF_EMPLOYED
- [ ] `LocationType` enum: REMOTE, HYBRID, ONSITE

### Experience Model
- [ ] All fields per epic spec:
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
- [ ] Composite PK: `experienceId` + `skillId`
- [ ] FK to Experience with `onDelete: Cascade`
- [ ] FK to Skill with `onDelete: Cascade`
- [ ] Corresponding `skills ExperienceSkill[]` relation on Experience model
- [ ] Corresponding `experiences ExperienceSkill[]` relation on Skill model

### Relations
- [ ] `companyLogo` (Media, "ExperienceCompanyLogo" relation)
- [ ] `createdBy` / `updatedBy` / `deletedBy` (User, named relations)
- [ ] Corresponding relation fields added to User, Media, and Skill models

### Indexes
- [ ] `@@index([startDate])` (default sort)
- [ ] `@@index([deletedAt])` (soft delete filter)
- [ ] `@@index([displayOrder])` (manual sort)
- [ ] `slug` already unique via `@unique`

### Migration
- [ ] Migration applies cleanly to local Docker PostgreSQL
- [ ] `npx prisma generate` succeeds
- [ ] New enums created (additive, no destructive changes)

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
