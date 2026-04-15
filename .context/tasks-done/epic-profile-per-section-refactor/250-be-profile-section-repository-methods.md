# Task: BE — Profile section repository methods

## Status: done

## Goal
Add 6 targeted `update*Section()` methods to `ProfileRepository`, each touching only its section's Prisma columns.

## Context
Repository today has `upsert()` (rewrites everything) plus targeted `updateAvatar()` / `updateOgImage()` (the breadcrumbs that prove the pattern). This task generalizes that pattern to all 6 sections so per-section commands (task 249) can persist surgically.

## Acceptance Criteria
- [x] 6 methods on `ProfileRepository`: `updateIdentity(id, identity: Identity)`, `updateWorkAvailability(...)`, `updateContact(...)`, `updateLocation(...)`, `updateSocialLinks(...)`, `updateSeoOg(...)`
- [x] Each method calls `prisma.profile.update({ where: { id }, data: { /* only that section's fields */ } })`
- [x] VO ↔ Prisma translation lives in repo (handler doesn't see Prisma shape)
- [x] Repository integration tests verify each method writes ONLY its section's columns (use Prisma client mock with assertion on `data` keys, OR real DB integration test asserting other columns unchanged)
- [x] Existing `upsert()`, `updateAvatar()`, `updateOgImage()` untouched
- [x] Type checks pass

## Technical Notes
- **Specialized Skill:** `be-test`
- **Key sections to read:** Core Workflow (Analyze → Plan → Write → Validate), Layer-Specific Quick Reference (Mapper row — closest analogy for repo tests: only test computed/translation logic, not field-to-field copy)
- Existing reference: `apps/api/src/modules/profile/infrastructure/repositories/profile.repository.ts` (`updateAvatar` lines ~50–56)
- Translatable JSON fields: VO holds them as flat keys; repo writes them as JSON columns matching Prisma schema
- Don't add a generic `updateSection(name, data)` dispatcher — keep methods explicit per section for type safety

## Files to Touch
- `apps/api/src/modules/profile/infrastructure/repositories/profile.repository.ts`
- `apps/api/src/modules/profile/infrastructure/repositories/profile.repository.spec.ts`

## Dependencies
- 248 (VOs)

## Complexity: M

## Progress Log
- [2026-04-14] Started — using be-test skill for repository spec (Mapper row: only test translation/computed logic, not field-to-field copy)
- [2026-04-14] Implemented 6 `update*Section()` methods on `ProfileRepository`, each calling `prisma.profile.update` with only that section's columns + `updatedById`. JSON fields (`fullName`, `title`, `bioShort`, `openTo`, `socialLinks`, `resumeUrls`, `certifications`) cast to `Prisma.InputJsonValue`; `bioLong` null → `Prisma.DbNull`.
- [2026-04-14] Added `profile.repository.spec.ts` with 7 tests (one per method + bioLong null translation). Each test asserts `where: { userId }` and `Object.keys(data).sort()` equality to catch both scope leaks and missing keys.
- [2026-04-14] All 7 repo tests pass; api type check clean.
- [2026-04-14] Done — all ACs satisfied
