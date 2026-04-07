# Task: BlogPost Zod DTOs + Presenters

## Status: done

## Goal
Create Zod validation schemas for all BlogPost operations and presenter classes for public/admin response shaping.

## Context
BlogPost DTOs validate create/update payloads with category/tag ID arrays. Presenter resolves Media URLs for featured image, shapes public response (with author info + related posts) vs admin response (full data).

## Acceptance Criteria
- [x] `CreateBlogPostSchema` — title (required), content (required), language, excerpt, categoryIds[], tagIds[], featuredImageId, status (default DRAFT), featured, metaTitle, metaDescription
- [x] `UpdateBlogPostSchema` — all fields optional, partial update
- [x] `BlogPostQuerySchema` — page, limit, search (by title), status filter, language filter, categorySlug, tagSlug, sortBy (publishedAt, createdAt)
- [x] `PublicBlogPostQuerySchema` — page, limit, categorySlug, tagSlug (no status filter — always PUBLISHED)
- [x] `BlogPostPresenter` with:
  - `toPublicList()` — slug, title, excerpt, language, featuredImageUrl (resolved from Media), categories[], tags[], readTimeMinutes, publishedAt
  - `toPublicDetail()` — all public fields + content, metaTitle, metaDescription, author (name, avatarUrl, shortBio from Profile fallback to User), relatedPosts[]
  - `toAdmin()` — full entity data including audit fields, status, all relations
  - `toAdminList()` — summary for table display
- [x] All schemas use `stripHtmlTags()` transform on text fields (consistent with Category/Tag)
- [x] Zod v4 syntax (e.g., `z.email()` not `z.string().email()`)

## Technical Notes
- Author info in public detail: try to fetch from Profile module (name, avatar, shortBio). If Profile not available, fall back to User.name with no avatar/bio. Handle gracefully — Profile is an optional dependency.
- Featured image URL: resolve via Media relation (Cloudinary URL)
- Related posts in presenter: just map the BlogPost array from repository — presenter doesn't fetch, it shapes.
- Follow `apps/api/src/modules/category/application/category.dto.ts` and `category.presenter.ts` patterns

## Files to Touch
- `apps/api/src/modules/blog-post/application/blog-post.dto.ts` (new)
- `apps/api/src/modules/blog-post/application/blog-post.presenter.ts` (new)

## Dependencies
- 237-blog-post-entity (types needed for presenter)

## Complexity: M
Multiple schemas and presenter methods, but follows established patterns. Author info resolution adds some complexity.

## Progress Log
- 2026-04-06 Done — DTO + presenter + 21 specs green
