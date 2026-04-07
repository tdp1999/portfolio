# Task: BlogPost Controller + NestJS Module Wiring

## Status: done

## Goal
Create thin REST controller with public and admin routes, and wire up the BlogPost NestJS module with all dependencies.

## Context
Controller is a thin transport adapter — extracts input, dispatches to command/query bus, returns result. No validation, no error throwing, no business logic in controller. Module wires repository, command handlers, query handlers, and imports CategoryModule, TagModule, MediaModule.

## Acceptance Criteria

**Controller:**
- [x] Public routes (no auth):
  - `GET /blog` → ListPublicPostsQuery (paginated, filterable)
  - `GET /blog/featured` → ListFeaturedPostsQuery
  - `GET /blog/:slug` → GetPublicPostBySlugQuery
- [x] Admin routes (JWT + ADMIN guard):
  - `GET /admin/blog` → ListPostsQuery (paginated, all statuses)
  - `GET /admin/blog/:id` → GetPostByIdQuery
  - `POST /admin/blog` → CreatePostCommand
  - `PUT /admin/blog/:id` → UpdatePostCommand
  - `DELETE /admin/blog/:id` → DeletePostCommand
  - `POST /admin/blog/:id/restore` → RestorePostCommand
  - `POST /admin/blog/import-markdown` → ImportMarkdownCommand
- [x] Controller passes raw `@Body() body: unknown` to commands (no validation in controller)
- [x] Controller passes `@Query()` params to queries
- [x] Admin routes inject `userId` from JWT token into commands

**Module:**
- [x] `BlogPostModule` with providers: repository (token → implementation), all command handlers, all query handlers
- [x] Imports: `PrismaModule`, `AuthModule` (for guards)
- [x] Exports: nothing (no other module depends on BlogPost)
- [x] Module registered in `AppModule`

**Verification:**
- [x] `npx tsc --noEmit` passes
- [x] API starts without errors (routes registered, Nest bootstrap OK)
- [x] Smoke test: `GET /api/blog` → `{data:[],total:0,page:1,limit:20}`; `GET /api/blog/featured` → `[]`; `GET /api/blog/missing-slug` → 404

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
- 2026-04-06 Done — 2 controllers (public/admin split) + module wired + registered in app.module; tsc clean; 89/89 blog-post specs green
