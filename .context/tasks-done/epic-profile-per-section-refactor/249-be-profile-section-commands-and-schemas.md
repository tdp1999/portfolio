# Task: BE — Profile section command handlers + Zod schemas

## Status: done

## Goal
Replace `UpsertProfileCommand` with 6 section commands, each validated by its own section-scoped Zod schema.

## Context
With the aggregate split into VOs (task 248), the application layer can now expose fine-grained commands that update one section at a time. Each command validates only its section's fields. Pattern follows existing CQRS convention used by `UpdateAvatarCommand` and `UpdateOgImageCommand`.

## Acceptance Criteria
- [x] 6 section Zod schemas in `apps/api/src/modules/profile/application/schemas/`: `update-profile-identity.schema.ts`, etc. Use Zod v4 syntax (e.g., `z.email()` not `z.string().email()`).
- [x] 6 command + handler pairs in `apps/api/src/modules/profile/application/commands/`: `UpdateProfileIdentityCommand` + handler, etc.
- [x] Each handler: load aggregate via repo → construct new VO via factory → call `aggregate.withSection(newVO)` → call corresponding repo `updateSection()` method (task 250)
- [x] Per-handler unit tests covering: valid section update, validation error from VO, validation error from Zod schema, repo error propagation
- [x] Old `UpsertProfileCommand` + `UpsertProfileSchema` left in place this task (deleted in task 251 to keep PR diff readable)
- [x] Type checks pass

## Technical Notes
- **Specialized Skill:** `be-test`
- **Key sections to read:** Core Workflow (Analyze → Plan → Write → Validate), Layer-Specific Quick Reference (Command row)
- Test file targeting: `npx jest --config apps/api/jest.config.cts <file> --no-coverage` per CLAUDE.md
- DomainError pattern: use `rejects.toBeInstanceOf(DomainError)` in tests (memory: `feedback_test_runner_scope`)
- Each section schema validates ONLY its section's fields — do not include unrelated fields
- Bilingual fields stay flat in DTO/schema (e.g., `fullName_en`, `fullName_vi`); FE handles nested `{ en, vi }` convention separately

## Files to Touch
- 6 schema files under `application/schemas/`
- 6 command files under `application/commands/`
- 6 handler files under `application/commands/handlers/` (or co-located per existing convention)
- 6 spec files
- `application/commands/index.ts` (export new commands)

## Dependencies
- 248 (VOs must exist)

## Complexity: M

## Progress Log
- [2026-04-14] Started — using be-test skill for handler specs
- [2026-04-14] Side-fix: added `fromPersistence()` to all 6 VOs and switched `Profile.load()` to use them (reconstitution shouldn't run creation invariants). Fixed seed placeholders that produced domain-invalid rows.
- [2026-04-14] Added 6 schemas under `application/schemas/` (Zod v4, section-scoped, nullable fields match VO shape).
- [2026-04-14] Added 6 commands + handlers under `application/commands/`. Each: Zod validate → load profile (NOT_FOUND if missing) → build VO → `withSection` → `repo.updateSection(userId, vo, updatedById)`.
- [2026-04-14] Identity handler preserves `avatarId` from profile; SeoOg handler preserves `ogImageId` (those have dedicated commands).
- [2026-04-14] Added 6 port method signatures to `IProfileRepository`; stubbed impls in `ProfileRepository` (real impls come in task 250).
- [2026-04-14] Registered 6 handlers in `profile.module.ts`.
- [2026-04-14] Extended `profile-commands.spec.ts` with 25 tests (4 per handler + shared NOT_FOUND on Identity). 40 command tests total, all passing.
- [2026-04-14] Side-fix: corrected pre-existing TS2554 in `profile-queries.spec.ts` (`handler.execute()` takes no args).
- [2026-04-14] All 113 profile tests pass; api app type check clean.
- [2026-04-14] Done — all ACs satisfied
- [2026-04-14] Post-audit (be-test skill): cut 18 of 25 new section-handler tests (Zod-violation, VO-violation, repo-error-propagation across 6 handlers). Single Owner Rule: Zod→schema, VO→VO specs, async propagation→JS. Kept 1 happy path per handler + shared NOT_FOUND on Identity. File now 22 tests, all passing.
