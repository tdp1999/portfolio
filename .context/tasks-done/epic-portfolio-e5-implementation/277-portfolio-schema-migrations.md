# Task: Portfolio schema migrations + API/types/seed

## Status: done

## Goal
Apply 4 schema migrations + propagate the changes through repositories, types, validation, and seed so Profile and Project become CMS-driven for ~90% of landing voice copy.

## Context
Revised plan after E2 §11 review (2026-05-02 conversation):
- E2 originally proposed `Profile.timezone`, `Project.links`, `Skill.displayGroup`. After examining schema overlap and the E2 §4 Tier-1/Tier-2 distinction, the plan is now:
- M1: `Profile.timezone String?` → `timezones Json @default("[]")` — author works across multiple zones
- M2: `Project.links Json @default("[]")` (Array<ProjectLink>); **drop `sourceUrl`/`projectUrl`**, migrate existing rows into `links`
- M3: Add 4 `Profile` content blocks — `tagline`, `stackIntro`, `contactIntro`, `footerTagline` (all `Json?`, translatable markdown)
- M4: `Project.body Json?` (translatable markdown for D3.c case-study reading column); ToC auto-derived from H2/H3 at render
- DROPPED from original plan: `ProjectSection`, `ProjectTocAnchor` VOs (subsumed by `body`); `Skill.displayGroup` (use parent-skill umbrella instead — see PRF-008/Skill glossary in domain.md)

This unlocks landing fields being editable from console without code changes.

## Acceptance Criteria
- [x] **M1** `Profile.timezones` JSON array column added; old `timezone String?` migrated (single value → 1-element array) then dropped
- [x] **M2** `Project.links` JSON array column added with shape `Array<{label, url, type}>`; data migrated from `sourceUrl` → `{label: 'Source', type: 'repo'}` and `projectUrl` → `{label: 'Live', type: 'demo'}`; old columns dropped
- [x] **M3** `Profile.tagline`, `Profile.stackIntro`, `Profile.contactIntro`, `Profile.footerTagline` added as nullable JSONB
- [x] **M4** `Project.body` JSONB nullable column added
- [x] Migration applied via `prisma-migrate` skill with backup at `prisma/backups/pre_20260503_094633_portfolio_landing_fields.sql`
- [x] Repositories updated: Profile (timezones, landing content section + new `updateLandingContent` method), Project (links + body, no sourceUrl/projectUrl)
- [x] Public DTOs include the new fields; landing content blocks land in `ProfilePublicResponseDto`
- [x] Zod schemas: `ProjectLinkSchema` (label/url/type validation), `update-profile-landing-content.schema.ts`, updated `update-profile-work-availability.schema.ts`
- [x] Seed updated: Profile defaults include `timezones: ['Asia/Ho_Chi_Minh']` + 4 content blocks pre-populated with locked E2 copy (active only on fresh DB); 6 umbrella skills seeded idempotently (Languages, Frontend, Library work, Backend, Tooling, Workflow & AI)
- [x] Prisma client regenerated; `npx tsc --noEmit -p apps/api/tsconfig.app.json` clean
- [x] All affected tests pass: profile module 12 suites / 99 tests; project module 5 suites / 52 tests
- [x] Domain rules honored: PRJ-008/009/010, PRF-006/007/008
- [ ] **Manual follow-up (not auto-seedable):** existing 11 skill rows in DB are flat — need parent assignment via Console (task 277b will provide the parent picker UI). 3 existing projects need their `body` authored via Console (task 294–296).
- [ ] **Manual follow-up:** seed inserted English-only copy for the 4 landing content blocks; Vietnamese translation is `''` placeholder. Owner fills VN via Console once 277b ships.

## Technical Notes
- Use `prisma-migrate` skill — handles backups + apply + checks data preservation.
- Migration ordering: M3 + M4 + M1 are pure additions (safe). M2 needs an expand→migrate→contract approach: add `links` column, copy data, then drop `sourceUrl`/`projectUrl` in same migration set (no prod traffic concern, this is single-owner site, but follow pattern anyway).
- Skip `Skill.displayGroup` entirely — use parent-skill umbrella convention.
- This task is BE-only. Console form changes (Profile + Project edit pages) are task 277b.

**Specialized Skill:** `prisma-migrate` — read its SKILL.md before starting.
**Key sections to read:** Steps 1–4 (analysis, backup, generate, apply).

## Files to Touch
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/<timestamp>_portfolio_landing_fields/migration.sql`
- `apps/api/prisma/seed.ts`
- `libs/api/profile/src/**` (entity, repository, DTO, zod schemas, command/query handlers)
- `libs/api/projects/src/**` (entity, repository, DTO, zod schemas, command/query handlers)
- `libs/types/src/profile.ts`, `libs/types/src/project.ts` (or wherever shared types live)

## Dependencies
None (independent of frontend tokens).

## Complexity: L

## Progress Log
- 2026-05-03 — Migration applied. Backup at `prisma/backups/pre_20260503_094633_portfolio_landing_fields.sql`. Manually rewrote auto-generated migration to use ADD → COPY → DROP order so existing data (`profiles.timezone`, `projects.sourceUrl`) preserved into new shape. Verified post-migration: timezone array `['Asia/Ho_Chi_Minh']`, links array `[{type:'repo', url:..., label:'Source'}]`.
- 2026-05-03 — API code updates done by general-purpose agent: 31 files changed across profile + project modules (entity, VOs, mapper, repository, DTO, presenter, schemas, commands, controller, tests). New VOs: `LandingContentBlocks`, `ProjectLink`. New section command: `update-profile-landing-content`. New endpoint: `PATCH /admin/profile/landing-content`. All 151 affected tests pass.
- 2026-05-03 — Seed updated with locked E2 copy (tagline/stackIntro/contactIntro/footerTagline EN; VN parking) + 6 umbrella skills (idempotent skip-if-exists).
- 2026-05-03 — Done. Two manual follow-ups (existing 11 skills need parent assignment via Console; existing 3 projects need body auth) flagged but tracked outside this task.
