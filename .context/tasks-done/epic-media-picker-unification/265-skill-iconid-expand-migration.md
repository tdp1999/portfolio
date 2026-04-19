# Task: Expand Prisma migration — add Skill.iconId FK

## Status: done

## Goal
Add `iconId String? @db.Uuid` FK to `Media` on the `Skill` model. Expand phase only — `iconUrl` remains for now; no data written to `iconId` yet.

## Context
Expand-contract migration for moving Skill icons to the Media module. Expand deploys a nullable column and FK, keeping old column intact so reads continue to work. Backfill (task 266) and contract (task 270) follow.

## Acceptance Criteria
- [x] Prisma schema updated: `Skill.iconId String? @db.Uuid` + `icon Media? @relation(fields: [iconId], references: [id])`.
- [x] Migration generated and applied locally.
- [x] `iconUrl` column retained (no drop yet).
- [x] Existing Skill repository/entity still compiles and works (optional FK is a no-op for existing code).
- [x] Entity + mapper accept `iconId` when provided but don't require it.
- [x] Unit tests pass; no runtime regression.

## Technical Notes
- Use `prisma-migrate` skill — destructive-patterns.md and expand-contract-templates.md.
- Nullable FK means zero risk to existing rows; just an additive column.
- Add an index on `iconId` if queries will filter by it (unlikely — skip unless needed).

**Specialized Skill:** prisma-migrate — read `.claude/skills/prisma-migrate/SKILL.md`.
**Key sections to read:** expand-contract-templates, prisma-commands.

## Files to Touch
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/<timestamp>_skill_add_icon_id/migration.sql
- apps/api/src/modules/skill/domain/entities/skill.entity.ts (optional iconId accessor)
- apps/api/src/modules/skill/infrastructure/mapper/skill.mapper.ts

## Dependencies
- None

## Complexity: S

## Progress Log
- [2026-04-19] Started
- [2026-04-19] Done — all ACs satisfied
