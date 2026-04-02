# Task: Profile domain entity + types + errors

## Status: done

## Goal
Create the Profile domain entity with upsert-oriented factory methods, JSON field handling, and single-record invariant enforcement.

## Context
Profile differs from other entities: single record (PRF-001), upsert pattern (PRF-002), no soft delete, no slug, ~28 fields with 6 JSON fields. The entity validates translatable JSON structure and enforces business rules.

## Acceptance Criteria

### Domain Entity
- [x] `Profile` class with private constructor
- [x] `Profile.create(data, userId)` factory — generates UUID v7, sets audit fields, validates JSON fields are well-formed
- [x] `Profile.load(props)` factory — reconstitutes from DB without validation
- [x] `update(data, userId)` method — partial update, preserves unchanged fields, updates `updatedById` + `updatedAt`
- [x] `updateAvatar(avatarId, userId)` — updates avatar media reference
- [x] `updateOgImage(ogImageId, userId)` — updates OG image media reference
- [x] All mutation methods return new instance (immutable pattern)
- [x] Getters for all public properties
- [x] Computed getter: `isOpenToWork` — true if availability is OPEN_TO_WORK or (EMPLOYED with non-empty openTo)

### Types
- [x] `IProfileProps` interface with all ~28 fields (using shared types: TranslatableJson, SocialLink[], Certification[], etc.)
- [x] `ICreateProfilePayload` — input for create(): all required fields + optional fields
- [x] `IUpdateProfilePayload` — partial input for update(): all fields optional
- [x] Types in separate file (`profile.types.ts`)

### Error Codes
- [x] `ProfileErrorCode` enum: `NOT_FOUND`, `INVALID_INPUT`, `ALREADY_EXISTS`, `MEDIA_NOT_FOUND`
- [x] In separate file (`profile.error.ts`)

### Unit Tests
- [x] `create()` generates valid UUID v7, sets audit fields, stores JSON fields correctly
- [x] `load()` reconstitutes entity from raw props without modification
- [x] `update()` partial update preserves unchanged fields
- [x] `update()` updates only provided fields + audit timestamp
- [x] `updateAvatar()` / `updateOgImage()` only changes the media reference
- [x] `isOpenToWork` computed correctly for various availability + openTo combinations
- [x] Immutability: mutation methods return new instance, original unchanged

## Technical Notes
- Profile extends `BaseCrudEntity` (has audit FKs) — check if BaseCrudEntity supports the upsert pattern or needs adaptation
- No `softDelete()` method — Profile is never deleted
- JSON fields stored as-is in entity props — validation is in command handler via Zod schemas (task 208)
- `isOpenToWork` is a domain concept: "Employed but open to side projects" counts as open

## Files to Touch
- New: `apps/api/src/modules/profile/domain/entities/profile.entity.ts`
- New: `apps/api/src/modules/profile/domain/entities/profile.entity.spec.ts`
- New: `apps/api/src/modules/profile/domain/profile.types.ts`
- New: `apps/api/src/modules/profile/domain/profile.error.ts`

## Dependencies
- 205 (Prisma schema for type reference)
- 206 (Shared translatable types: TranslatableJson, SocialLink, Certification, etc.)

## Complexity: M

## Progress Log
- [2026-04-02] Started
- [2026-04-02] Done — all ACs satisfied. 18/18 tests passing. Error codes in shared/errors + re-exported from domain.
