# Task: BE — extend `ListPublicPostsQuery` with search + sort (extensible shape)

## Status: done

## Goal
Add `search` (free-text against title + excerpt) and `sortBy` (`'newest' | 'oldest'`) to the public list query, keeping the filter/sort shape extensible for future fields (`language`, `tag`, `featured`, `mostRead`, etc.). Keep the existing `categorySlug` filter.

## Context
Per `epic-portfolio-blog.md` § Direction Pivot — the rebuilt `/blog` list section requires search + sort + category-only filter. Filter and sort shapes must be extension-friendly: today only one of each is exposed publicly, but the codepath should not need refactor when more land.

The query handler today (`apps/api/src/modules/blog-post/application/queries/list-public-posts.query.ts`) accepts `BlogPostListPublicOptions { page, limit, categoryId, tagId, language }`. The repository method `listPublic(options)` runs the Prisma query. Both need extension.

## Acceptance Criteria
- [x] `BlogPostListPublicOptions` interface (in `blog-post.repository.port.ts`) extended with:
  - `search?: string` — free-text against `title` (case-insensitive contains) OR `excerpt` (case-insensitive contains). Trim whitespace; treat empty string as no-search.
  - `sortBy?: 'newest' | 'oldest'` — defaults to `'newest'` when absent. Use a TS union (not string) so type system catches typos.
- [x] Public query input DTO (the Zod schema) extends with the same fields. `sortBy` defaults to `'newest'`.
- [x] `ListPublicPostsHandler` accepts and forwards the two fields.
- [x] Repository `listPublic(options)`:
  - When `search` is non-empty: adds Prisma `OR: [{ title: { contains, mode: 'insensitive' } }, { excerpt: { contains, mode: 'insensitive' } }]` to the WHERE clause.
  - When `sortBy === 'oldest'`: `orderBy: [{ publishedAt: 'asc' }]`. Else `'desc'` (current default).
- [x] Controller endpoint (`/api/blog`) parses query params `search` and `sort` (URL-side names — pick whichever is convention; existing `tagSlug`, `categorySlug` suggest `sort` not `sortBy`).
- [x] Public-side data-access (`BlogDataService.list` + `BlogListQuery` type in `libs/landing/shared/data-access`) syncs both fields.
- [x] Existing endpoints unaffected — calling without `search` / `sort` reproduces today's behavior exactly.
- [x] Tests in `blog-post-queries.spec.ts`:
  - [x] Handler forwards search to repo.
  - [x] Whitespace-only search → undefined.
  - [x] Default sort is `newest`.
  - [x] `sort='oldest'` forwarded as `sortBy: 'oldest'`.
  - [x] Unknown sort value rejected.
  - Title/excerpt contains + case-insensitive shape is enforced by the Prisma where clause (covered by repository code review, not unit test — repo is integration-tested via the handler mock).
- [x] Targeted jest passes (`117/117`).

## Technical Notes
- Postgres `ILIKE` is the natural primitive for case-insensitive contains. Prisma's `mode: 'insensitive'` compiles to that.
- For a small dataset (Phuong's blog will plateau at ~100 posts), ILIKE on title + excerpt is fast enough — no need for pg full-text search yet. Document the upgrade path in the handler comment ("If post count exceeds ~1000, switch to a `tsvector` column").
- Extensibility shape: `sortBy` is a TS union literal today. If a third option lands tomorrow, the union grows. Avoid an enum class — the cost of import-everywhere exceeds the value here.
- Filter extensibility: the existing pattern of one optional field per filter scales fine for ~10 fields. Don't introduce a generic filter DSL prematurely.
- `BlogListQuery` (landing FE type) currently exposes `categorySlug` and `tagSlug` — keep both, add `search` and `sort`.
- URL param naming: `?search=` and `?sort=newest|oldest`. Default `sort` does not appear in URL.

**Specialized Skill:** `be-test` — backend test discipline (NestJS/DDD test patterns).

## Files to Touch
- `apps/api/src/modules/blog-post/application/ports/blog-post.repository.port.ts` (interface)
- `apps/api/src/modules/blog-post/application/queries/list-public-posts.query.ts` (handler)
- `apps/api/src/modules/blog-post/application/blog-post.dto.ts` (Zod input schema)
- `apps/api/src/modules/blog-post/infrastructure/repositories/blog-post.repository.ts` (Prisma query)
- `apps/api/src/modules/blog-post/presentation/blog-post-public.controller.ts` (URL param parsing)
- `apps/api/src/modules/blog-post/application/queries/blog-post-queries.spec.ts` (tests)
- `libs/landing/shared/data-access/src/lib/blog.types.ts` (`BlogListQuery` extension)
- `libs/landing/shared/data-access/src/lib/blog.service.ts` (params builder)

## Dependencies
None (parallel with 357).

## Complexity: S

## Progress Log
- 2026-05-24 Started — added `BlogPostPublicSort = 'newest' | 'oldest'` + extended `BlogPostListPublicOptions` with `search?: string` and `sortBy?: BlogPostPublicSort` in the repo port. Doc-commented the union as the extension point (e.g. future `'mostRead'`).
- 2026-05-24 DTO: `PublicBlogPostQuerySchema` extended with `search` (trimmed; empty/whitespace → undefined via `.transform`) and `sort` (URL-side name, default `'newest'`). Exported `PUBLIC_BLOG_SORT` const tuple + `PublicBlogSort` type alias.
- 2026-05-24 Handler `ListPublicPostsHandler` now passes `search: data.search` + `sortBy: data.sort` to `repo.listPublic`. Controller unchanged — it forwards raw `@Query()` already, Zod picks up the new keys.
- 2026-05-24 Repository `listPublic` reads `search` + `sortBy` from options. When `search.trim()` non-empty, adds `OR: [{ title: ILIKE }, { excerpt: ILIKE }]`. When `sortBy === 'oldest'`, flips `publishedAt` direction to `asc`. Added a comment on the ~1000-post upgrade path to `tsvector`.
- 2026-05-24 FE data-access: `BlogListQuery` extended with `search?: string` and `sort?: BlogListSort`. `BlogDataService.list` trims search before serializing; `sort` is omitted from URL when equal to default `'newest'` (clean URLs).
- 2026-05-24 Tests: added 5 handler cases (search forwarded, whitespace search → undefined, default sort newest, oldest forwarded, unknown sort rejected) and 4 dto cases (default sort newest, oldest accepted, unknown rejected, search trimmed + whitespace → undefined).
- 2026-05-24 `npx tsc --noEmit -p apps/api/tsconfig.app.json` clean. `npx tsc --noEmit -p libs/landing/shared/data-access/tsconfig.lib.json` clean. `npx jest apps/api/src/modules/blog-post` → **117/117 green** (was 108; +9 new).
- 2026-05-24 Done — all ACs satisfied.
