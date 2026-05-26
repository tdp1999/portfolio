# Task: Cleanup — remove deprecated blog code, verify no orphans

## Status: pending

## Goal
Remove any code that was replaced or orphaned by the blog graduation (e.g. the original pre-DDL `blog-list-page` / `blog-detail-page` implementations, unused `toc.component.ts`, etc.), confirm seed posts behave correctly across a re-seed, and write a brief shipping note.

## Context
Per `epic-portfolio-blog.md` final cleanup pass. DDL pages stay (per memory rule). Production pages have been swapped to winners. Old code that no longer compiles into the bundle should be deleted to keep the lib clean.

Reminder: avoid backwards-compatibility hacks, do not leave `// removed for X` comments, do not preserve unused re-exports.

## Acceptance Criteria
- [ ] Grep for any unused exports in `libs/landing/feature-blog/src/index.ts` — remove ones that no module imports.
- [ ] If `libs/landing/feature-blog/src/lib/blog-detail-page/toc.component.ts` was replaced by `landing-toc-sidebar` (or by an inline TOC in winning Variant 1), delete the file.
- [ ] Any helpers, types, or styles in `libs/landing/feature-blog/` that are no longer referenced — delete.
- [ ] `apps/landing/src/app/pages/coming-soon/` left untouched unless grep confirms zero references (other routes may still use it). Document the finding in this task's Progress Log.
- [ ] DDL pages `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` left in place. Do not delete (per `feedback_ddl_keep_after_graduate`). If desired, add an inline marker in each variant comment (e.g. "Graduated as production winner") — optional, not required.
- [ ] Re-run seed (`pnpm prisma db seed`) twice in a row — confirm zero duplicates, CMS-authored posts (any without `seed-` prefix) untouched.
- [ ] Type-check (`npx tsc --noEmit`) clean. Landing prod build clean.
- [ ] Brief shipping note added to `.context/progress.md` under the appropriate Epic section (created during the epic): "Epic Portfolio Blog completed [date]. Winners: list Variant <X>, detail Variant <N>, featured treatment <α|β>. DDL pages kept at /ddl/blog-list-variants and /ddl/blog-detail-variants."
- [ ] Update `epic-portfolio-blog.md` status from `broken-down` → `completed`.

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
