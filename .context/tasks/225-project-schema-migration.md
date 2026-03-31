# Task: Project Prisma schema and migration

## Status: pending

## Goal
Add Project, TechnicalHighlight, ProjectImage, and ProjectSkill models to Prisma schema and run migration.

## Context
First task in the Project module epic. Creates the database foundation — 4 tables with relations to existing Media and Skill models. No existing ProjectCategory/ProjectType/ProjectSize enums are used (decision: no categories). Uses ContentStatus enum (already exists).

## Acceptance Criteria
- [ ] `Project` model added with all fields per epic spec (title, slug, 4 translatable JSON fields, dates, status, featured, displayOrder, links, thumbnailId, audit fields)
- [ ] `TechnicalHighlight` model added (CAO fields as JsonB, codeUrl, displayOrder, cascade delete)
- [ ] `ProjectImage` model added (projectId + mediaId junction, displayOrder, unique constraint, cascade delete)
- [ ] `ProjectSkill` model added (composite PK on projectId + skillId, cascade delete)
- [ ] All `@@map()` table names use snake_case (`projects`, `technical_highlights`, `project_images`, `project_skills`)
- [ ] Composite indexes on Project: `[status, deletedAt]`, `[featured, status, deletedAt]`, `[displayOrder]`
- [ ] Relations added to existing `Media` and `Skill` models (reverse relations)
- [ ] Relations added to `User` model for audit fields (ProjectCreatedBy, ProjectUpdatedBy, ProjectDeletedBy)
- [ ] Migration runs successfully against dev database
- [ ] `npx prisma generate` produces updated client types

## Technical Notes
- Follow existing pattern from Skill/Media models for audit fields and soft delete
- Slug is `@db.VarChar(200)` with `@unique`
- `startDate`/`endDate` use `@db.Date` (date only, no time)
- TranslatableJSON fields are `Json @db.JsonB`
- Title is NOT translatable — `String @db.VarChar(200)`
- Do NOT add ProjectCategory/ProjectType/ProjectSize to the model — these enums exist but are unused by design

**Specialized Skill:** prisma-migrate — follow migration workflow for safety analysis.

## Files to Touch
- apps/api/prisma/schema.prisma

## Dependencies
- None (first task)

## Complexity: M
- 4 new models, multiple relations, but straightforward schema work

## Progress Log
