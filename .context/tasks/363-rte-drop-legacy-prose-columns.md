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
- [ ] Remove the legacy/`*Json` dual fields that task 311 (console swap) introduced — see "311 dual-field cleanup" below.
- [ ] Single contract migration drops the legacy columns for all five field groups.
- [ ] Prisma client regenerates; type-check + build clean; seed succeeds.
- [ ] Migration applied to dev DB without data loss.

### 311 dual-field cleanup (FE + DTO shape)
Task 311 kept legacy markdown fields **alongside** the new `*Json` ones (optional, dual-write) so landing could keep rendering until 312–314. Once landing reads `*Json`, drop the legacy side of each pair:

All five field groups now dual-write (legacy + `*Json`) via task 311 slices S1–S4. For each, drop the legacy side:

- [ ] **FE types** — keep only the `*Json` fields; remove legacy:
  - `libs/console/feature-project/src/lib/project.types.ts` — `AdminHighlight.{challenge,approach,outcome}`, `AdminProject.body`, `HighlightPayload`/create/update legacy fields (keep `*Json`, `bodyJson`).
  - `libs/console/feature-profile/src/lib/profile.types.ts` — legacy `bioLong` (keep `bioLongJson`).
  - `libs/console/feature-blog/src/lib/blog.types.ts` — `AdminBlogPostDetail.content` + `Create/UpdateBlogPostPayload.content` (keep `contentJson`). NOTE: the FE currently derives plain-text `content` from the editor to satisfy the legacy NOT-NULL column — that derivation goes away when the column is dropped.
  - `libs/console/feature-experience/src/lib/experience.types.ts` — `AdminExperience.{description,responsibilities,highlights}` + payload legacy fields (keep `*Json`).
- [ ] **DTO (BE)** — remove legacy markdown/string from schemas (drop `.optional()` transition shims): project `challenge/approach/outcome`+`body`; profile `bioLong`; blog `content` (becomes derived/dropped); experience `description/responsibilities/highlights` string fields.
- [ ] **Entity/Mapper/repo** — stop writing legacy columns; remove rebuild-from-legacy paths:
  - project `project-highlight.mapper.ts` (`mapStoredHighlightToInput`), `highlightRichData` legacy writes, `project.mapper.ts` legacy `body`.
  - blog `blog-post.entity.ts` (`content` field + `calculateReadTime(data.content)` → derive from rich), `blog-content-rich.util.ts` stays.
  - experience legacy `description/responsibilities/highlights` writes in mapper + repo.
- [ ] **Prisma** — blog `content` is currently `String @db.Text` NOT NULL; dropping it (or making readTime derive from rich) is part of this contract migration.
- [ ] **Specs** — update `project.dto.spec.ts`, `blog-post-commands.spec.ts`, `experience-commands.spec.ts` (legacy-optional cases) to assert `*Json` is the only accepted shape.

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
- [2026-06-28] Clear-field check (pre-commit review flag): NOT a regression. `toBilingualRichTextPayload` / `buildBioLongJson` gate on `null` (`??`), not emptiness — a cleared editor emits a present-but-empty doc, so it is sent and the BE wipes the field. Only a never-touched field with no doc is omitted (nothing to clear). Locked by `rich-text.validator.spec.ts` ("sends a present-but-empty doc so a cleared field can be wiped"). No action needed here.
- [2026-06-28] Added "311 dual-field cleanup" checklist — task 311 is now COMPLETE (S1 Profile.bioLong, S2 Project body/highlights, S3 Blog content, S4 Experience description/responsibilities/highlights) and all five groups dual-write legacy + `*Json`. This task gates removal of the legacy side after the landing render swaps (312–314, + an experience render swap) land. Blog adds a wrinkle: legacy `content` is NOT NULL and the FE derives plain text to fill it — that derivation and the column go together here.
