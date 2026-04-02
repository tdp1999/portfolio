# Task: BlogPost Repository Port + Adapter + Mapper

## Status: pending

## Goal
Create repository interface (port), Prisma implementation (adapter), and mapper for BlogPost entity.

## Context
BlogPost repository needs status-aware filtering for public vs admin queries, plus junction table management for PostCategory and PostTag. Follows established port/adapter pattern from Category, Skill, Media modules.

## Acceptance Criteria
- [ ] `IBlogPostRepository` port interface with methods:
  - `add(entity: BlogPost): Promise<Id>` — insert with category/tag junctions
  - `update(id: Id, entity: BlogPost, categoryIds: string[], tagIds: string[]): Promise<boolean>` — update + replace junctions
  - `remove(id: Id, deletedById: Id): Promise<boolean>` — soft delete
  - `restore(id: Id): Promise<boolean>`
  - `findById(id: Id): Promise<BlogPost | null>` — admin, includes deleted
  - `findBySlug(slug: string): Promise<BlogPost | null>` — published + unlisted only
  - `findPublicBySlug(slug: string): Promise<BlogPost | null>` — status IN (PUBLISHED, UNLISTED), not deleted
  - `list(query): Promise<{ data: BlogPost[]; total: number }>` — admin, paginated, all statuses
  - `listPublic(query): Promise<{ data: BlogPost[]; total: number }>` — published only, paginated, filter by category/tag
  - `listFeatured(): Promise<BlogPost[]>` — featured + published + not deleted
  - `findRelated(postId: Id, categoryIds: string[], tagIds: string[], limit: number): Promise<BlogPost[]>`
- [ ] `BlogPostMapper` with `toDomain()` and `toPrisma()` methods
  - Handles nested includes: categories (with Category), tags (with Tag), featuredImage (with Media)
- [ ] `BlogPostRepository` Prisma implementation
  - Junction tables use replace-all strategy on update (delete existing + insert new in transaction)
  - Public queries: `WHERE status = 'PUBLISHED' AND deletedAt IS NULL`
  - Slug query: `WHERE status IN ('PUBLISHED', 'UNLISTED') AND deletedAt IS NULL`
  - Related posts query: find posts sharing categories/tags, exclude current post, limit N
- [ ] `BLOG_POST_REPOSITORY_TOKEN` DI token
- [ ] Unit tests for mapper

## Technical Notes
- **Specialized Skill:** `be-test` — **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Mapper section)
- Junction replace strategy: within `$transaction`, delete all PostCategory/PostTag for postId, then insert new set
- Related posts: `WHERE id != :currentPostId AND status = 'PUBLISHED' AND deletedAt IS NULL AND (id IN (SELECT postId FROM post_categories WHERE categoryId IN (...)) OR id IN (SELECT postId FROM post_tags WHERE tagId IN (...)))` ORDER BY publishedAt DESC LIMIT 3
- Include strategy: always include categories + tags for list/detail. Only include featuredImage when needed for URL resolution.
- Follow `apps/api/src/modules/category/infrastructure/repositories/category.repository.ts` pattern

## Files to Touch
- `apps/api/src/modules/blog-post/application/ports/blog-post.repository.port.ts` (new)
- `apps/api/src/modules/blog-post/application/blog-post.token.ts` (new)
- `apps/api/src/modules/blog-post/infrastructure/repositories/blog-post.repository.ts` (new)
- `apps/api/src/modules/blog-post/infrastructure/mapper/blog-post.mapper.ts` (new)
- `apps/api/src/modules/blog-post/infrastructure/mapper/blog-post.mapper.spec.ts` (new)

## Dependencies
- 236-blog-post-schema-migration
- 237-blog-post-entity

## Complexity: L
More complex than typical repository — junction table management, status-aware filtering, related posts query, pagination with filtering.

## Progress Log
