# Task: Rich-Text Storage — Prisma Migrations

## Status: done

## Goal
Add the 3-column rich-text storage pattern (`*Json`, `*Html`, `*SchemaVersion`) to every model that holds long-form prose, in a single migration set.

## Context
Replaces ad-hoc Markdown/textarea-with-parser fields with a JSON-canonical + sanitized HTML cache pattern (locked 2026-05-04 via the RTE epic Q&A drill). All existing `*` columns remain through expand/contract — drop is a follow-up after backfill confirms no readers.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 2.

## Acceptance Criteria
- [x] `Profile.bioLong` → `bioLongJson` (jsonb), `bioLongHtml` (jsonb), `bioLongSchemaVersion` (int default 1). JSON/HTML payload shape: `{ en, vi }` per the translatable pattern.
- [x] `Project.body` → `bodyJson`, `bodyHtml`, `bodySchemaVersion` (3 cols). JSON/HTML payload shape: `{ en, vi }`.
- [x] `BlogPost.content` → `contentJson`, `contentHtml`, `contentSchemaVersion` (3 cols). JSON/HTML payload shape: `{ en, vi }`.
- [x] `TechnicalHighlight.challenge / approach / outcome` → 9 cols total (3 per sub-field). Each JSON/HTML payload: `{ en, vi }`.
- [x] `Experience.description / responsibilities / highlights` → 9 cols total. Each JSON/HTML payload: `{ en, vi }`.

> **Translatable scope (decided 2026-06-10):** ALL five field groups use the `{ en, vi }` envelope inside the JSONB (uniform with the Profile-module precedent). `*SchemaVersion` stays a single int per field group (not per locale).
- [x] All new columns nullable through expand phase. Old `*` columns untouched.
- [x] Prisma client regenerates; `apps/api` repos return both old and new fields side-by-side.
- [x] `pnpm db:seed` succeeds with empty new columns.
- [x] Migration applied to dev DB without data loss.

## Technical Notes
- Use the `prisma-migrate` skill — it owns the destructive-change check, backup, and expand/contract scaffolding.
- Single migration set per Prisma's "all changes in one transaction" guidance — see `.context/decisions.md` for prior migration patterns.
- Translatable JSON shape established by Profile module (Apr 2026): use the same `{ en, vi }` envelope inside the JSONB.
- Schema version is single int per field group (not per locale).

**Specialized Skill:** prisma-migrate — read `~/.claude/skills/prisma-migrate/SKILL.md` for guidelines.

## Files to Touch
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_rich_text_storage/migration.sql`
- `apps/api/src/modules/profile/**` (repo + DTO touch new fields)
- `apps/api/src/modules/project/**`
- `apps/api/src/modules/blog-post/**`
- `apps/api/src/modules/experience/**`
- `apps/api/prisma/seed.ts`

## Dependencies
- External: `@phuong-tran-redoc/document-engine-core` v0.1.0 published (so we know the JSON shape we are storing). Tracked in the `document-engine` repo as epic `epic-document-engine-v0.1.0-stable-release.md` — `de-003` defines `schemaVersion`/`migrateDoc`, `de-008` publishes.

## Complexity: L

## Progress Log
- [2026-06-22] Started. Verified external dep satisfied (`@phuong-tran-redoc/document-engine-core` + `-angular` v0.1.0 in package.json). Read all 5 target models + 4 module mappers (explicit `toDomain`/`toPrisma` pattern) + seed (sets old fields via object literals → new nullable cols safe). Using `prisma-migrate` skill: all 27 additions are SAFE changes (nullable Json cols + NOT NULL Int with default).
- [2026-06-22] Scope decided with Owner: **read-side wiring** (mux fields through entity props + toDomain + read DTOs/presenters; defer write path/toPrisma to Phase 4 task 310).
- [2026-06-22] Schema edited (27 cols, 5 models). `prisma format` + `validate` clean. Migration `20260622082910_rich_text_storage` created via `--create-only`, SQL reviewed: 27 ADD COLUMN (safe) + 1 FK drop/re-add reconciling pre-existing drift from task 359 (`featuredImageId` FK `ON DELETE SET NULL` → `RESTRICT`; safe per skill, col already NOT NULL). Applied via `migrate deploy` (non-interactive); `prisma generate` done; `migrate status` = up to date.
- [2026-06-22] Read-side wiring done across all 4 modules. Added shared storage types `RichTextDocument` + `TranslatableRichText` to `libs/shared/utils/types`. Threaded the trio (`*Json: TranslatableRichText|null`, `*Html: TranslatableJson|null`, `*SchemaVersion: number`) through: domain IProps + entity getters + `create()` defaults (null/null/1) + `load`/`toProps`; mapper `toDomain` (opaque passthrough); read DTOs + presenters (Profile public, Project detail+highlights, BlogPost public+admin detail, Experience public). Write path (`toPrisma`, create payloads, zod schemas) intentionally deferred to Phase 4 (task 310).
- [2026-06-22] Verification complete. `tsc -p tsconfig.app.json` clean; fixed 16 spec fixtures (props/raw-Prisma builders missing the new required fields — added null/null/1 trios + 9-col highlight/experience blocks) → `tsc -p tsconfig.spec.json` clean. Confirmed Prisma client regenerated correctly (all 27 cols present in generated `@prisma/client` types; `migrate status` = "Database schema is up to date!", 41 migrations). Unit tests for all 4 modules: 29 suites / 379 tests pass. `pnpm prisma:seed` succeeds with empty new columns (exit 0). Done — all ACs satisfied.
