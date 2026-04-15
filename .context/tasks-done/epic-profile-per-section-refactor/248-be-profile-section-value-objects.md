# Task: BE — Profile section value objects + aggregate composition

## Status: done

## Goal
Split monolithic `Profile` aggregate into 6 value objects matching the section structure, with the aggregate composing them.

## Context
First step of the per-section refactor (epic-profile-per-section-refactor). Currently `Profile` is a flat aggregate with ~30 fields and no value objects. The 6 sections (Identity, WorkAvailability, Contact, Location, SocialLinks, SeoOg) are only labeled in code comments. This task creates the domain layer that all subsequent BE tasks depend on.

## Acceptance Criteria
- [x] 6 VO classes/types created in `apps/api/src/modules/profile/domain/value-objects/`: `Identity`, `WorkAvailability`, `Contact`, `Location`, `SocialLinks`, `SeoOg`
- [x] Each VO is immutable (frozen), holds only its section's fields, and validates its own invariants in factory method
- [x] `Profile` aggregate constructor accepts the 6 VOs (plus `id` + audit fields); composes them as named properties
- [x] Aggregate exposes 6 `withSection(...)` immutable mutators (e.g., `withIdentity(newIdentity)`) that return a new `Profile` with only the specified VO replaced
- [x] No `update()` method that takes a partial of all fields — that pattern dies here
- [x] Existing avatar / og-image flows continue to work (touched only via their dedicated commands)
- [x] Unit tests for each VO factory (validation invariants, equality)
- [x] Type checks pass (`npx tsc --noEmit`)

## Technical Notes
- Existing files: `apps/api/src/modules/profile/domain/entities/profile.entity.ts`, `profile.types.ts`
- Bilingual fields (`*_en` / `*_vi`) stay flat inside their VO for v1 — don't restructure to nested `{ en, vi }` here. That's a FE-only convention (see task 256).
- VO factories throw `DomainError` on invariant violation — use existing `DomainError` per testing patterns
- Don't introduce new persistence concerns — repo will translate VOs ↔ Prisma in task 250

## Files to Touch
- `apps/api/src/modules/profile/domain/value-objects/identity.ts` (new)
- `apps/api/src/modules/profile/domain/value-objects/work-availability.ts` (new)
- `apps/api/src/modules/profile/domain/value-objects/contact.ts` (new)
- `apps/api/src/modules/profile/domain/value-objects/location.ts` (new)
- `apps/api/src/modules/profile/domain/value-objects/social-links.ts` (new)
- `apps/api/src/modules/profile/domain/value-objects/seo-og.ts` (new)
- `apps/api/src/modules/profile/domain/value-objects/index.ts` (new)
- `apps/api/src/modules/profile/domain/entities/profile.entity.ts` (refactor)
- `apps/api/src/modules/profile/domain/entities/profile.entity.spec.ts` (new/update)
- VO unit specs (one per VO)

## Dependencies
None (foundation for 249, 250)

## Complexity: M

## Progress Log
- [2026-04-13] Started
- [2026-04-13] Done — all ACs satisfied
