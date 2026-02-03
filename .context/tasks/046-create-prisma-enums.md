# Task: Define All Prisma Enums

## Status: pending

## Goal
Add all 9 enums to Prisma schema.

## Context
Enums must exist before entities can reference them.

## Acceptance Criteria
- [ ] All 9 enums in schema.prisma:
  - Language (EN, VI)
  - ContentStatus (DRAFT, PUBLISHED)
  - SocialPlatform (GITHUB, LINKEDIN, ...)
  - Availability (OPEN_TO_WORK, EMPLOYED, FREELANCING)
  - SkillCategory (FRONTEND, BACKEND, ...)
  - ProjectCategory (LANDING_PAGE, CMS, ...)
  - ProjectType (PERSONAL, TEAM, ...)
  - ProjectSize (SMALL, MEDIUM, LARGE, ENTERPRISE)
  - SyncStatus (SYNCED, PENDING, FAILED)
- [ ] `prisma generate` succeeds
- [ ] TypeScript types generated

## Technical Notes
Reference: `.context/database-schema-design.md`

## Files to Touch
- apps/api/prisma/schema.prisma

## Dependencies
- 043-setup-prisma-supabase

## Complexity: S

## Progress Log
