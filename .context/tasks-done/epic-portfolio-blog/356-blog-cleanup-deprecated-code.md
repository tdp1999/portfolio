# Task: Cleanup — remove deprecated blog code, verify no orphans

## Status: completed (2026-05-28)

## Goal
Remove any code that was replaced or orphaned by the blog graduation (e.g. the original pre-DDL `blog-list-page` / `blog-detail-page` implementations, unused `toc.component.ts`, etc.), confirm seed posts behave correctly across a re-seed, and write a brief shipping note.

## Context
Per `epic-portfolio-blog.md` final cleanup pass. DDL pages stay (per memory rule). Production pages have been swapped to winners. Old code that no longer compiles into the bundle should be deleted to keep the lib clean.

Reminder: avoid backwards-compatibility hacks, do not leave `// removed for X` comments, do not preserve unused re-exports.

## Acceptance Criteria
- [x] Grep for any unused exports in `libs/landing/feature-blog/src/index.ts` — remove ones that no module imports.
- [x] If `libs/landing/feature-blog/src/lib/blog-detail-page/toc.component.ts` was replaced by `landing-toc-sidebar` (or by an inline TOC in winning Variant 1), delete the file.
- [x] Any helpers, types, or styles in `libs/landing/feature-blog/` that are no longer referenced — delete.
- [x] `apps/landing/src/app/pages/coming-soon/` left untouched unless grep confirms zero references (other routes may still use it). Document the finding in this task's Progress Log.
- [x] DDL pages `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` left in place. Do not delete (per `feedback_ddl_keep_after_graduate`). If desired, add an inline marker in each variant comment (e.g. "Graduated as production winner") — optional, not required.
- [x] Re-run seed (`pnpm prisma db seed`) twice in a row — confirm zero duplicates, CMS-authored posts (any without `seed-` prefix) untouched.
- [x] Type-check (`npx tsc --noEmit`) clean. Landing prod build clean.
- [x] Brief shipping note added to `.context/progress.md` under the appropriate Epic section (created during the epic): "Epic Portfolio Blog completed [date]. Winners: list Variant <X>, detail Variant <N>, featured treatment <α|β>. DDL pages kept at /ddl/blog-list-variants and /ddl/blog-detail-variants."
- [x] Update `epic-portfolio-blog.md` status from `broken-down` → `completed`.

## Technical Notes
- Use `grep -r "BlogListPage\|BlogDetailPage\|toc\\.component" libs apps` (or equivalent ripgrep) to find references before deleting.
- Run `pnpm nx graph` (or `nx affected:graph`) to see if anything else imports from `feature-blog` unexpectedly.
- Do NOT delete the `feature-blog` lib itself — it still hosts the production pages.
- Do NOT delete `BLOG_ROUTES` export — it's the entry point used by `app.routes.ts`.
- Document any deleted file in the Progress Log so the diff is reviewable.

## Files to Touch
- `libs/landing/feature-blog/src/lib/blog-detail-page/toc.component.ts` (delete if confirmed orphan)
- `libs/landing/feature-blog/src/index.ts` (prune unused exports)
- `.context/progress.md` (add shipping note)
- `.context/plans/epic-portfolio-blog.md` (status → completed; move to `plans-done/` per existing convention)

## Dependencies
- 355 (E2E pass before cleanup)

## Complexity: S

## Progress Log

### 2026-05-28 — Cleanup pass, epic closed

**Orphan scan**
- `libs/landing/feature-blog/src/lib/` contents:
  - `blog.routes.ts` — uses `BlogListPage` + `BlogDetailPage`. Keep.
  - `blog-list-page/` — html / scss / ts only. All used. Keep.
  - `blog-detail-page/` — html / scss / ts + `blog-share-row.component.ts`. Share-row imported by `blog-detail-page.ts:35`. Keep.
  - `toc.component.ts` — already removed in an earlier graduation task. Confirmed absent. ✓
  - No other helper / type / style files in the lib.

**Exports pruned (`libs/landing/feature-blog/src/index.ts`)**
- Removed `BlogListPage` and `BlogDetailPage` re-exports — only `BLOG_ROUTES` is consumed externally (`apps/landing/src/app/app.routes.ts:32`).
- Final export surface: `BLOG_ROUTES` only.

**`coming-soon/` finding**
- `grep -r "ComingSoonPage\|coming-soon"` across `apps/` + `libs/` found references only inside `apps/landing/src/app/pages/coming-soon/` itself + one documentation string in `apps/landing/src/app/pages/ddl/page-shell/page-shell.page.ts:207` listing it as a migrated callsite for `landing-page-shell`.
- `app.routes.ts` no longer imports `ComingSoonPage` (the route was swapped by task 354 — `/blog` now loads `BLOG_ROUTES`, no other route uses it).
- **Decision:** zero functional refs ⇒ deleted the entire `apps/landing/src/app/pages/coming-soon/` folder and removed the `coming-soon.page` bullet from the DDL `page-shell` migration list.

**Seed re-run (idempotency)**
- `pnpm prisma:seed` run twice in succession.
- Both runs produced identical output: admin / profile / 6 umbrellas / 4 categories / 6 `seed-*` blog posts — all "already exists — skipping". No mutations on second run. No CMS-authored content touched (verified by `seed-` prefix gating in `seed.ts`).

**Type-check + build**
- `npx tsc --noEmit -p libs/landing/feature-blog/tsconfig.lib.json` — clean.
- `npx tsc --noEmit -p apps/landing/tsconfig.app.json` — clean.
- `pnpm nx build landing` — succeeded; only the pre-existing budget warnings on DDL pages and the initial bundle (unchanged by this task).

**DDL pages left in place**
- `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` untouched per `feedback_ddl_keep_after_graduate`.

**Epic close-out**
- `.context/plans/epic-portfolio-blog.md` status flipped `broken-down` → `completed`; moved to `.context/plans-done/`.
- Shipping note added to `progress.md` Completed Epics section; Pending Blog section collapsed to a single carry-over line for task 359.

**Files changed**
- `libs/landing/feature-blog/src/index.ts` — pruned to one export.
- `apps/landing/src/app/pages/ddl/page-shell/page-shell.page.ts` — dropped `coming-soon.page` from the migration list.
- Deleted: `apps/landing/src/app/pages/coming-soon/` (4 files: `.page.ts`, `.page.html`, `.page.scss`, plus folder).
- `.context/progress.md` — added Completed Epic entry; collapsed Pending Blog block.
- `.context/plans/epic-portfolio-blog.md` → `.context/plans-done/epic-portfolio-blog.md` (status updated + Completed date).
