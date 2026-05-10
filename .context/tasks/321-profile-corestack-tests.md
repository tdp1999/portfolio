# Task 321 — Tests for `Profile.coreStack` field

## Status

pending

## Source

Follow-up from E3 closure (2026-05-10) — feature shipped without test coverage. Code-reviewer flagged WARNING during /cap. User chose to commit and defer tests.

## Goal

Backfill unit tests for the additive `Profile.coreStack` feature so future refactors are safe.

## Acceptance Criteria

- [ ] `LandingContentBlocks` VO spec covers `equals()` returning `false` when only `coreStack` differs (e.g., `["A","B"]` vs `["A","B","C"]`, and order-sensitive `["A","B"]` vs `["B","A"]`)
- [ ] `LandingContentBlocks.create` / `fromPersistence` defensive copy verified — mutating the input array does not leak into the VO state
- [ ] `LandingContentBlocks.empty()` returns an instance whose `coreStack` is `[]`
- [ ] Mapper spec (`profile.mapper.spec.ts`) covers `parseStringArray` edge cases — non-array JSONB value (e.g. `null`, `{}`, `"foo"`) all coerce to `[]`; mixed-type array filters out non-strings
- [ ] Mapper round-trip test: `toDomain → toPrisma` preserves `coreStack` exactly
- [ ] Profile entity `toProps()` round-trip preserves `coreStack`
- [ ] No regression in existing profile specs (run `npx jest --config apps/api/jest.config.cts profile --no-coverage`)

## Files to Touch

- `apps/api/src/modules/profile/domain/value-objects/landing-content-blocks.spec.ts` (new — unless one exists; check `value-objects/` folder for sibling spec patterns like `seo-og.spec.ts`)
- `apps/api/src/modules/profile/infrastructure/mapper/profile.mapper.spec.ts` (extend if exists, or follow the pattern of other mapper specs)
- `apps/api/src/modules/profile/domain/entities/profile.entity.spec.ts` (extend `toProps` round-trip case)

## Notes

- Follow `.context/testing-guide.md` patterns
- Use `be-test` skill if available — spec author would normally invoke it
- `parseStringArray` lives in `profile.mapper.ts` as a private helper. If un-exported, test indirectly via `toDomain` with a fixture that has malformed `coreStack` raw value.

## References

- E3 epic: `plans-done/epic-portfolio-e3-data-enrichment.md` (Hero CORE_STACK fix change-log entry, 2026-05-10)
- Domain rule: PRF-007 in `domain.md`
