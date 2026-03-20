# Task: Media Prisma Schema + Migration

## Status: done

## Goal
Define the Media model in Prisma schema and generate the migration.

## Context
First task for the Media module. Establishes the database foundation that all other media tasks depend on.

## Acceptance Criteria
- [x] `Media` model added to `schema.prisma` with all fields from epic schema table
- [x] UUID v7 primary key, soft-delete fields (`deletedAt`, `deletedById`)
- [x] Foreign keys to `User` for `createdById`, `updatedById`, `deletedById`
- [x] Unique constraint on `publicId`
- [x] Indexes on: `mimeType`, `deletedAt`, `createdById`, `createdAt`
- [x] Migration generated and applied to local DB
- [x] Prisma client regenerated, types available

## Technical Notes
- Follow existing pattern from Skill/Category modules
- Fields: id, originalFilename, mimeType, publicId, url, format, bytes, width (nullable), height (nullable), altText (nullable), caption (nullable), createdAt, updatedAt, createdById, updatedById, deletedAt (nullable), deletedById (nullable)
- `width`/`height` are nullable (only for images)

**Specialized Skill:** prisma-migrate — use for schema change and migration workflow.

## Files to Touch
- apps/api/prisma/schema.prisma

## Dependencies
- None

## Complexity: S

## Progress Log
- [2026-03-20] Started. Using prisma-migrate skill.
- [2026-03-20] Done — all ACs satisfied. Migration: 20260320095151_add_media_model
