# Epic: Experience Module Content Review

## Summary

Two domain-modeling decisions surfaced while reviewing the Experience form. Both are small refactors but require user judgement, not just code.

## Why

- **Achievements vs Key Responsibilities** — User's CV uses "Key Responsibilities" almost exclusively; "Achievements" are rare and hard to articulate. The current Experience form has an Achievements field that the user is unlikely to fill. Decision needed: rename, replace, or keep both.
- **Client Industry vs Domain** — Form has both fields; user does not understand the distinction. CV uses a single "Work Domain" field. Likely consolidation needed.

## Target Users

- Site owner (the only writer of Experience records).

## Scope

### In Scope

- Decide final field set for Experience: keep / rename / drop / merge {Achievements, Key Responsibilities, Client Industry, Domain}.
- Apply BE: schema migration if field shape changes, DTO updates, repository / service / handler changes.
- Apply FE: form, view, list display, any landing-page render that consumes these fields.
- Update Experience module E2E tests if names / counts change.

### Out of Scope

- Wholesale Experience UX changes — that work belongs in **Epic: Console Form System Design Foundations**.

## High-Level Requirements

1. Decision recorded in `.context/decisions.md` (ADR) with rationale.
2. BE schema + Prisma migration applied (if needed) using `prisma-migrate` skill.
3. FE form reflects new field set.
4. Landing render path updated.
5. Existing seed / test data migrated (no orphaned columns).

## Technical Considerations

### Data Model

- Likely touches `Experience` model in `apps/api/prisma/schema.prisma`.
- DTOs in `apps/api/src/modules/experience/`.
- FE form + view in `libs/console/feature-experience/`.

### Dependencies

- None — runs independently of other epics.

## Risks & Warnings

⚠️ **Data migration if column drop**
- Use `prisma-migrate` skill (expand/migrate/contract) to preserve existing records.

## Success Criteria

- [ ] All five high-level requirements met.
- [ ] Existing Experience records readable after migration.
- [ ] Experience E2E tests green.

## Specialized Skills

- **prisma-migrate** — handle any schema change with backup + multi-step migration

## Estimated Complexity

S

**Reasoning:** Two decisions, small schema + UI footprint. Migration discipline is the only risk.

## Status

done

## Created

2026-04-27
