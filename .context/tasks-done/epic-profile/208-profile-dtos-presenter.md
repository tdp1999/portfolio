# Task: Profile Zod DTOs + presenter (public + admin)

## Status: done

## Goal
Define Zod validation schemas for Profile upsert and two presenters: public (filtered, no private fields) and admin (full).

## Context
Profile has the most complex DTO in the project — ~28 fields with 6 validated JSON fields. The public presenter enforces PRF-003 (no phone, no address details). The admin presenter returns everything.

## Acceptance Criteria

### Upsert DTO
- [x] `UpsertProfileSchema` — validates all Profile fields:
  - `fullName`: TranslatableSchema (en + vi required)
  - `title`: TranslatableSchema
  - `bioShort`: TranslatableSchema
  - `bioLong`: OptionalTranslatableSchema (nullable)
  - `yearsOfExperience`: int, min 0, max 99
  - `availability`: nativeEnum(Availability)
  - `openTo`: OpenToSchema (string array)
  - `email`: z.email(), max 320
  - `phone`: string, max 20, optional
  - `preferredContactPlatform`: nativeEnum(SocialPlatform)
  - `preferredContactValue`: string, max 500
  - `locationCountry`: string, max 100
  - `locationCity`: string, max 100
  - `locationPostalCode`: string, max 20, optional
  - `locationAddress1`: string, max 300, optional
  - `locationAddress2`: string, max 300, optional
  - `socialLinks`: SocialLinksArraySchema
  - `resumeUrls`: ResumeUrlsSchema
  - `certifications`: CertificationsArraySchema
  - `metaTitle`: string, max 70, optional
  - `metaDescription`: string, max 160, optional
  - `timezone`: TimezoneSchema, optional
  - `canonicalUrl`: z.url(), optional
  - `avatarId`: UUID string, optional
  - `ogImageId`: UUID string, optional

### Update Avatar / OG Image DTOs
- [x] `UpdateAvatarSchema` — `{ avatarId: UUID string | null }` (null to remove)
- [x] `UpdateOgImageSchema` — `{ ogImageId: UUID string | null }`

### Public Presenter (PRF-003)
- [x] `ProfilePresenter.toPublicResponse(entity)` returns:
  - fullName, title, bioShort, bioLong, yearsOfExperience, availability, openTo
  - email, preferredContactPlatform, preferredContactValue
  - locationCountry, locationCity (city + country ONLY)
  - socialLinks, resumeUrls, certifications
  - avatarUrl (resolved from Media), ogImageUrl (resolved from Media)
  - metaTitle, metaDescription, timezone, canonicalUrl
- [x] Excludes: phone, locationPostalCode, locationAddress1, locationAddress2, audit fields

### Admin Presenter
- [x] `ProfilePresenter.toAdminResponse(entity)` returns ALL fields including private ones
- [x] Includes audit fields (createdAt, updatedAt, createdById, updatedById)

### JSON-LD Presenter
- [x] `ProfilePresenter.toJsonLd(entity, locale)` returns Schema.org Person object
- [x] Uses `getLocalized()` for translatable fields with requested locale
- [x] Includes: name, jobTitle, description, image, email, url, address (city+country), sameAs (social URLs), knowsLanguage

### Unit Tests
- [x] UpsertProfileSchema: valid full payload, missing required fields, invalid JSON fields, max lengths, email validation
- [x] TranslatableSchema integration: missing locale, empty strings
- [x] SocialLinks validation: invalid URL, invalid platform, max array size
- [x] Certifications validation: missing required fields, year bounds
- [x] Public presenter: excludes private fields
- [x] Admin presenter: includes all fields
- [x] JSON-LD: valid Schema.org structure, locale-aware field selection

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (DTO section)
- Import shared schemas from task 206 (TranslatableSchema, SocialLinkSchema, etc.)
- Presenter resolves `avatarId` → `avatarUrl` and `ogImageId` → `ogImageUrl`. This may need the Media URL to be loaded via join/include in the repository query, or resolved in the presenter via a lookup.
- JSON-LD generator can be a static method on ProfilePresenter or a separate service — keep it simple, static method is fine for now.

## Files to Touch
- New: `apps/api/src/modules/profile/application/profile.dto.ts`
- New: `apps/api/src/modules/profile/application/profile.dto.spec.ts`
- New: `apps/api/src/modules/profile/application/profile.presenter.ts`

## Dependencies
- 206 (Shared translatable schemas + types)
- 207 (Domain entity for presenter mapping)

## Complexity: L

## Progress Log
- [2026-04-02] Started
- [2026-04-02] Done — all ACs satisfied
