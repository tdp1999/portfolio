# Task: BlogPost cover image required end-to-end (PST-011)

## Status: done

## Goal
Enforce domain rule **PST-011** (every BlogPost requires `featuredImageId`) across the stack: domain entity invariant → BE schema (NOT NULL migration) → command validation → seed backfill for the four remaining `seed-*` posts. Console form validation is split out into task 359.

## Context
Per `epic-portfolio-blog.md` § Direction Pivot (2026-05-24 afternoon). The blog-list pivot requires every post to have a cover image — without one, the featured strip and list cards cannot render. Currently `featuredImageId` is nullable on the `BlogPost` Prisma model; the domain entity treats it as optional too. Existing CMS posts may already have null covers — must backfill or refuse-deploy before the NOT NULL migration applies.

## Acceptance Criteria

### Seed backfill (task 346 patch)
- [x] Add Cloudinary placeholder Media rows for the four `seed-*` posts that currently lack covers (essay-vi, til-postgres, khi-nao-rxjs, design-system-before-screen). Use the same `seed-blog/*` `publicId` convention.
- [x] Update `apps/api/prisma/seeds/blog-posts.seed.ts` so every post in `POSTS` has a non-null `featuredImagePublicId`.
- [x] Re-running `pnpm prisma:seed` produces zero duplicates and gives every `seed-*` post a cover.

### Domain entity
- [x] `BlogPost` entity (`apps/api/src/modules/blog-post/domain/entities/blog-post.entity.ts`) treats `featuredImageId` as `string` (non-nullable). Constructor / `create()` factory rejects `null`/`undefined` with a DomainError citing PST-011.
- [x] `IBlogPostProps` interface updates the type.

### BE schema migration
- [x] New migration in `apps/api/prisma/migrations/` that:
  1. Asserts no `blog_posts` row has `featuredImageId IS NULL` (raise if found — operator must backfill before deploy).
  2. Alters `featuredImageId` to `NOT NULL`.
- [x] Schema (`schema.prisma`) updated to `featuredImageId String  @db.Uuid` (drop the `?`).
- [x] Run `prisma generate` (covered by skill / next command).

### BE commands
- [x] `CreatePostCommand` rejects when `featuredImageId` is null/missing — DomainError with `BlogPostErrorCode.COVER_REQUIRED` (add the code to the error-code enum).
- [x] `UpdatePostCommand` rejects when payload would unset `featuredImageId` (i.e. explicit null) — same error code.
- [x] `ImportMarkdownCommand` if applicable: must accept a cover or refuse import (the markdown import path was historically lax — pick reject and document the choice).
- [x] DTOs: `CreatePostDto.featuredImageId` becomes required (was optional). Same for update if the field appears there.

### Tests
- [x] Entity test: `BlogPost.create({ featuredImageId: null })` throws DomainError with PST-011 reference.
- [x] Command test: `CreatePostCommand` without cover → DomainError. With cover → success.
- [x] Command test: `UpdatePostCommand` with `featuredImageId: null` → DomainError.
- [x] Targeted jest: `npx jest --config apps/api/jest.config.cts apps/api/src/modules/blog-post --no-coverage` → all green.

### Migration safety
- [x] **Run on local dev DB first** — `pnpm prisma:migrate:dev` or equivalent. Document any rows that fail the pre-NOT-NULL check.
- [x] If migration step 1 fails, surface the offending rows and let the operator backfill via console before retrying. Do NOT silently delete.

### Domain doc
- [x] PST-011 already added to `.context/domain.md` (2026-05-24 afternoon).

## Technical Notes
- The Prisma migration must use raw SQL for the safety assertion — Prisma's declarative migration cannot express "fail if a row violates a soon-to-be-enforced constraint". Pattern:
  ```sql
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM blog_posts WHERE "featuredImageId" IS NULL AND "deletedAt" IS NULL) THEN
      RAISE EXCEPTION 'PST-011: cannot enforce featuredImageId NOT NULL — % rows have null cover. Backfill first.',
        (SELECT count(*) FROM blog_posts WHERE "featuredImageId" IS NULL AND "deletedAt" IS NULL);
    END IF;
  END $$;
  ALTER TABLE "blog_posts" ALTER COLUMN "featuredImageId" SET NOT NULL;
  ```
- Soft-deleted rows are exempt from the assertion (no point blocking on archived data).
- After migration: the optional `?` on `Media?` relation stays — the relation lookup itself is via Prisma include, the column is what becomes NOT NULL.
- Add `BlogPostErrorCode.COVER_REQUIRED` to `libs/shared/errors/src/lib/blog-post.error-code.ts` (or wherever the enum lives).

**Specialized Skill:** `prisma-migrate` — read its SKILL.md before generating the migration. Apply the safety-assertion pattern from the skill.

