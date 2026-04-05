# Task: BlogPost Prisma Schema + Migration

## Status: done

## Goal
Add BlogPost, PostCategory, and PostTag models to Prisma schema with PostStatus enum, and run migration.

## Context
BlogPost is the blog module's core entity. It uses language-per-record (not TranslatableJSON like Project), a new PostStatus enum with 4 states (DRAFT, PUBLISHED, PRIVATE, UNLISTED), and two junction tables for M2M with Category and Tag. Featured image is a FK to Media.

## Acceptance Criteria
- [x] New `PostStatus` enum: DRAFT, PUBLISHED, PRIVATE, UNLISTED
- [x] `BlogPost` model with all fields per epic (slug, language, title, excerpt, content as Text, readTimeMinutes, status, featured, publishedAt, metaTitle, metaDescription, authorId, featuredImageId, audit fields)
- [x] `PostCategory` junction: composite PK (postId, categoryId), cascade delete on post
- [x] `PostTag` junction: composite PK (postId, tagId), cascade delete on post
- [x] Indexes: (status, deletedAt), (featured, status, deletedAt), (language, status, deletedAt), (publishedAt)
- [x] Relations to User (author, createdBy, updatedBy, deletedBy), Media (featuredImage), Category (via junction), Tag (via junction)
- [x] Inverse relations added to existing Category and Tag models
- [x] Migration runs successfully on local Docker PostgreSQL
- [x] `npx prisma generate` produces updated client types

## Technical Notes
- `content` field: `String @db.Text` — stores markdown
- `authorId` is semantically the displayed author (distinct from createdById audit field). For single-admin site, both will be the same user, but keep separate for correctness.
- PostStatus is a NEW enum, not expanding ContentStatus (Project uses ContentStatus with only 2 states)
- Follow existing schema patterns (see User, Media, Skill models in `schema.prisma`)

**Specialized Skill:** `prisma-migrate` — use for schema change and migration workflow.

## Files to Touch
- `apps/api/prisma/schema.prisma`

## Dependencies
- None (Category, Tag, Media, User models already exist)

## Complexity: M
3 new models + 1 enum, but straightforward relational schema. Junction tables are simple composite PKs.

## Progress Log
- [2026-04-05] Done — all ACs satisfied. Migration: 20260405142928_add_blog_post_models
