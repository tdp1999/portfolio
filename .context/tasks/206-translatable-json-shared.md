# Task: Translatable JSON shared utilities + Zod schemas

## Status: pending

## Goal
Create shared Zod schemas, types, and utility functions for translatable JSON fields — reusable across Profile, Experience, Project, BlogPost modules.

## Context
Profile is the first module using translatable JSON fields (`{ en: "...", vi: "..." }`). Rather than defining these inline, extract to shared libs so all future modules reuse the same validation and locale resolution logic. This establishes the pattern per PRF-004 and PRF-005.

## Acceptance Criteria

### Shared Zod Schemas
- [ ] `TranslatableSchema` — strict: both `en` and `vi` required, strings, min 1 char
- [ ] `OptionalTranslatableSchema` — nullable, at least one locale if provided
- [ ] `PartialTranslatableSchema` — at least one of en/vi required (refine)
- [ ] `SocialLinkSchema` — `{ platform: SocialPlatform, url: z.url(), handle?: string }`
- [ ] `SocialLinksArraySchema` — array of SocialLinkSchema, max 20 items
- [ ] `CertificationSchema` — `{ name: 1-200 chars, issuer: 1-200 chars, year: 1990-2100, url?: z.url() }`
- [ ] `CertificationsArraySchema` — array of CertificationSchema, max 50 items
- [ ] `ResumeUrlsSchema` — `{ en?: z.url(), vi?: z.url() }`
- [ ] `OpenToSchema` — array of enum values: FREELANCE, CONSULTING, SIDE_PROJECT, FULL_TIME, SPEAKING, OPEN_SOURCE

### Shared Types
- [ ] `TranslatableJson` type: `{ en: string; vi: string }` (and optional/partial variants)
- [ ] `SocialLink` type: `{ platform: SocialPlatform; url: string; handle?: string }`
- [ ] `Certification` type: `{ name: string; issuer: string; year: number; url?: string }`
- [ ] `ResumeUrls` type: `{ en?: string; vi?: string }`
- [ ] `OpenToValue` type: union of allowed string literals

### Utility Functions
- [ ] `getLocalized(field: TranslatableJson, locale: 'en' | 'vi'): string` — fallback chain: requested locale → en → first available → empty string (PRF-004)
- [ ] `isValidTimezone(tz: string): boolean` — validates IANA timezone string
- [ ] `TimezoneSchema` — Zod schema wrapping `isValidTimezone`

### Unit Tests
- [ ] TranslatableSchema: valid both locales, missing one, empty strings, HTML in content
- [ ] SocialLinkSchema: valid URLs, invalid URLs, valid/invalid platforms
- [ ] CertificationSchema: valid entry, missing required fields, year bounds
- [ ] getLocalized: returns correct locale, falls back to en, falls back to first available, returns empty for empty object
- [ ] TimezoneSchema: valid IANA zones, invalid strings

## Technical Notes
- Place in `libs/shared/types/` or `libs/shared/util/` depending on project convention — check existing exports
- Use Zod v4 syntax per project standard
- `SocialPlatform` enum needs to be importable — may need to re-export from Prisma generated types or define a mirrored enum
- Timezone validation: simplest approach is a Set of common IANA zones (~400 entries). No need for npm package
- These schemas will be imported by Profile DTOs and future modules (Experience, Project, BlogPost)

## Files to Touch
- New: shared lib file for translatable schemas + types + utils (location TBD based on existing lib structure)
- New: corresponding test file

## Dependencies
- 205 (Prisma schema for SocialPlatform enum reference)

## Complexity: M

## Progress Log
