# Task: Content — Profile + Skills seed

## Status: pending

## Goal
Populate the Profile record and the Skill set with accurate values reflecting the author today — including the new `Profile.timezone` and `Skill.displayGroup` fields.

## Context
The home page's hero status block, bio card grid live time, and any future skill grouping all read from this data. Get it right once.

## Acceptance Criteria
- [ ] Single Profile record exists per PRF-001
- [ ] `Profile.WorkAvailability.timezone` = `"Asia/Ho_Chi_Minh"`
- [ ] `Profile.WorkAvailability.openTo` reflects current intent (e.g. Full-time + Freelance)
- [ ] `Profile.Identity` displayName, fullName, title, bio (translatable: en in V1)
- [ ] `Profile.Location` city + country
- [ ] `Profile.Contact` email + (optional) phone — phone marked private, excluded from public DTO per PRF-003
- [ ] `Profile.SocialLinks` populated with current handles
- [ ] `Profile.SeoOg.metaTitle`, `metaDescription` set; OG image reference set (placeholder if not yet designed)
- [ ] Skills seeded with `displayGroup` correctly assigned: frontend (Angular, TypeScript, RxJS, Tailwind...), backend (NestJS, Prisma, Postgres...), tooling (Nx, Vitest...), other (i18n, A11y...)
- [ ] No skill bars / proficiency numerics surfaced on landing — landing groups by displayGroup only

## Technical Notes
- Validate against domain.md PRF rules + new Skill displayGroup.
- Translatable fields: ship en only in V1 (per scope). Schema supports VN parking-lot.

## Files to Touch
- `apps/api/prisma/seed.ts` (or seed-data files)
- `apps/api/prisma/seed-data/profile.ts`
- `apps/api/prisma/seed-data/skills.ts`

## Dependencies
- 277

## Complexity: S

## Progress Log
