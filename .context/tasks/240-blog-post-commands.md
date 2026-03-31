# Task: BlogPost CQRS Commands + Handlers + Tests

## Status: pending

## Goal
Implement write operations: create, update, delete (soft), restore, and import-markdown commands with full test coverage.

## Context
BlogPost commands follow CQRS pattern. Create/Update handle junction tables (categories, tags) atomically. Import-markdown is a specialized create command that accepts raw markdown content. All validation in handlers, not controllers.

## Acceptance Criteria

**CreatePostCommand:**
- [ ] Validates input via `CreateBlogPostSchema.safeParse()`
- [ ] Creates BlogPost entity via `BlogPost.create()`
- [ ] Persists with category/tag associations in transaction
- [ ] Returns created post ID
- [ ] Unit test: valid create, validation failure, slug collision handling

**UpdatePostCommand:**
- [ ] Validates input via `UpdateBlogPostSchema.safeParse()`
- [ ] Loads existing entity, applies `entity.update()`
- [ ] If status changed to PUBLISHED: call `entity.publish()` (auto-sets publishedAt per PST-007)
- [ ] Replace-all strategy for category/tag junctions
- [ ] Unit test: valid update, not found, status transition, readTime recalculation

**DeletePostCommand:**
- [ ] Soft delete via `entity.softDelete()`
- [ ] Unit test: valid delete, already deleted, not found

**RestorePostCommand:**
- [ ] Restore via `entity.restore()`
- [ ] Unit test: valid restore, not deleted, not found

**ImportMarkdownCommand:**
- [ ] Accepts raw markdown string (already parsed by frontend)
- [ ] Extracts title from first h1 heading (if present), otherwise requires explicit title
- [ ] Calculates readTimeMinutes from content
- [ ] Creates BlogPost with status=DRAFT always (PST-008)
- [ ] Returns created post ID
- [ ] Unit test: import with h1, import without h1, empty content

## Technical Notes
- Slug collision: query existing slugs, append -2, -3 etc. Same pattern as Project.
- Import-markdown handler receives already-processed markdown (images already uploaded by frontend). It's essentially a specialized CreatePost with auto-extracted metadata.
- All error throwing in handlers, never in controller
- Follow `apps/api/src/modules/category/application/commands/` pattern

## Files to Touch
- `apps/api/src/modules/blog-post/application/commands/create-post.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/commands/update-post.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/commands/delete-post.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/commands/restore-post.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/commands/import-markdown.handler.ts` (new)
- `apps/api/src/modules/blog-post/application/commands/index.ts` (new)
- Unit test files for each handler

## Dependencies
- 237-blog-post-entity
- 238-blog-post-repository
- 239-blog-post-dtos-presenter

## Complexity: L
5 commands with junction table management, status transitions, slug collision handling, and import logic. Significant test surface.

## Progress Log
