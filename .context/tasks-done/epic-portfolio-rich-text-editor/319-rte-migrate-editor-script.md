# Task: `pnpm migrate:editor` — Lazy Schema Migration Script

## Status: done

## Goal
Add the `pnpm migrate:editor` glue script that invokes `migrateDoc` from `@phuong-tran-redoc/document-engine-core` across stored rich-text rows on demand, with idempotent semantics.

## Context
Lazy-by-default migration: rows are migrated on next edit (write path runs `migrateDoc` automatically). This script is the **escape hatch** — invoked when the engine ships a render-breaking schema change and we cannot wait for organic edits.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` "Lazy schema migration" architectural decision.

## Acceptance Criteria
- [x] New script `apps/api/scripts/migrate-rich-text.ts`.
- [x] Wired as `pnpm migrate:editor` in root `package.json` (`scripts` block).
- [x] Script iterates each model with rich-text columns: Profile, Project, BlogPost, TechnicalHighlight, Experience.
- [x] For every row whose `*SchemaVersion` is below the latest from `docMigrations`, the script:
  - calls `migrateDoc(json)` to get the upgraded JSON
  - calls `RichTextService.toCanonicalForm` to regenerate HTML + sanitize
  - persists the new triplet
  - logs a one-line summary per row
- [x] Idempotent: re-running on a fully-migrated DB makes zero writes and exits 0.
- [x] Dry-run mode: `pnpm migrate:editor --dry-run` reports counts without writing.
- [x] Honors a `--module=<name>` flag to scope to one model when debugging.
- [x] Script does not require the API server to be running — connects to Prisma directly.

## Technical Notes
- Reuse `RichTextService` from `apps/api/src/modules/rich-text/` — instantiate it standalone (or via NestApplicationContext) so we don't duplicate sanitization logic.
- For the translatable variant `{ en, vi }`, run `migrateDoc` per locale slot.
- Logging: tag with `[migrate:editor]` prefix; summary at end (`X rows scanned, Y migrated, Z skipped`).

**Specialized Skill:** none (script is plumbing).

## Files to Touch
- `apps/api/scripts/migrate-rich-text.ts` (new)
- `package.json` (root scripts)
- `apps/api/src/modules/rich-text/**` (export an injection-context-free factory if needed)

## Dependencies
- 305-rte-prisma-migrations
- 307-rte-tiptap-concrete (for `migrateDoc` re-export — or import from `document-engine-core` directly)
- 310-rte-be-service

## Complexity: S

## Progress Log
- [2026-06-30] Started — confirmed all `*Json` columns store the `{ en, vi }` translatable envelope (BlogPost too, via `wrapContentByLanguage`); `new RichTextService()` works standalone (no DI deps); tsx resolves the `@portfolio/*` + engine imports under `apps/api/tsconfig.json`.
- [2026-06-30] Implemented metadata-driven script (`MODULES` table → delegate + field-col triplets), reusing `RichTextService.toCanonicalFormTranslatable` (migrate → Tiptap HTML → DOMPurify) so it can't drift from the write path. Per-row error isolation (continues, exit 1 if any). Scans all rows for honest counts.
- [2026-06-30] Verified against local DB: full dry-run 48 scanned/0 migrated/exit 0; `--module=blog-post` scopes to 16; bad module errors clearly. Forced one row to v0 + nulled html → dry reported `content v0→v1`, real run migrated + regenerated/sanitized html (en 258 chars, vi empty-doc 0), re-run idempotent (0 migrated). Type-clean via dedicated tsconfig.
- [2026-06-30] Done — all ACs satisfied.
