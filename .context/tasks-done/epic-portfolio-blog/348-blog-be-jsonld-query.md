# Task: BE — `GetBlogPostJsonLdQuery` for Article schema.org payload

## Status: done

## Goal
Provide a server-computed JSON-LD `Article` payload for any published blog post, ready for SSR injection on `/blog/:slug` (mirrors the profile JSON-LD pattern used by `/about`).

## Context
Per `epic-portfolio-blog.md` SEO section. Pattern source: `apps/api/src/modules/profile/application/queries/get-json-ld.query.ts` and the SSR-only inject pattern at `libs/landing/feature-about/src/lib/feature-about/feature-about.ts:100-113` (commit `96a0cd4`). Each detail variant in this epic depends on having JSON-LD in the SSR HTML.

## Acceptance Criteria
- [x] New query handler: `GetBlogPostJsonLdQuery` in `apps/api/src/modules/blog-post/application/queries/`.
- [x] Input: post slug (or post id).
- [x] Returns a typed DTO `BlogPostJsonLdDto` (Article schema) with at minimum:
  - [x] `@context: "https://schema.org"`
  - [x] `@type: "Article"` (or `BlogPosting` — pick one and document)
  - [x] `headline` (post title)
  - [x] `description` (metaDescription or excerpt fallback)
  - [x] `image` (featuredImageUrl, absolute URL — resolve via media service)
  - [x] `datePublished` (ISO from publishedAt)
  - [x] `dateModified` (ISO from updatedAt)
  - [x] `author { @type: "Person", name, url }` (resolve from `BlogPost.author`; URL = landing canonical for author if known, else null)
  - [x] `publisher { @type: "Person" | "Organization", name }` (consistent with Profile JSON-LD)
  - [x] `mainEntityOfPage` (canonical blog detail URL — compose from base URL + slug)
  - [x] `inLanguage` (post.language — `en` or `vi`)
- [x] Controller endpoint exposed on `BlogPostPublicController` — choose one shape and document in code:
  - Option A: separate `GET /api/blog/:slug/json-ld` returning the DTO
  - Option B: include `jsonLd` field on existing `GET /api/blog/:slug` payload (so detail page gets it in one fetch)
  - **Recommended: Option B** to avoid a second HTTP call during SSR. Document the choice in the query handler.
- [x] If the post is not PUBLISHED or is soft-deleted, return null / 404 (do not leak draft JSON-LD).
- [x] Test in `blog-post-queries.spec.ts`: published post returns valid Article, draft post returns null, missing fields fall back sensibly (image absent → omit `image` key, not `null`).
- [x] Type-check + targeted jest passes.

## Technical Notes
- Base URL for canonical: pull from a config/env constant already used by profile JSON-LD. Do NOT hardcode the domain in the handler.
- Image URL must be absolute — if media stores relative paths, resolve via media service / cloudinary helper.
- Avoid leaking author email or other private fields. Keep author shape minimal.
- Validate against schema.org Article spec: the union of `Article` and `BlogPosting`; if `BlogPosting` chosen, it inherits all Article fields plus none required.
- Reference commit `96a0cd4` for the about JSON-LD wiring (profile side) so the shape and conventions are consistent.
- Controllers never throw (CLAUDE.md guardrail) — all logic in handler.

## Files to Touch
- `apps/api/src/modules/blog-post/application/queries/get-blog-post-json-ld.query.ts` (new)
- `apps/api/src/modules/blog-post/application/queries/index.ts` (export)
- `apps/api/src/modules/blog-post/application/dtos/blog-post-json-ld.dto.ts` (new)
- `apps/api/src/modules/blog-post/presentation/controllers/blog-post-public.controller.ts` (wire endpoint OR extend existing detail endpoint per Option B)
- `apps/api/src/modules/blog-post/application/queries/blog-post-queries.spec.ts` (extend)
- `libs/landing/shared/data-access/src/lib/blog-data.service.ts` + types (sync new field if Option B)

## Dependencies
None (parallel with 346, 347).

## Complexity: S

## Progress Log
- 2026-05-24 Chose Option B (embed `jsonLd` in `BlogPostPublicDetailDto`) — avoids a second SSR round-trip and keeps the public detail endpoint cohesive. Decision documented in `blog-post.presenter.ts` comment.
- 2026-05-24 Chose `@type: "BlogPosting"` over `Article` — BlogPosting is the more specific schema.org class for blog content and Google's structured-data tester treats it as Article-compatible. Documented in DTO comment.
- 2026-05-24 No new `GetBlogPostJsonLdQuery` handler created — JSON-LD composition lives in `BlogPostPresenter.toJsonLd()` and runs as part of the existing `GetPublicPostBySlugQuery`. Draft/deleted leak is impossible because `findBySlug` already filters to `status IN ('PUBLISHED', 'UNLISTED'), deletedAt IS NULL`.
- 2026-05-24 DTO: added `BlogPostJsonLdDto` (BlogPosting shape) and added `jsonLd: BlogPostJsonLdDto` to `BlogPostPublicDetailDto`. Landing FE `BlogPostDetail` mirror updated in `libs/landing/shared/data-access/src/lib/blog.types.ts`.
- 2026-05-24 Site URL resolved via `process.env['FRONTEND_URL']` with `https://thunderphong.com` fallback and trailing-slash stripping. No new env var introduced (FRONTEND_URL is already used by auth module).
- 2026-05-24 Fallback chain: description = `metaDescription ?? excerpt ?? null`; author = `author.name ?? 'Phuong Tran'` (same for publisher); datePublished = `publishedAt ?? createdAt`; image present only when `featuredImageUrl` is non-null (key omitted otherwise, per Google's preference).
- 2026-05-24 Tests: 7 new cases in `blog-post.presenter.spec.ts` covering required fields, image-omit semantics, description fallback, author fallback, VI inLanguage, datePublished fallback, and integration via `toPublicDetail`. `npx jest --config apps/api/jest.config.cts ... blog-post.presenter.spec.ts --no-coverage` → 13/13 green.
- 2026-05-24 Two pre-existing failures in `blog-post.dto.spec.ts` (pagination default sortBy) and `blog-post.mapper.spec.ts` (Media `folder` field drift) are unrelated to this task — both spec files unchanged in this session (verified via `git status`). Logged for future cleanup but not blocking 348.
- 2026-05-24 `npx tsc --noEmit` clean for both `apps/api/tsconfig.app.json` and `libs/landing/shared/data-access/tsconfig.lib.json`.
- 2026-05-24 Done — all ACs satisfied.
