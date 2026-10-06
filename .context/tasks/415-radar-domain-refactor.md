# Task: Radar — move business rules into a real domain layer

## Status: done

## Goal
Give the Radar module the hexagonal shape the rest of the API has: entities and value objects own the rules, the application layer only orchestrates.

## Context
Epic `epic-radar-ai-news`. Raised by the Owner during task 411 (2026-10-06): `modules/radar/domain/` holds only types and pure functions, while the run state machine, comment tiers, labels and cap split live in `application/` (`run.advance.command.ts`, `run.comments.phase.ts`, `radar-comments.apply.ts`). The project convention (see `.context/patterns-architecture.md`) is Controllers → Services → Repositories with rich entities. Decided: finish 411 in the current structure, refactor here afterwards. Behavior must not change.

## Acceptance Criteria
- [x] `RadarRun` is an aggregate (entity + its step runs) that owns status transitions: start, advance a step, await external, fail, cancel, finish, set warning. Commands load it, call a method, save it.
- [x] `RadarItem` is an entity that owns its single-item transitions: the comment state (apply a fetch, mark failed, partial) and taking an enrichment (DONE, lease cleared). The lease rules (30-minute lease, 3-claim cap) live in `domain/` as constants and a policy; claim and the stuck count stay one set-based SQL statement (`SKIP LOCKED`) in the repository, so two workers never get the same item.
- [x] `RadarSource` is an entity that owns activate / deactivate and the "inactive source rejects upload" rule.
- [x] Comment rules live in a `RadarCommentThread` value object (label, keep, claim filter) and policies (`RadarCommentTierPolicy`, `RadarCommentLabelPolicy`, `RadarCommentsCostPolicy`), both in `domain/`, with no Prisma or Nest imports.
- [x] Repositories map rows to entities and back (`toDomain` / `toPersistence`); no Prisma type leaks past `infrastructure/`.
- [x] Existing radar specs pass unchanged in behavior; rules that moved get entity / value-object specs (via `be-test`) and the command specs shrink to orchestration.
- [x] API build and radar tests pass.

## Technical Notes
- Reference shape: another module of this API that already has `domain/entities/*.entity.ts` (read one before starting).
- Keep the run meta (`meta.comments`, image cursor) as a value object on the step, not loose JSON in commands.
- No schema change expected.
- Every run and step write stays conditional on the run being active (a cancel can land mid-tick): `save(run)` writes the run and its changed steps in one transaction guarded by the active status and returns null otherwise.
- Prisma enums may appear in `domain/` (project convention, see `contact-message.entity.ts`); Prisma row and JSON types stay in `infrastructure/`.
- **Specialized Skill:** be-test

## Files to Touch
- apps/api/src/modules/radar/domain/**
- apps/api/src/modules/radar/application/commands/**
- apps/api/src/modules/radar/infrastructure/repositories/**

## Progress Log
- 2026-10-06 Created from task 411 review (Owner: "làm xong task 411 đi, rồi refactor sau").
- 2026-10-06 Started. Verified against the code: claim is one `SKIP LOCKED` statement, so the lease stays in SQL (Owner chose this, AC 2 reworded); every run write is conditional on the run being active, so the aggregate's save must keep that guard; tier, label, keep and claim filter are already pure functions in `domain/radar-comments.ts`, the PARTIAL and charge-cap rules are still in `application/`; `IRadarSourceRepository` returns the Prisma `RadarSource` row. Plan (Owner approved): 4 parts, each green before the next: comment domain, `RadarSource`, `RadarRun` aggregate, `RadarItem` + mappers.
- 2026-10-06 Parts 1 and 2 done: comment value object and policies in `domain/value-objects` and `domain/policies`, `RadarSource` entity, specs via be-test.
- 2026-10-06 Part 3 done: `RadarRun` aggregate (`RadarRun` + `RadarStepRun`, value objects `RadarCommentsProgress` and `RadarDatasetCursor`). Save design: `save(run)` diffs the state read against the current state (`RadarRunMapper.changes`) and writes only changed run and step fields in one transaction; the run row is guarded on an active status, each changed step on the status it was read in, so a stale copy never overwrites a cancel or a second upload, and counters written by capture pages are never overwritten. A failed guard rolls back and returns null. Cancel re-reads and retries up to 3 times when its save loses to a tick. The comments phase now returns the run (progress and warning on it) instead of a meta patch, and stops starting further jobs once the run was cancelled mid-tick.
- 2026-10-06 Part 4 done: `RadarItem` entity (comment state, taking an enrichment), `RadarLeasePolicy` (30-minute lease, claim cap), item mapper; claim stays one `SKIP LOCKED` statement. `WORK_LEASE_MS` / `MAX_CLAIM_ATTEMPTS` left `radar.dto.ts`. No `@prisma/client` import in `domain/` or `application/` other than enums.
- 2026-10-06 be-test for parts 3 and 4: entity specs for `RadarRun` (create, cancel, upload guard), `RadarStepRun`, `RadarItem`, `RadarCommentsProgress`, and `RadarRunMapper.changes()`; cancel rules moved out of the cancel command spec. Radar: 159 tests green (run twice), `tsc` app + spec clean, `nx build api` green.
- 2026-10-06 Seen once in a full parallel run: `radar-item.repository.integration.spec.ts` "count stuck and paused" compares global `stats()` before and after, so another integration suite writing items at the same moment can shift the counts. Pre-existing, unrelated to this task; passes alone and in two further full runs.
- 2026-10-06 Pre-commit review fixes: marking comments FAILED writes only status and error again (`saveCommentsFailure`, one `updateMany`), so comments stored between the read and the write are kept; cancel that loses every retry throws `RADAR_RUN_BUSY` (409, new code + console message) instead of a plain `Error`; invariant errors use `InternalServerError`. New tests: cancel RUN_BUSY, run-save rollback when a step guard fails, comments failure write keeps fresh comments (integration). Radar: 162 tests green (run twice), `nx build api` and `nx build console` green.
- 2026-10-06 Done: all ACs satisfied.
