# Task: Radar — move business rules into a real domain layer

## Status: pending

## Goal
Give the Radar module the hexagonal shape the rest of the API has: entities and value objects own the rules, the application layer only orchestrates.

## Context
Epic `epic-radar-ai-news`. Raised by the Owner during task 411 (2026-10-06): `modules/radar/domain/` holds only types and pure functions, while the run state machine, comment tiers, labels and cap split live in `application/` (`run.advance.command.ts`, `run.comments.phase.ts`, `radar-comments.apply.ts`). The project convention (see `.context/patterns-architecture.md`) is Controllers → Services → Repositories with rich entities. Decided: finish 411 in the current structure, refactor here afterwards. Behavior must not change.

## Acceptance Criteria
- [ ] `RadarRun` is an aggregate (entity + its step runs) that owns status transitions: start, advance a step, await external, fail, cancel, finish, set warning. Commands load it, call a method, save it.
- [ ] `RadarItem` is an entity that owns the work lease (claim, release on expiry, stuck after 3 claims) and the comment state (apply a fetch, mark failed, partial).
- [ ] `RadarSource` is an entity that owns activate / deactivate and the "inactive source rejects upload" rule.
- [ ] Comment rules live in a `RadarCommentThread` value object (label, keep, claim filter) and a tier policy (`selectCommentTier`), both in `domain/`, with no Prisma or Nest imports.
- [ ] Repositories map rows to entities and back (`toDomain` / `toPersistence`); no Prisma type leaks past `infrastructure/`.
- [ ] Existing radar specs pass unchanged in behavior; rules that moved get entity / value-object specs (via `be-test`) and the command specs shrink to orchestration.
- [ ] API build and radar tests pass.

## Technical Notes
- Reference shape: another module of this API that already has `domain/entities/*.entity.ts` (read one before starting).
- Keep the run meta (`meta.comments`, image cursor) as a value object on the step, not loose JSON in commands.
- No schema change expected.

## Files to Touch
- apps/api/src/modules/radar/domain/**
- apps/api/src/modules/radar/application/commands/**
- apps/api/src/modules/radar/infrastructure/repositories/**

## Progress Log
- 2026-10-06 Created from task 411 review (Owner: "làm xong task 411 đi, rồi refactor sau").
