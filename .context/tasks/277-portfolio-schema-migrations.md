# Task: Portfolio schema migrations (5-migration set)

## Status: pending

## Goal
Apply all 5 schema migrations queued from E0 / E2 / E4 in a single coordinated set so the API stabilizes against the final D3.c project-detail shape.

## Context
Domain.md updated 2026-05-02 with new VOs (ProjectLink, ProjectSection, ProjectTocAnchor) and new Skill.displayGroup field. Migrations bundled here so the seed and repository layer move together.

## Acceptance Criteria
- [ ] **M1** `Profile.WorkAvailability.timezone` already exists in domain — verify Prisma + repository expose it; surface on public profile DTO
- [ ] **M2** `Project.links` jsonb column added; type `Array<{label: string, url: string, type: 'repo' | 'demo' | 'case-study' | 'doc' | 'post'}>`; defaults to `[]`
- [ ] **M3** `Skill.displayGroup` enum column added: `'frontend' | 'backend' | 'tooling' | 'other'`; defaults to `'other'`; backfill existing rows
- [ ] **M4** `Project.sections` jsonb column added; type `Array<{anchor: string, heading: string, body: string}>`; defaults to `[]`
- [ ] **M5** `Project.tocAnchors` jsonb column added; type `Array<{anchor: string, label: string}>`; defaults to `[]` — derived in app layer from sections unless override is needed
- [ ] Domain rules in `.context/domain.md` (PRJ-008/009/010) honored at repo layer
- [ ] Public DTOs include the new fields where appropriate
- [ ] Prisma client regenerated; no typescript errors in `apps/api`
- [ ] Existing seed updated to populate the new fields with placeholder values for the 3 V1 projects

## Technical Notes
- Use `prisma-migrate` skill — handles backups + apply.
- Validation: zod schemas for the jsonb shapes in `libs/api/projects/`.
- No data loss: M3 backfill maps existing skills to their best-fit group based on category if available, else `'other'`.

## Files to Touch
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/<timestamp>_portfolio_landing_fields/migration.sql`
- `libs/api/projects/src/repositories/project.repository.ts`
- `libs/api/skills/src/repositories/skill.repository.ts`
- `libs/api/profile/src/repositories/profile.repository.ts`
- `libs/types/src/project.ts`, `libs/types/src/skill.ts`
- `apps/api/prisma/seed.ts`

**Specialized Skill:** `prisma-migrate` — read its SKILL.md before starting.

## Dependencies
None (independent of frontend tokens).

## Complexity: L

## Progress Log
