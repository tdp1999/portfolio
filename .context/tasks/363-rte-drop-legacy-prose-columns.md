# Task 363: Rich-Text — Drop Legacy Prose Columns (Contract)

## Status: blocked

## Blocked On (verified 2026-06-30)
A single contract migration dropping all five legacy field groups is the locked AC, but 3 of 5 groups still have **live runtime reads** off the legacy columns. Dropping now breaks landing. Prerequisites before this task can run:

1. **Profile** — land **task 312** (home-intro per-paragraph render off `bioLongJson`). Today `home.intro.ts:33` / `home.ts:72` read legacy `Profile.bioLong` via `parseBioLong`. Task 312 is itself `blocked`.
2. **Blog** — cutover read-time: landing `blog.detail.ts:141` `wordCount(p.content)` → API `readTimeMinutes` (or derive from `contentHtml`); drop `content` from the public presenter (`blog-post.presenter.ts:40,109`) + DTO; move entity `calculateReadTime` off legacy `content`. `BlogPost.content` is `NOT NULL`, so the FE plain-text derivation and the column go together.
3. **Experience** — **DECISION REQUIRED + missing task.** Landing renders legacy string arrays (`about.experience.util.ts:18-19`, `.html:180-198`). No RTE render-swap task exists. Either (a) create an experience landing render-swap task, or (b) declare experience fields non-rich → then the `*Json` triplet from 311 S4 is what gets dropped, not the legacy side (reverses drop direction for this group).

**Project** group is render-safe today (landing reads rich HTML) but still needs its task-311 dual-field BE/FE cleanup before its columns can drop. If we later choose to split, Project is the only group shippable now.

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

## Live legacy-read audit (2026-06-30, during task 318)

Grepped every runtime read of a legacy prose column (BE presenter/repo + landing renderers). **Drop-readiness per field group** — a group can only be dropped once it shows ✅:

| Field group | Legacy col | Still-live runtime read | Verdict |
|---|---|---|---|
| **Project body** | `Project.body` | landing renders `bodyHtml` (`project.detail.ts:120`); no legacy read | ✅ ready (313 done) |
| **Project highlights** | `TechnicalHighlight.challenge/approach/outcome` | landing reads rich html via project detail; verify no legacy fallback in highlight mapper | ✅ likely ready — confirm `project-highlight.mapper.ts` has no read-time legacy path |
| **Blog content** | `BlogPost.content` | ⚠️ landing `blog.detail.ts:141` `wordCount(p.content)` reads legacy markdown for read-time; presenter still ships `content` (`blog-post.presenter.ts:40,109`; public detail DTO exposes it) | ❌ **blocked** — switch landing to API `readTimeMinutes` (or derive from `contentHtml`), drop `content` from public presenter/DTO first |
| **Profile bioLong** | `Profile.bioLong` | ⚠️ landing home intro renders legacy markdown via `parseBioLong` (`home.intro.ts:33`, `home.intro.util.ts`) because **task 312 is blocked** (per-paragraph lamp/pen ≠ single innerHTML) | ❌ **blocked on 312** (prose-block-renderer epic) |
| **Experience desc/resp/highlights** | `Experience.description/responsibilities/highlights` | ⚠️ landing about renders legacy JSON arrays (`about.experience.util.ts:18-19`, `.html:180-198`) as bullet lists — **no RTE html render-swap task exists yet** | ❌ **blocked** — needs an experience landing render-swap task (or a decision that these stay plain string arrays, not rich text → then their `*Json` triplet from 311 S4 is the column to drop, not the legacy side) |

**Consequence:** 363 cannot be a single big-bang drop. Either (a) split into per-group contract migrations as each unblocks, or (b) hold until 312 + the experience-render decision land. Blog is closest — only the `wordCount`/presenter cutover stands between it and droppable.

**Open gap to not forget:** there is **no task** for the Experience landing RTE render-swap that 363 line 49 ("+ an experience render swap") assumes. Decide its fate before 363: render-swap task, or declare experience fields non-rich and reverse the drop direction.

**Task 318 note:** the importer writes the full triplet (`contentJson/Html/SchemaVersion`) AND keeps raw markdown in legacy `content` — required because read-time still derives from it (entity `calculateReadTime` + landing `wordCount`). 318 adds no new legacy debt; it makes import match create/update.

## Progress Log
- [2026-06-30] Status → **blocked**. Re-verified all 5 groups against current code (post-318): audit holds exactly. Profile reads legacy via `parseBioLong` (312 still blocked); blog `wordCount(p.content)` + presenter `content:40,109` still live; experience renders legacy string arrays, no render-swap task. Project render-safe but BE still plumbs legacy fields. Recorded prerequisites in "Blocked On". User decision (2026-06-30): hold 363, unblock prerequisites first, then drop all five at once.
- [2026-06-30] Recorded live legacy-read audit (above) during task 318. Blog content is the only group near-droppable; profile/experience blocked; flagged the missing experience render-swap task.
- [2026-06-28] Clear-field check (pre-commit review flag): NOT a regression. `toBilingualRichTextPayload` / `buildBioLongJson` gate on `null` (`??`), not emptiness — a cleared editor emits a present-but-empty doc, so it is sent and the BE wipes the field. Only a never-touched field with no doc is omitted (nothing to clear). Locked by `rich-text.validator.spec.ts` ("sends a present-but-empty doc so a cleared field can be wiped"). No action needed here.
- [2026-06-28] Added "311 dual-field cleanup" checklist — task 311 is now COMPLETE (S1 Profile.bioLong, S2 Project body/highlights, S3 Blog content, S4 Experience description/responsibilities/highlights) and all five groups dual-write legacy + `*Json`. This task gates removal of the legacy side after the landing render swaps (312–314, + an experience render swap) land. Blog adds a wrinkle: legacy `content` is NOT NULL and the FE derives plain text to fill it — that derivation and the column go together here.
