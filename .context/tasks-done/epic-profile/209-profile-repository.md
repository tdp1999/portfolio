# Task: Profile repository + mapper

## Status: done

## Goal
Implement the Profile repository (port + adapter) with upsert support and Prisma-to-domain mapper including Media relation resolution.

## Context
Profile repository is simpler than most — no list/pagination (single record), no soft delete. But it needs upsert semantics and must resolve Media relations (avatar, ogImage) to URLs for the presenter.

## Acceptance Criteria

### Repository Port
- [x] `IProfileRepository` interface:
  - `findByUserId(userId: string): Promise<Profile | null>`
  - `findWithMedia(userId: string): Promise<ProfileWithMedia | null>` — includes avatar + ogImage URLs
  - `upsert(entity: Profile): Promise<string>` — create or update, returns ID
  - `updateAvatar(userId: string, avatarId: string | null): Promise<void>`
  - `updateOgImage(userId: string, ogImageId: string | null): Promise<void>`
- [x] `PROFILE_REPOSITORY` DI token exported
- [x] `ProfileWithMedia` type: Profile entity + `avatarUrl: string | null` + `ogImageUrl: string | null`

### Mapper
- [x] `ProfileMapper.toDomain(prisma)` — converts Prisma model to domain entity via `Profile.load()`
- [x] `ProfileMapper.toPrisma(domain)` — converts domain entity to Prisma create/update data
- [x] `ProfileMapper.toDomainWithMedia(prisma)` — includes resolved avatar/ogImage URLs from Prisma includes
- [x] Handles all JSON fields (pass through — they're already objects from Prisma)
- [x] Handles nullable fields correctly

### Repository Implementation
- [x] `ProfileRepository` implements `IProfileRepository`
- [x] `findByUserId` uses `findUnique({ where: { userId } })`
- [x] `findWithMedia` uses `findUnique({ where: { userId }, include: { avatar: true, ogImage: true } })`
- [x] `upsert` uses Prisma `upsert({ where: { userId }, create: {...}, update: {...} })` — single atomic operation
- [x] `updateAvatar` / `updateOgImage` use targeted `update` on specific field only

## Technical Notes
- Prisma's `upsert` is atomic — perfect for single-record create-or-update
- Media URL resolution: `avatar.url` from the included Media relation. If avatar is null, return null
- JSON fields: Prisma automatically parses JsonB to JavaScript objects on read and accepts objects on write
- No pagination, no search, no filtering — simplest repository in the project

## Files to Touch
- New: `apps/api/src/modules/profile/application/ports/profile.repository.port.ts`
- New: `apps/api/src/modules/profile/application/profile.token.ts`
- New: `apps/api/src/modules/profile/infrastructure/mapper/profile.mapper.ts`
- New: `apps/api/src/modules/profile/infrastructure/repositories/profile.repository.ts`

## Dependencies
- 205 (Prisma schema for generated types)
- 207 (Domain entity for mapper)

## Complexity: M

## Progress Log
- [2026-04-02] Started
- [2026-04-02] Done — all ACs satisfied
