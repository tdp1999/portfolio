# Task: Seed placeholder blog posts for DDL fidelity

## Status: done

> 2026-05-24 (pivot): direction changed — every blog post now requires a cover image (domain rule **PST-011**). Patch folded into task 357 (cover-required end-to-end), shipped 2026-05-24. All 6 seed posts now have per-post covers; the 4 originally-coverless ones were assigned `essay-vi-cover` / `note-en-cover` / `note-vi-cover` / `featured-essay-cover`. CMS post `phuong-s-first-post` was backfilled by the migration with `seed-blog/default-cover`.

## Goal
Add 5-6 idempotent seed blog posts covering all four voice types and both languages so DDL variants can be compared against realistic, varied content.

## Context
Per `epic-portfolio-blog.md` — current database has 1 real post. DDL variant comparison (Maggie matrix density adapts, Two-track editorial sectioning, etc.) only works if there is mixed-length, mixed-type, mixed-language content. Seed posts must coexist safely with CMS-authored content (idempotent `upsert` by `slug`, never touch posts whose slug does not start with `seed-`).

## Acceptance Criteria
- [x] Seed script extended in `apps/api/prisma/seed.ts` (or sibling file invoked from it).
- [x] 5-6 posts created via `upsert` keyed on `slug`. All slugs prefixed `seed-`.
- [x] Coverage:
  - [x] 1 Deep-dive — EN, >1500 words, multiple H2 + H3 headings (triggers TOC in detail variants 1 & 3), embedded code blocks (ts, bash), embedded image reference
  - [x] 1 Retro — EN, ~600 words, includes 1-2 code blocks, links to an existing `/projects/<slug>` (any seeded project slug)
  - [x] 1 Essay — VI, ~400 words, no code, prose-only
  - [x] 2 Notes — 1 EN + 1 VI, each <200 words, no excerpt or short excerpt
  - [x] 1 Essay marked `featured: true` (any language, used to test featured filter/tab treatments)
- [x] All 4 categories present: `Engineering`, `Process`, `Industry`, `Notes` (upsert by slug in `Category` table; create with localized names if `Category` is translatable, otherwise plain).
- [x] Each post tagged with at least 1-2 tags (tags upserted by slug in `Tag` table).
- [x] All posts have `status: PUBLISHED`, valid `publishedAt` (spread across the last 12 months so year-anchored bibliography variant has multiple year groupings — include at least one post in a prior year).
- [x] `featuredImageId` populated on Deep-dive + Retro (use an existing seeded media item or insert a placeholder Media row).
- [x] `metaTitle` + `metaDescription` populated on Deep-dive (so SEO testing has content); optional on others.
- [x] `authorId` set to existing seed user (Phuong).
- [x] `readTimeMinutes` left null so auto-calc kicks in (or set explicitly if seed flow runs before the calc hook).
- [x] Idempotency: running `pnpm prisma db seed` twice produces zero duplicates and does not modify CMS-authored posts (verified manually by checking row counts before/after).
- [x] Safety check: seed script asserts/skips when encountering posts whose slug does not start with `seed-`. CMS posts untouched.

## Technical Notes
- Place new posts in a dedicated section/function (`seedBlogPosts()`) for clarity.
- Use Prisma `upsert` with `where: { slug }`. Compose `connectOrCreate` for categories/tags.
- Content body is markdown (current render pipeline is `MarkdownService` + Shiki). Use realistic markdown — H2/H3 hierarchy for deep-dive to exercise TOC, fenced code blocks with language tags, image syntax `![](url)`, internal link to `/projects/...`.
- Avoid lorem-ipsum. Write content that sounds like Phuong's voice (engineering-focused, opinionated, terse where warranted). It will be visible during DDL review.
- VI posts: write actual Vietnamese — do not Google Translate; quality matters for visual rhythm assessment.
- If a featured Media placeholder is needed, use a known stable Cloudinary URL or insert a Media row marked `seed-` for cleanup parity.

## Files to Touch
- `apps/api/prisma/seed.ts` (extend with `seedBlogPosts()` invocation)
- New file (optional): `apps/api/prisma/seeds/blog-posts.seed.ts` if seed.ts is already large
- `apps/api/prisma/schema.prisma` (READ ONLY — verify BlogPost / Category / Tag shape)

## Dependencies
None (BE schema + tables already exist).

## Complexity: M

## Progress Log
- 2026-05-24 Started — verified schema (BlogPost/Category/Tag/Media), confirmed slug uses partial unique index (deletedAt IS NULL), so Prisma `upsert` by slug is unavailable. Will use `findFirst { slug, deletedAt: null } → create/skip` pattern (same as `seedSkillUmbrellas`).
- 2026-05-24 Created `apps/api/prisma/seeds/blog-posts.seed.ts` with `seedBlogPosts()` exporting: 4 categories (Engineering, Process, Industry, Notes), 10 tags, 2 Cloudinary placeholder Media rows (publicId `seed-blog/*`, true UNIQUE so `upsert` is safe), and 6 posts. Wired into `apps/api/prisma/seed.ts` after `seedSkillUmbrellas`.
- 2026-05-24 Post coverage: deep-dive (EN, 1562 prose words, multi-H2+H3, ts+bash code blocks, image), retro (EN, 558w, link to `/projects/document-engine`), VI essay (392w, prose-only), EN note (93w, SQL block), VI note (76w), featured EN essay (491w, `featured: true`). publishedAt spread 2025-11 → 2026-05 (year-bridging for bibliography variant).
- 2026-05-24 Idempotency: each entity uses `findFirst { ..., deletedAt: null }` → skip-or-create. Re-running seed produces "already exists — skipping" lines, no duplicates. Posts whose slug does not start with `seed-` are explicitly skipped (safety guard inside the post loop).
- 2026-05-24 `npx tsc --noEmit -p apps/api/prisma/tsconfig.json` clean.
- 2026-05-24 Done — all ACs satisfied.
