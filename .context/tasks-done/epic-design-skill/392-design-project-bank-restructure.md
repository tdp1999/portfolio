# 392 — Restructure the project `.context/design/`

> from: `epic-design-skill.md`. Depends on 391 (know what left to the skill). Keeps project-specific
> content, restructures it to scale, links the global library by concept.

## Goal

Reshape `.context/design/` from a flat pile into role/stability buckets, dissolve `bank/`, thin the
component docs to SoT-only, and add a living index — so future ingested knowledge lands in the right
bucket instead of piling at the root.

## Target layout

```
.context/design/
  index.md            # living map; one line "what belongs here" per bucket
  sources.md          # project-specific ingests only
  system/             # foundations landing landing-typography console shared (residue)
  contracts/          # scale-contract responsive-contract (link skill taste/patterns)
  cookbook/           # console loading forms(NEW split)
  patterns/           # residue halves + bilingual-formgroup section-bucketing field-labeling-hierarchy (NEW)
  components/          # _index.md(NEW) + per-component thinned to SoT + links; keep chips/ record-view/
  workflow/           # visual-feedback (after task 395)
  ingest/             # landing zone for design-ingest, then curate-promote
```

## What to do

- Create the 7 buckets; move each current file into its bucket (see epic mapping).
- Strip the universal kernel that left to the skill; add a one-line "→ skill `patterns/<name>`" link
  per residue file.
- Dissolve `bank/` (principles + `form-validation` gone to skill; pattern residue → `patterns/`;
  `index.md`/`sources.md` → root).
- Thin `components/*`: keep only SoT-exclusive content (contract invariants, rationale, anti-patterns,
  family rules); replace API/visual/how-to with links (JSDoc / DDL / cookbook).
- Split `console-cookbook.md` → `cookbook/console.md` + `cookbook/forms.md`; extract
  `bilingual-formgroup`, `section-bucketing`, `field-labeling-hierarchy` into `patterns/`.
- `foundations.md`: keep residue in `system/`; value-validation table split per decision B.
- Replace `_audit.md` with living `components/_index.md`; relocate the dated snapshot into
  `epic-component-docs-and-ddl.md` (decision I).
- Root `index.md`: living map + one-line "what belongs here" per bucket.

## Acceptance criteria

- [x] 7 buckets exist; every current file moved (nothing orphaned at root except index/sources).
- [x] `bank/` dissolved; each residue file links its global parent by concept.
- [x] `components/*` thinned to SoT-only; API/visual/how-to are links, not copies.
- [x] cookbook split done; 3 new project patterns extracted.
- [x] `_audit.md` snapshot relocated to the epic; `components/_index.md` is a living registry.
- [x] root `index.md` present and navigable without CLAUDE.md.

## Files to touch

- `.context/design/**`
- `.context/plans/epic-component-docs-and-ddl.md`

## Trạng thái

`done` — created 2026-07-24, completed 2026-07-24. `.context/design/` reshaped from a 32-file
flat pile into 7 buckets (36 files). `bank/` dissolved: principles lifted to skill (no stub),
`form-validation`/`settings-section` → stub-with-link (decision A), `atomic-save`/`long-form-layout`/
`record-detail-layout` kept as project residue with `→ skill patterns/*` links + Sources trimmed to
a skill pointer. `console-cookbook` split → `cookbook/console.md` (spacing/typography/layout) +
`cookbook/forms.md` (input types + checklist; fixed `console-media-picker`→`-dialog`, `design-check`→
`/design review`); extracted `patterns/{section-bucketing,field-labeling-hierarchy,bilingual-formgroup}`.
`foundations` value-table split per decision B (research→skill, our-value/status→project). Contracts,
loading, landing-typography, foundations-token-arch all link their skill parents. Components thinned:
each links its global pattern (card→decision-E cross-link to `diagnose-scroll-jank`); `record-view`
dangling `bank/` links repointed to `patterns/`. `_audit.md` snapshot relocated to
`epic-component-docs-and-ddl.md` appendix (decision I) + inbound epic links repointed; replaced by
living `components/_index.md`. Root `index.md` + `ingest/README.md` created; `sources.md` thinned to
project-only. Verified: no dangling `bank/`/`console-cookbook` refs inside the bank.

**Deferred to 394:** repo-wide inbound references to the OLD paths (CLAUDE.md guardrail table,
other `.context/*` docs, code comments referencing `.context/design/scale-contract.md`,
`console-cookbook.md`, `bank/patterns/...`, `components/_audit.md`, etc.) — 394 owns the grep+fix
sweep alongside the CLAUDE.md rewrite.

**Note:** component `Inputs` API tables were retained (not stripped to links) — there is no JSDoc/
DDL-API source-of-truth to link to yet; the Component-Docs-&-DDL epic owns that API-table migration
in its own phases. The docs are otherwise SoT-only (behavior contract + links for visual/how-to).
