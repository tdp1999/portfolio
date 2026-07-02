# Task: RTE Canonical Column Parity + No-Exceptions Contract

## Status: done

## Goal
Give **every** rich-text (RTE) field the full four-column storage set — `<field>Json` +
`<field>Canonical` + `<field>Html` + `<field>SchemaVersion` — and enforce it as a
permanent contract so no future RTE field can ship without a canonical column.

## Context
Split out from task 312. The prose-block epic (ADR-022) added the canonical
`PortableDocument` read-path but only wired the two "big body" fields
(`project.body`, `blog.content`) with a `*Canonical` column. Seven other RTE fields —
`profile.bioLong`, `experience.{description,responsibilities,highlights}`,
`technicalHighlight.{challenge,approach,outcome}` — kept only `*Json`/`*Html`/
`*SchemaVersion`. The write pipeline (`RichTextService.toCanonicalForm*`) **always
computes** `canonical`, but those seven repos silently **dropped** it for lack of a
column. Task 312 hit this: `home-intro` needs a structured per-paragraph doc, but the
API returned only raw Tiptap `bioLongJson` (wrong shape) with no canonical stored.

User decision (2026-07-02): fix all seven now + establish a self-enforced contract.
See **ADR-023**.

## Acceptance Criteria
- [x] Migration `add_rte_canonical_columns` adds nullable JSONB `*Canonical` to all 7 fields (expand-only, no data transform). Applied + client regenerated.
- [x] Write path persists `rich.canonical` uniformly: profile (`updateIdentity`), experience (`withXRichText` × 3), technicalHighlight (`RichFieldTriple.canonical` → repo `highlightRichData`). Entities/mappers/ports/props updated.
- [x] `profile.bioLongCanonical` exposed via presenter + DTO (only field with a current landing consumer). Others: storage + persist only (API/render adoption deferred per-need).
- [x] `backfill-canonical.ts` generalized to a table-driven list covering all 9 RTE fields; `--module=<model>` or `--module=<model>.<field>`.
- [x] Contract enforced by `apps/api/src/rte-canonical-contract.spec.ts` — scans `schema.prisma`, fails if any `*SchemaVersion` group lacks a sibling `Json`/`Html`/`Canonical` JSONB column. 10/10 pass.
- [x] ADR-023 logged; guardrail in `patterns-architecture.md` ("Rich-Text Field Storage Contract") + `CLAUDE.md`.
- [x] Verification: API sweep 303 tests (28 suites) ✓; API app typecheck ✓; changed files lint-clean.

## Files Touched
- `apps/api/prisma/schema.prisma` + migration `20260702073812_add_rte_canonical_columns`
- Profile: entity, `profile.types.ts` (IProfileProps), mapper, repository, port, presenter, dto
- Experience: entity, `experience.types.ts`, mapper
- Project: `project-highlight.mapper.ts`, repository, mapper (`ProjectHighlightDto`), port (`RichFieldTriple`)
- `apps/api/scripts/backfill-canonical.ts` (generalized)
- `apps/api/src/rte-canonical-contract.spec.ts` (new)
- `.context/decisions.md` (ADR-023), `.context/patterns-architecture.md`, `CLAUDE.md`
- All affected `*.spec.ts` fixtures updated with the new canonical fields

## Follow-ups (not in this task)
- Backfill existing rows if any were authored before the columns existed: `pnpm backfill:canonical --dry-run` then without `--dry-run`.
- Switching experience / technicalHighlight landing render from `<rte-render-html>` to `<rte-render [doc]>` is now a presenter + read-site change with zero DB work (canonical is stored).

## Progress Log
- [2026-07-02] Done — schema + persist + backfill + contract test + ADR-023 shipped; all ACs satisfied. Read-side for bioLong lives in task 312.
