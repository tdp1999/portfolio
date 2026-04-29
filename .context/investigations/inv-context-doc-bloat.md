# Investigation — Context Doc Bloat

> Sweep of `.context/` guidance docs for ephemeral content (status tables,
> changelogs, dated decisions) leaking into timeless reference. Per the
> post-mortem 2026-04-29, guidance docs must be timeless-only; ephemeral
> content belongs in epic files, `decisions.md`, or `progress.md`.

## Method

Scored each non-archive `.md` file for indicators: `Migration status`,
`✅ migrated`, `Changelog`, `Promotion of …`, dated `[YYYY-MM-DD]` headers,
`## Status` sections in non-task files. Ranked by hit count.

## Findings

| File | Bloat | Action |
|---|---|---|
| `.context/domain.md` | `## Changelog` block (lines 255-263) — 9 dated entries describing past edits | **DELETE** |
| `.context/design/console.md` | `## Changelog` block (lines 257-261) — 3 dated entries | **DELETE** |
| `.context/design/foundations.md` | `## Architecture Changelog` (lines 445-458) — single SCSS standardization entry that already lives in `decisions.md` | **DELETE** |
| `.context/vision.md` | `## Changelog` block (lines 99-107) — single TDD entry already covered in `decisions.md` | **DELETE** |
| `.context/database-schema-design.md` | `## Created\n\n2025-02-03` (lines 712-714) — solitary creation stamp | **DELETE** (file timestamp suffices) |
| `.context/style-review.md` | Already a designated event stack — keeps a 1-line summary table for resolved items by design. Not bloat. | keep |
| `.context/runbook-production.md` | "measured 2026-03-06" inline operational data point — not bloat | keep |
| `.context/design/console-cookbook.md` | Cleaned in B1 (post-mortem) | done |

`patterns-architecture.md`, `angular-style-guide.md`, `testing-guide.md`,
`ARCHITECTURE_BLUEPRINT.md`, `DESIGN-console.md`, `DESIGN-landing.md` — no
bloat indicators surfaced. Spot-checked headings; content is rule-shaped.

## Meta-rule (to add to CLAUDE.md or patterns-architecture.md)

> **Guidance docs are timeless-only.** Reference docs in `.context/design/`,
> `.context/patterns-*`, `*-guide.md`, `vision.md`, and `domain.md` describe
> the system as it is, not how it got there. Status, migration progress,
> dated decisions, and per-epic changelogs belong in:
> - the originating epic file (while in flight) →
> - `progress.md` or an archived epic (when done), or
> - `decisions.md` (for one-shot architectural decisions).
>
> When closing an epic, sweep its guidance-doc additions for ephemeral
> wording before merging.

## Status

investigation
