# Task: Rich-Text Storage — Prisma Migrations

## Status: pending

## Goal
Add the 3-column rich-text storage pattern (`*Json`, `*Html`, `*SchemaVersion`) to every model that holds long-form prose, in a single migration set.

## Context
Replaces ad-hoc Markdown/textarea-with-parser fields with a JSON-canonical + sanitized HTML cache pattern (locked 2026-05-04 via the RTE epic Q&A drill). All existing `*` columns remain through expand/contract — drop is a follow-up after backfill confirms no readers.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 2.

## Acceptance Criteria
- [ ] `Profile.bioLong` → `bioLongJson` (jsonb), `bioLongHtml` (jsonb), `bioLongSchemaVersion` (int default 1). JSON/HTML payload shape: `{ en, vi }` per the translatable pattern.
- [ ] `Project.body` → `bodyJson`, `bodyHtml`, `bodySchemaVersion` (3 cols).
- [ ] `BlogPost.content` → `contentJson`, `contentHtml`, `contentSchemaVersion` (3 cols).
- [ ] `TechnicalHighlight.challenge / approach / outcome` → 9 cols total (3 per sub-field).
- [ ] `Experience.description / responsibilities / highlights` → 9 cols total.
- [ ] All new columns nullable through expand phase. Old `*` columns untouched.
- [ ] Prisma client regenerates; `apps/api` repos return both old and new fields side-by-side.
- [ ] `pnpm db:seed` succeeds with empty new columns.
- [ ] Migration applied to dev DB without data loss.

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
- External: `@phuong-tran-redoc/document-engine-core` v0.1.0 published (so we know the JSON shape we are storing). See `epic-document-engine-portfolio-bridge.md` in `C:\study\document-engine`.

## Complexity: L

## Progress Log
