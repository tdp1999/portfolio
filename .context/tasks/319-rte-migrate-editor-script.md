# Task: `pnpm migrate:editor` — Lazy Schema Migration Script

## Status: pending

## Goal
Add the `pnpm migrate:editor` glue script that invokes `migrateDoc` from `@phuong-tran-redoc/document-engine-core` across stored rich-text rows on demand, with idempotent semantics.

## Context
Lazy-by-default migration: rows are migrated on next edit (write path runs `migrateDoc` automatically). This script is the **escape hatch** — invoked when the engine ships a render-breaking schema change and we cannot wait for organic edits.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` "Lazy schema migration" architectural decision.

## Acceptance Criteria
- [ ] New script `apps/api/scripts/migrate-rich-text.ts`.
- [ ] Wired as `pnpm migrate:editor` in root `package.json` (`scripts` block).
- [ ] Script iterates each model with rich-text columns: Profile, Project, BlogPost, TechnicalHighlight, Experience.
- [ ] For every row whose `*SchemaVersion` is below the latest from `docMigrations`, the script:
  - calls `migrateDoc(json)` to get the upgraded JSON
  - calls `RichTextService.toCanonicalForm` to regenerate HTML + sanitize
  - persists the new triplet
  - logs a one-line summary per row
- [ ] Idempotent: re-running on a fully-migrated DB makes zero writes and exits 0.
- [ ] Dry-run mode: `pnpm migrate:editor --dry-run` reports counts without writing.
- [ ] Honors a `--module=<name>` flag to scope to one model when debugging.
- [ ] Script does not require the API server to be running — connects to Prisma directly.

## Technical Notes
- Reuse `RichTextService` from `apps/api/src/modules/shared/rich-text/` — instantiate it standalone (or via NestApplicationContext) so we don't duplicate sanitization logic.
- For the translatable variant `{ en, vi }`, run `migrateDoc` per locale slot.
- Logging: tag with `[migrate:editor]` prefix; summary at end (`X rows scanned, Y migrated, Z skipped`).

**Specialized Skill:** none (script is plumbing).

## Files to Touch
- `apps/api/scripts/migrate-rich-text.ts` (new)
- `package.json` (root scripts)
- `apps/api/src/modules/shared/rich-text/**` (export an injection-context-free factory if needed)

## Dependencies
- 305-rte-prisma-migrations
- 307-rte-tiptap-concrete (for `migrateDoc` re-export — or import from `document-engine-core` directly)
- 310-rte-be-service

## Complexity: S

## Progress Log