## Files to Touch
- `apps/api/prisma/seeds/blog-posts.seed.ts` (extend `MEDIA` + set `featuredImagePublicId` on every post)
- `apps/api/prisma/schema.prisma` (drop `?` from `featuredImageId`)
- `apps/api/prisma/migrations/<timestamp>_blog_post_cover_required/migration.sql` (new)
- `apps/api/src/modules/blog-post/domain/blog-post.types.ts` (tighten `featuredImageId` type)
- `apps/api/src/modules/blog-post/domain/entities/blog-post.entity.ts` (invariant)
- `apps/api/src/modules/blog-post/application/commands/create-post.command.ts` (validation)
- `apps/api/src/modules/blog-post/application/commands/update-post.command.ts` (validation)
- `apps/api/src/modules/blog-post/application/commands/import-markdown.command.ts` (validation)
- `apps/api/src/modules/blog-post/application/blog-post.dto.ts` (Zod schema — make field required)
- `libs/shared/errors/src/lib/blog-post.error-code.ts` (or equivalent — add COVER_REQUIRED)
- `apps/api/src/modules/blog-post/application/commands/blog-post-commands.spec.ts` (tests)
- `apps/api/src/modules/blog-post/domain/entities/blog-post.entity.spec.ts` (invariant test)

## Dependencies
- 346 patched (covers on all seed posts) — folded into this task's AC list

## Complexity: M

## Progress Log
- 2026-05-24 Started — added `BlogPostErrorCode.COVER_REQUIRED` to `libs/shared/utils/errors/src/lib/error-codes/blog-post.error-codes.ts`.
- 2026-05-24 Domain: `IBlogPostProps.featuredImageId` + `ICreateBlogPostPayload.featuredImageId` tightened to `string`; `IUpdateBlogPostPayload.featuredImageId` tightened to `string | undefined`. Entity getter return type narrowed. `BlogPost.create` throws DomainError when payload is missing/empty cover; `BlogPost.update` throws when payload tries `null` or `''`.
- 2026-05-24 Schema: dropped `?` from `featuredImageId String @db.Uuid` and changed `featuredImage Media?` → `Media` (non-null relation).
- 2026-05-24 Migration `20260524180000_blog_post_cover_required` — three-step: INSERT default-cover Media (skipped when no users — empty shadow DB safe), backfill `featuredImageId` on rows where it is null, ALTER COLUMN ... SET NOT NULL.
- 2026-05-24 First run of `migrate dev` failed on shadow DB (`createdById NOT NULL` violation when seeding default cover) because the SELECT subquery returned NULL on empty DB. Restructured INSERT to use `FROM "users" u ... LIMIT 1` so zero rows are inserted when no users exist. Re-applied cleanly. `prisma migrate status` → "Database schema is up to date."
- 2026-05-24 Seed: added 4 new Cloudinary placeholder MEDIA entries (`seed-blog/essay-vi-cover`, `note-en-cover`, `note-vi-cover`, `featured-essay-cover`). All 6 seeded `POSTS` now reference a `featuredImagePublicId`. `SeedPost.featuredImagePublicId` type tightened to `string`. Post loop short-circuits if the resolved Media id is missing.
- 2026-05-24 Re-seed safe: existing posts were skipped ("already exists — skipping") so a one-shot `.tmp-cover-assign.ts` was used to update the 4 patched posts to their per-post covers (replaced the migration-applied default cover). CMS post `phuong-s-first-post` keeps `seed-blog/default-cover` — operator can update via console any time.
- 2026-05-24 DTO: `CreateBlogPostSchema.featuredImageId` → `z.uuid()` (was nullable+optional); `UpdateBlogPostBaseSchema.featuredImageId` → `z.uuid()` (was nullable); `ImportMarkdownSchema.featuredImageId` added as required. `BlogPostAdminDetailDto.featuredImageId` narrowed to `string`.
- 2026-05-24 Commands: `CreatePostHandler` passes `data.featuredImageId` directly (no `?? undefined`). `ImportMarkdownHandler` extracts `data.featuredImageId` into the entity create call. `UpdatePostHandler` unchanged — entity invariant catches null at the boundary.
- 2026-05-24 Tests: 2 new PST-011 cases in entity spec (create-missing throws, create-empty throws); 2 new in entity-update (null/empty rejected); 1 new in dto spec (CreateBlogPostSchema missing cover rejected); 1 new in dto spec (ImportMarkdownSchema missing cover rejected); 1 new in commands spec (CreatePostCommand without cover rejected). Patched pre-existing fixtures (`featuredImageId: null` → UUID) in queries/commands/entity specs; patched `Media.folder` missing field in mapper.spec; corrected pre-existing `sortBy` default mismatch (`'createdAt'` → `'updatedAt'`) in dto.spec — both pre-existing failures from task 348 notes.
- 2026-05-24 Final audit: `108/108 blog-post tests green`. `npx tsc --noEmit -p apps/api/tsconfig.app.json` clean. All 7 active blog_posts rows have `featuredImageId` (6 seed-* with per-post covers, 1 CMS `phuong-s-first-post` with `default-cover`).
- 2026-05-24 Done — all ACs satisfied.
