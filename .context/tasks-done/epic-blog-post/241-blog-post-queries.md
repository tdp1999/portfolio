# Task: BlogPost CQRS Queries + Handlers + Tests

## Status: pending

## Goal
Implement read operations: admin list, admin get-by-id, public list (paginated + filterable), public get-by-slug, featured list, and related posts.

## Context
BlogPost queries must enforce PostStatus visibility rules (PST-002 through PST-005). Public endpoints only return PUBLISHED posts (except slug endpoint which also returns UNLISTED). Admin endpoints return all statuses including soft-deleted.

## Acceptance Criteria

**ListPostsQuery (admin):**
- [ ] Paginated list with optional filters: status, language, search (title), categorySlug, tagSlug
- [ ] Includes soft-deleted posts (for trash tab)
- [ ] Returns data[] + meta (total, page, limit)
- [ ] Unit test: pagination, status filter, search, empty results

**GetPostByIdQuery (admin):**
- [ ] Returns full post with categories, tags, featured image
- [ ] Includes soft-deleted posts
- [ ] Throws NotFoundError if not found
- [ ] Unit test: found, not found

**ListPublicPostsQuery:**
- [ ] Only PUBLISHED + not deleted (PST-005)
- [ ] Paginated with optional category/tag filter
- [ ] Sorted by publishedAt DESC
- [ ] Unit test: filters out draft/private/unlisted/deleted, pagination, category filter

**GetPublicPostBySlugQuery:**
- [ ] Returns PUBLISHED or UNLISTED + not deleted (PST-004, PST-005)
- [ ] Includes related posts (same category/tag, max 3)
- [ ] Includes author info (from User, optionally enriched from Profile)
- [ ] Throws NotFoundError for DRAFT, PRIVATE, deleted, or non-existent slugs
- [ ] Unit test: published slug, unlisted slug, draft slug (404), private slug (404), deleted slug (404)

**ListFeaturedPostsQuery:**
- [ ] Featured + PUBLISHED + not deleted
- [ ] No pagination (small set)
- [ ] Unit test: returns only featured+published

## Technical Notes
- Status filtering is the core complexity here — every public query must correctly exclude non-public posts
- Related posts: repository handles the query (overlapping categories/tags, exclude current, limit 3)
- Author info: try Profile module for name/avatar/bio, fall back to User.name if Profile unavailable
- Follow `apps/api/src/modules/category/application/queries/` pattern

## Files to Touch
- `apps/api/src/modules/blog-post/application/queries/list-posts.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/queries/get-post-by-id.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/queries/list-public-posts.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/queries/get-public-post-by-slug.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/queries/list-featured-posts.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/queries/index.ts` (new)
- Unit test files for each handler

## Dependencies
- 238-blog-post-repository
- 239-blog-post-dtos-presenter

## Complexity: M
5 query handlers, but each is straightforward read + filter. Status visibility logic is the main thing to test thoroughly.

## Progress Log
