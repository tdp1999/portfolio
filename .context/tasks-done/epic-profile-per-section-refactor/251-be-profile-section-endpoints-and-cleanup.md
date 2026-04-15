# Task: BE — Profile section PATCH endpoints + delete UpsertProfile

## Status: done

## Goal
Expose 6 PATCH endpoints (one per section) on the Profile controller and hard-delete the old `UpsertProfileCommand` + monolithic schema + `upsert()` repo method.

## Context
With section commands (249) and section repo methods (250) in place, the controller can route per-section requests. No external API consumers — only console FE talks to admin Profile API — so hard cut is safe and avoids dead code.

## Acceptance Criteria
- [x] 6 PATCH endpoints under admin profile controller: `/api/admin/profile/identity`, `/work-availability`, `/contact`, `/location`, `/social-links`, `/seo-og`
- [x] Each endpoint: validates body via section Zod schema → dispatches section command via CommandBus → returns updated section (or 204)
- [x] Per CLAUDE.md guardrail: controllers throw NO errors — all error logic in command handlers
- [x] `UpsertProfileCommand` + handler + `UpsertProfileSchema` + repo `upsert()` deleted
- [x] Old endpoint (PUT/POST `/api/admin/profile`) deleted
- [x] FE `profile.service.ts` `upsert()` call site identified and noted in this task's progress log (will be removed in task 257)
- [x] Public GET `/api/profile` response shape unchanged (landing page must keep working)
- [x] All API tests pass; `nx affected -t test` green
- [x] Type checks pass

## Technical Notes
- Existing controller: `apps/api/src/modules/profile/presentation/profile.controller.ts` (or admin variant if separate)
- HTTP method PATCH semantically correct for partial updates
- Each endpoint accepts ONLY its section's fields — Zod will reject extras (use `.strict()`)
- Returning the updated section helps FE reconcile state after save

## Files to Touch
- `apps/api/src/modules/profile/presentation/profile.controller.ts` (and admin variant)
- `apps/api/src/modules/profile/presentation/profile.controller.spec.ts`
- Delete: `apps/api/src/modules/profile/application/commands/upsert-profile.command.ts` + spec + schema
- Update: `application/commands/index.ts`, repo, any module wiring

## Dependencies
- 249, 250 (commands + repo methods must exist)

## Complexity: S

## Progress Log
- [2026-04-14] Started
- [2026-04-14] Added 6 PATCH endpoints to AdminProfileController (identity, work-availability, contact, location, social-links, seo-og)
- [2026-04-14] Deleted: `upsert-profile.command.ts`, `UpsertProfileSchema` from profile.dto, PUT endpoint, repo `upsert()` method, all associated tests
- [2026-04-14] FE call site: `libs/console/feature-profile/src/lib/profile.service.ts:17` (`upsert()`) called from `profile-page.ts:389` — to be removed in task 257
- [2026-04-14] All 77 profile tests pass, type check clean
- [2026-04-14] Done — all ACs satisfied
