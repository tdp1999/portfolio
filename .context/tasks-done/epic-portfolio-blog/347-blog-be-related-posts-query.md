# Task: BE — extend public post detail with related-posts payload

## Status: done

## Goal
Server returns `relatedPosts: BlogPostListItem[]` (3 by primary-category match) on the detail endpoint so landing detail page can render the "Related" footer without an extra round-trip.

## Context
Per `epic-portfolio-blog.md` detail variants (all three) and domain rule **PST-010**: related posts on `/blog/:slug` are computed by primary-category match — exclude self, order `publishedAt DESC`, limit 3. If fewer than 3 share the primary category, render the smaller set; never pad with recents/featured.

Existing query: `apps/api/src/modules/blog-post/application/queries/get-public-post-by-slug.query.ts`. Existing DTO already returns post fields; add `relatedPosts` array.

## Acceptance Criteria
- [x] `GetPublicPostBySlugQuery` handler populates a `relatedPosts: BlogPostListItem[]` field on the response.
- [x] Selection rule (PST-010):
  - [x] Match the post's primary category (first entry in `categories` ordered consistently — document the ordering rule in the handler)
  - [x] Filter `status = PUBLISHED`, `deletedAt IS NULL`, `id != self.id`
  - [x] Order `publishedAt DESC`
  - [x] Limit 3
- [x] If post has zero categories, return `relatedPosts: []` (no fallback strategy).
- [x] If fewer than 3 matches exist, return the smaller set — do not pad.
- [x] `BlogPostDetail` DTO updated to include `relatedPosts: BlogPostListItem[]`.
- [x] Public landing-shared data-access type `BlogPostDetail` mirrors the new field (`libs/landing/shared/data-access/`).
- [x] Unit/spec test added/extended in `blog-post-queries.spec.ts` covering: 3 matches, 0 matches, fewer-than-3 matches, no-categories case.
- [x] Type-check + targeted `npx jest --config apps/api/jest.config.cts apps/api/src/modules/blog-post/application/queries/blog-post-queries.spec.ts --no-coverage` passes.

## Technical Notes
- Use repository pattern — extend `BlogPostRepository` with a method like `findRelatedByCategory(categoryId, excludeId, limit)` rather than ad-hoc Prisma in handler.
- Primary-category ordering: pick the first category by `id` ASC (or whatever ordering is already consistent in the existing list query). Document it.
- Avoid N+1 — fetch related posts in one query with included relations (categories, tags, featuredImage) so the DTO can shape them as `BlogPostListItem`.
- Presenter / mapper: reuse the existing list-item presenter so shape matches `BlogPostListItem` exactly.
- Domain rule `PST-010` should be referenced by code comment near the handler logic (timeless reference, not changelog).
- Controllers never throw — keep all logic in the query handler (CLAUDE.md guardrail).

## Files to Touch
- `apps/api/src/modules/blog-post/application/queries/get-public-post-by-slug.query.ts`
- `apps/api/src/modules/blog-post/application/queries/blog-post-queries.spec.ts`
- `apps/api/src/modules/blog-post/infrastructure/blog-post.repository.ts` (extend with related-posts method)
- `apps/api/src/modules/blog-post/application/dtos/` (extend `BlogPostDetailDto`)
- `apps/api/src/modules/blog-post/application/presenters/` (verify list-item presenter is reusable)
- `libs/landing/shared/data-access/src/lib/blog-data.service.ts` and types file (sync the new field)

## Dependencies
None (independent of seed and DDL work).

## Complexity: S

## Progress Log
- 2026-05-24 Started — repo already exposed `findRelated(postId, categoryIds[], tagIds[], limit)` with OR-of-categories OR-of-tags semantics. That contradicts PST-010 (primary category only, no tags, no padding), so the method is being replaced rather than extended.
- 2026-05-24 Port: `findRelated` → `findRelatedByPrimaryCategory(excludeId, primaryCategoryId, limit)`. Doc-comment cites PST-010. Repository impl simplified to a single `categories: { some: { categoryId: primaryCategoryId } }` filter, `id != excludeId`, `status: PUBLISHED`, `deletedAt: null`, `orderBy publishedAt DESC`, `take limit`.
- 2026-05-24 Handler: primary category resolved by `[...categories].map(id).sort()[0]` — deterministic without a schema-level "primary" flag, documented inline. Empty-categories short-circuits to `[]` (no repo call).
- 2026-05-24 DTO + presenter unchanged (`BlogPostPublicDetailDto.relatedPosts: BlogPostPublicListItemDto[]` already in place from prior epic). Landing-side `BlogPostDetail` in `libs/landing/shared/data-access/src/lib/blog.types.ts` already mirrors the shape — no FE-type change required.
- 2026-05-24 Tests: extended `blog-post-queries.spec.ts` with 4 PST-010 scenarios (primary picks min-id, sparse <3 no padding, 0 matches, no categories → skip repo call). Updated mock factory in both `blog-post-queries.spec.ts` and `blog-post-commands.spec.ts` to expose the renamed method. `npx jest --config apps/api/jest.config.cts ... blog-post-queries.spec.ts --no-coverage` → 20/20 green. Commands spec → 22/22 green.
- 2026-05-24 `npx tsc --noEmit -p apps/api/tsconfig.app.json` clean.
- 2026-05-24 Done — all ACs satisfied.
