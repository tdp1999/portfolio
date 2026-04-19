# Task: Skill icon picker integration + contract migration

## Status: done

## Goal
Switch Skill CRUD UI to pick icons via MediaPickerDialog (writing `iconId`); drop `iconUrl` column in a contract-phase migration once verified.

## Context
Backfill (task 266) populated `iconId` for all skills. This task switches writers to `iconId`, makes readers prefer `iconId` over `iconUrl`, then contracts `iconUrl` out of the schema.

## Acceptance Criteria
- [x] Skill dialog: replace `iconUrl` text input with picker trigger (single, `mimeFilter: 'image/svg+xml, image/png, image/webp'`, default folder `skills`).
- [x] Skill create / update BE commands accept `iconId` instead of `iconUrl`.
- [x] Skill entity / mapper / DTO use `iconId`; resolve URL via Media relation.
- [x] Landing page skill rendering uses resolved `icon.url` via the new FK.
- [x] Verify in prod-like data all skills either have `iconId` populated or intentionally null.
- [x] Contract migration: drop `iconUrl` column from Skill table.
- [x] Update skill repository queries to `include: { icon: true }` where URL is needed.
- [x] All Skill tests updated and passing.
- [x] Manual browser check: add new skill → pick icon → landing renders.

## Technical Notes
- Contract is destructive — verify all envs have backfill run before dropping.
- Prefer: ship UI + command change first (iconId writable, iconUrl still readable), run in prod a few days, then ship contract migration in a separate PR.
- Update seed script / test fixtures if they use `iconUrl`.

**Specialized Skill:** prisma-migrate — contract phase, destructive-patterns.

**Specialized Skill:** playwright-skill — verify skill icon rendering end-to-end.

## Files to Touch
- libs/console/feature-skill/src/lib/skill-dialog/skill-dialog.ts
- libs/console/feature-skill/src/lib/skill-dialog/skill-dialog.html
- apps/api/src/modules/skill/application/commands/* (update DTOs)
- apps/api/src/modules/skill/domain/entities/skill.entity.ts
- apps/api/src/modules/skill/infrastructure/mapper/skill.mapper.ts
- apps/api/src/modules/skill/infrastructure/repositories/skill.repository.ts
- apps/api/prisma/schema.prisma (drop iconUrl)
- apps/api/prisma/migrations/<timestamp>_skill_drop_icon_url/migration.sql
- libs/landing/...skill rendering path

## Dependencies
- 263 — rebuilt MediaPickerDialog
- 266 — backfill complete

## Complexity: M

## Progress Log
- 2026-04-19 Smoke-tested — add skill → pick icon via picker → landing renders correctly; task complete
