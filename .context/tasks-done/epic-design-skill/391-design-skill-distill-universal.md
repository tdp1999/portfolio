# 391 — Distill universal knowledge into the skill `shared/`

> from: `epic-design-skill.md`. Depends on 390 (structure exists). Moves the universal/taste tiers
> OUT of the portfolio into the reusable global library.

## Goal

Create the reusable library under `~/.claude/skills/design/shared/` by distilling the universal
kernels + the author's taste from `.context/design/`, stripping project residue (tokens, paths,
component names). This library is the cross-project reuse vehicle.

## What to do (from the classification)

**`principles/` (5)** — `chunking-progressive-disclosure`, `reward-early-punish-late`,
`inline-validation`, `human-factors-reference` (from `foundations.md` §Design Rationale),
`token-architecture` (3-layer model, values stripped).

**`patterns/` (13)** — `long-form-layout`, `settings-section`, `record-detail-layout`,
`atomic-save`, `chip-toggles` (all 4 chip docs), `segmented-control`, `overflow-disclosure`,
`carousel-and-gestures`, `image-lightbox`, `count-aware-gallery`, `shared-read-view-chassis`
(decision D — confirm with author), `loading-indicators`, `responsive-strategy`.

**`taste/` (7)** — `typography-two-base` (the signature), `grid-and-token-discipline`,
`reuse-first`, `expensive-effects-and-progressive-enhancement` (cross-links `diagnose-scroll-jank`),
`decoration-restraint`, `ui-copy`, `doc-hygiene`.

Plus `shared/index.md` (map, one line per file) and `shared/sources.md` (external provenance for the
universal rows of the current `bank/sources.md`).

## Acceptance criteria

- [x] All 5 principles, 13 patterns, 7 taste files created.
- [x] Each strips project residue (no repo tokens/paths/component names) — portable kernel only.
- [x] `expensive-effects...` cross-links `diagnose-scroll-jank` instead of duplicating (decision E).
- [x] `human-factors-reference` carries research + recommended defaults (decision B: skill side).
- [x] Author confirms whether `shared-read-view-chassis` is lifted (decision D) — **confirmed: split**. Abstract `read-view-chassis` lifted to skill; console-record wiring stays in project (task 392).
- [x] `index.md` + `sources.md` present; index does not rot (concept names, no line numbers).

## Files to touch

- `~/.claude/skills/design/shared/**` (new)
- read-only: `.context/design/**`, `CLAUDE.md`

## Trạng thái

`done` — created 2026-07-24, completed 2026-07-24. 27 files under
`~/.claude/skills/design/shared/` (5 principles, 13 patterns, 7 taste, index, sources).
Decision D resolved to **split** — `read-view-chassis` lifted (concept), console-record
wiring stays in project.
