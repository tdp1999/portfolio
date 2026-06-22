# Task 363: Rich-Text — Drop Legacy Prose Columns (Contract)

## Status: pending

## Goal
Complete the expand/contract migration started in task 305 by dropping the old string/markdown columns once every reader consumes the new `*Json` / `*Html` columns.

## Context
Task 305 adds `*Json` / `*Html` / `*SchemaVersion` columns alongside the legacy string/markdown columns (e.g. `Profile.bioLong`, `Project.body`, `BlogPost.content`, `TechnicalHighlight.*`, `Experience.*`) and leaves the old ones in place through the expand phase. This task is the **contract** step: remove the legacy columns after backfill + cutover confirm zero referencing reads. Without it, the schema accumulates dead columns indefinitely.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 2 (expand/contract follow-up).

## Acceptance Criteria
- [ ] Confirm no runtime read path references any legacy prose column (grep repos, DTOs, landing renderers, importer).
- [ ] Confirm all rows backfilled into `*Json` / `*Html` (no nulls where content exists) — see migrate:editor (task 319) and the Obsidian importer (task 318).
- [ ] Single contract migration drops the legacy columns for all five field groups.
- [ ] Prisma client regenerates; type-check + build clean; seed succeeds.
- [ ] Migration applied to dev DB without data loss.

## Technical Notes
- Use the `prisma-migrate` skill (destructive-change check + backup).
- Gate on real cutover, not calendar — only drop once Phases 5–8 ship and reads are verified off the legacy columns.

## Files to Touch
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_drop_legacy_prose_columns/migration.sql`
- any repo/DTO still typing the old fields

## Dependencies
- 305 (expand), 311 (console writes new fields), 312/313/314 (landing reads new fields), 317/318/319 (parsers retired + backfill)

## Complexity: M

## Progress Log
