# Task: BlogPost Controller + NestJS Module Wiring

## Status: pending

## Goal
Create thin REST controller with public and admin routes, and wire up the BlogPost NestJS module with all dependencies.

## Context
Controller is a thin transport adapter — extracts input, dispatches to command/query bus, returns result. No validation, no error throwing, no business logic in controller. Module wires repository, command handlers, query handlers, and imports CategoryModule, TagModule, MediaModule.

## Acceptance Criteria

**Controller:**
- [ ] Public routes (no auth):
  - `GET /blog` → ListPublicPostsQuery (paginated, filterable)
  - `GET /blog/featured` → ListFeaturedPostsQuery
  - `GET /blog/:slug` → GetPublicPostBySlugQuery
- [ ] Admin routes (JWT + ADMIN guard):
  - `GET /admin/blog` → ListPostsQuery (paginated, all statuses)
  - `GET /admin/blog/:id` → GetPostByIdQuery
  - `POST /admin/blog` → CreatePostCommand
  - `PUT /admin/blog/:id` → UpdatePostCommand
  - `DELETE /admin/blog/:id` → DeletePostCommand
  - `POST /admin/blog/:id/restore` → RestorePostCommand
  - `POST /admin/blog/import-markdown` → ImportMarkdownCommand
- [ ] Controller passes raw `@Body() body: unknown` to commands (no validation in controller)
- [ ] Controller passes `@Query()` params to queries
- [ ] Admin routes inject `userId` from JWT token into commands

**Module:**
- [ ] `BlogPostModule` with providers: repository (token → implementation), all command handlers, all query handlers
- [ ] Imports: `PrismaModule`, `AuthModule` (for guards)
- [ ] Exports: nothing (no other module depends on BlogPost)
- [ ] Module registered in `AppModule`

**Verification:**
- [ ] `npx tsc --noEmit` passes
- [ ] API starts without errors
- [ ] Smoke test: `GET /blog` returns empty array

## Technical Notes
- Follow `apps/api/src/modules/category/presentation/category.controller.ts` pattern
- Follow `apps/api/src/modules/category/category.module.ts` pattern
- Import-markdown route: `POST /admin/blog/import-markdown` — accepts `{ title?: string, content: string, language: Language }`
- Route prefix: `/blog` for public, `/admin/blog` for admin (consistent with existing `/admin/categories`, `/admin/tags`)

## Files to Touch
- `apps/api/src/modules/blog-post/presentation/blog-post.controller.ts` (new)
- `apps/api/src/modules/blog-post/blog-post.module.ts` (new)
- `apps/api/src/modules/blog-post/index.ts` (new)
- `apps/api/src/app.module.ts` (add BlogPostModule import)

## Dependencies
- 240-blog-post-commands
- 241-blog-post-queries

## Complexity: S
Thin controller + standard module wiring. No business logic — just routing.

## Progress Log
