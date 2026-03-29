# Task: Profile Prisma schema + enum updates + migration

## Status: pending

## Goal
Define the Profile model in Prisma with ~28 fields, update SocialPlatform and Availability enums, and apply migration.

## Context
Profile is a single-record entity (1:1 with User) containing all site owner personal info. It uses JSON fields for translatable content, social links, certifications, resume URLs, and openTo preferences. This is the first module with extensive JSON/JsonB usage. Enum changes are partly destructive (removing FACEBOOK, INSTAGRAM, YOUTUBE from SocialPlatform).

## Acceptance Criteria

### Enum Updates
- [ ] `SocialPlatform` updated: remove FACEBOOK, INSTAGRAM, YOUTUBE; add BLUESKY, STACKOVERFLOW, DEV_TO, HASHNODE
- [ ] `Availability` updated: add NOT_AVAILABLE
- [ ] Verify no existing data uses removed enum values (socialLinks is JSON, not enum column — safe)

### Profile Model
- [ ] All ~28 fields per epic spec:
  - Identity: `id` (UUID v7), `userId` (unique FK→User)
  - Translatable: `fullName`, `title`, `bioShort` (JsonB, not null), `bioLong` (JsonB, nullable)
  - Work: `yearsOfExperience` (Int), `availability` (Availability enum, default EMPLOYED), `openTo` (JsonB, default [])
  - Contact: `email` (VarChar 320), `phone` (VarChar 20, nullable), `preferredContactPlatform` (SocialPlatform, default LINKEDIN), `preferredContactValue` (VarChar 500)
  - Location: `locationCountry`, `locationCity` (VarChar 100), `locationPostalCode`, `locationAddress1`, `locationAddress2` (nullable VarChar)
  - Social/Resume: `socialLinks` (JsonB, default []), `resumeUrls` (JsonB, default {})
  - Certifications: `certifications` (JsonB, default [])
  - SEO: `metaTitle` (VarChar 70, nullable), `metaDescription` (VarChar 160, nullable), `ogImageId` (FK→Media, nullable)
  - Misc: `timezone` (VarChar 50, nullable), `canonicalUrl` (VarChar 500, nullable)
  - Media: `avatarId` (FK→Media, nullable)
  - Audit: `createdAt`, `updatedAt`, `createdById` (FK→User), `updatedById` (FK→User)

### Relations
- [ ] `user` (1:1 via userId unique)
- [ ] `avatar` (Media, "ProfileAvatar" relation)
- [ ] `ogImage` (Media, "ProfileOgImage" relation)
- [ ] `createdBy` / `updatedBy` (User, named relations)
- [ ] Corresponding relation fields added to User and Media models

### Indexes
- [ ] `@@index([userId])` (lookup by user)

### Migration
- [ ] Migration applies cleanly to local Docker PostgreSQL
- [ ] `npx prisma generate` succeeds
- [ ] Enum changes handled safely (add new values first, remove old values — may need 2-step migration)

**Specialized Skill:** prisma-migrate — use `/prisma-migrate` for migration workflow (especially for destructive enum changes).

## Technical Notes
- Enum removal is destructive. Since no existing data uses FACEBOOK/INSTAGRAM/YOUTUBE as column values (socialLinks is JSON), Prisma should handle it. But use prisma-migrate skill to verify safety.
- JsonB (not Json) for better PostgreSQL query performance on JSON fields
- `userId` is `@unique` — enforces single-record invariant (PRF-001)
- Default values: `openTo = "[]"`, `socialLinks = "[]"`, `resumeUrls = "{}"`, `certifications = "[]"`

## Files to Touch
- Update: `apps/api/prisma/schema.prisma` (add Profile model, update enums, add relations to User and Media)
- New: migration file (auto-generated)

## Dependencies
- None (Media and User models already exist)

## Complexity: M

## Progress Log
