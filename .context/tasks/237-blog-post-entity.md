# Task: BlogPost Domain Entity + Types + Errors

## Status: pending

## Goal
Create BlogPost domain entity with business logic, type definitions, and domain-specific error codes.

## Context
BlogPost entity follows the established BaseCrudEntity pattern. Key domain logic: slug generation from title, read time calculation from content word count, publishedAt auto-set on first publish, 4-state PostStatus visibility rules.

## Acceptance Criteria
- [ ] `IBlogPostProps` interface with all fields matching Prisma schema
- [ ] `ICreateBlogPostPayload` and `IUpdateBlogPostPayload` types
- [ ] `BlogPost` entity extending `BaseCrudEntity<IBlogPostProps>`
- [ ] `BlogPost.create()` static factory: generates slug from title, sets defaults (status=DRAFT, featured=false), calculates readTimeMinutes
- [ ] `BlogPost.load()` static factory for hydrating from persistence
- [ ] `update()` method: recalculates readTimeMinutes on content change, regenerates slug on title change
- [ ] `publish()` method: sets status=PUBLISHED, auto-sets publishedAt if first publish (PST-007)
- [ ] `softDelete()` and `restore()` methods (inherited from BaseCrudEntity)
- [ ] Read time calculation: word count / 200, rounded up (PST-006)
- [ ] Validation: title + content required before Published/Unlisted status (PST-001)
- [ ] `BlogPostErrorCode` enum with NOT_FOUND, SLUG_CONFLICT, INVALID_STATUS_TRANSITION, CONTENT_REQUIRED
- [ ] Unit tests for: create, update, publish (first + subsequent), read time calculation, slug generation, status validation

## Technical Notes
- **Specialized Skill:** `be-test` — **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Entity section)
- Read time formula: split content by whitespace, count tokens, divide by 200, Math.ceil
- publishedAt: set on first `publish()` call only. If post was published before (publishedAt already set), don't overwrite.
- Status transition validation: cannot go to PUBLISHED or UNLISTED without title + content (PST-001)
- Slug: use `SlugValue.from(title)` — same pattern as Project, Category, Skill
- Follow existing entity patterns in `apps/api/src/modules/category/domain/entities/category.entity.ts`

## Files to Touch
- `apps/api/src/modules/blog-post/domain/entities/blog-post.entity.ts` (new)
- `apps/api/src/modules/blog-post/domain/blog-post.types.ts` (new)
- `apps/api/src/modules/blog-post/domain/blog-post.error.ts` (new)
- `apps/api/src/modules/blog-post/domain/entities/blog-post.entity.spec.ts` (new)

## Dependencies
- 236-blog-post-schema-migration (Prisma types needed for alignment)

## Complexity: M
Business logic (read time, publishedAt, status validation) adds more domain methods than typical CRUD entity, but patterns are established.

## Progress Log
