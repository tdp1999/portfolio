# Task: Profile commands + queries + handlers + tests

## Status: done

## Goal
Implement all CQRS command and query handlers for Profile: upsert, avatar/ogImage update, public get, admin get, and JSON-LD generation.

## Context
Profile has fewer handlers than typical modules (no list, no delete, no create/update split). The upsert command is the most complex — validates ~28 fields with 6 JSON sub-schemas. Queries include public (filtered) and admin (full) variants plus JSON-LD output.

## Acceptance Criteria

### Commands

#### UpsertProfile
- [x] Validates full payload via `UpsertProfileSchema.safeParse()`
- [x] Checks if Profile exists for current user (`repo.findByUserId`)
- [x] If exists: loads entity, calls `entity.update(data, userId)`, upserts via repo
- [x] If new: creates entity via `Profile.create(data, userId)`, upserts via repo
- [x] Validates avatarId references existing Media (if provided) — throw MEDIA_NOT_FOUND if not
- [x] Validates ogImageId references existing Media (if provided)
- [x] Returns `{ id: string }`

#### UpdateProfileAvatar
- [x] Validates `UpdateAvatarSchema`
- [x] If avatarId provided: validates Media exists
- [x] Calls `repo.updateAvatar(userId, avatarId)`

#### UpdateProfileOgImage
- [x] Same pattern as avatar

### Queries

#### GetProfile (Admin)
- [x] Fetches via `repo.findWithMedia(userId)`
- [x] Returns full response via `ProfilePresenter.toAdminResponse()`
- [x] Returns null/404 if Profile not yet created

#### GetPublicProfile
- [x] Fetches via `repo.findWithMedia(userId)` — uses first user or a config for which user's profile to show
- [x] Returns filtered response via `ProfilePresenter.toPublicResponse()` (PRF-003)
- [x] Returns null/404 if Profile not yet created

#### GetJsonLd
- [x] Accepts `locale` param (default: 'en')
- [x] Fetches Profile, generates JSON-LD via `ProfilePresenter.toJsonLd(entity, locale)`
- [x] Returns JSON-LD object

### Unit Tests
- [x] UpsertProfile: create new (first time), update existing, invalid input, missing required translatable fields, invalid socialLinks, invalid certifications, media not found
- [x] UpdateAvatar: valid media, null (remove), media not found
- [x] GetProfile (admin): found, not found
- [x] GetPublicProfile: found with correct field filtering, not found
- [x] GetJsonLd: valid Schema.org structure, locale switching (en vs vi)

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Command + Query sections)
- UpsertProfile injects: `PROFILE_REPOSITORY`, `MEDIA_REPOSITORY` (for avatar/ogImage validation)
- Public profile: since there's only one admin user, the query can find the first (and only) Profile. No userId needed in public endpoint.
- Media validation: `mediaRepo.findById(avatarId)` — if null, throw. This prevents dangling references.
- JSON-LD locale: the landing page passes current locale, JSON-LD fields are resolved to that locale

## Files to Touch
- New: `apps/api/src/modules/profile/application/commands/upsert-profile.command.ts`
- New: `apps/api/src/modules/profile/application/commands/upsert-profile.handler.ts`
- New: `apps/api/src/modules/profile/application/commands/upsert-profile.handler.spec.ts`
- New: (same pattern for update-avatar, update-og-image)
- New: `apps/api/src/modules/profile/application/commands/index.ts`
- New: `apps/api/src/modules/profile/application/queries/get-profile.query.ts`
- New: `apps/api/src/modules/profile/application/queries/get-profile.handler.ts`
- New: `apps/api/src/modules/profile/application/queries/get-profile.handler.spec.ts`
- New: (same pattern for get-public-profile, get-json-ld)
- New: `apps/api/src/modules/profile/application/queries/index.ts`

## Dependencies
- 208 (DTOs + presenter)
- 209 (Repository)

## Complexity: L

## Progress Log
- [2026-04-02] Started
- [2026-04-03] Done — all ACs satisfied
