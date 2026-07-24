# Design Bank — project map

The project's design knowledge, in role/stability buckets. This is the **project residue**: the
universal principles, patterns, and the author's taste live in the global skill
(`~/.claude/skills/design/shared/`) and are linked here by concept (`→ skill patterns/<name>`).
Read the bucket that matches your task — you should never need to open all of it.

Two homes (see the skill's `SKILL.md`): global = reusable kernel; here = project-specific only.

## Buckets — what belongs where

| Bucket | What belongs here |
|---|---|
| `system/` | The project's design-system definition — tokens, palette, spacing, and the landing/console/shared type & style rules (`foundations`, `landing`, `landing-typography`, `console`, `shared`). |
| `contracts/` | Locked invariants code must honor — the 4px/type-scale contract and the responsive contract. Enforced by lint/hooks. |
| `cookbook/` | Actionable "pick the right value/widget" how-to — `console` (spacing/typography/layout), `forms` (input types + checklist), `loading`. |
| `patterns/` | Project pattern residue linking a global parent, plus project-only patterns (`section-bucketing`, `field-labeling-hierarchy`, `bilingual-formgroup`). |
| `components/` | Per-component thin decision records + the living `_index.md` registry. Keeps behavior contracts; API→JSDoc, visuals→DDL, how-to→cookbook are links. |
| `workflow/` | Process docs specific to this project — the `visual-feedback` screenshot/login recipe. |
| `ingest/` | Landing zone for raw `/design ingest` output before it's curated into the right bucket. |
| `index.md` · `sources.md` | This map + the project-ingest provenance registry (universal provenance is in the skill). |

## The rule that keeps this lean

The bank stores only what has **no other source of truth**: behavior-contract invariants,
rationale, rejected alternatives, anti-patterns, family rules. Everything else is a link — API to
JSDoc, visuals to the DDL showcase, how-to to the cookbook. When a discovery would help another
project, it goes to the global skill and the project keeps a thin residue that links up. See the
skill's `shared/conventions/bank-format.md`.

## Working on the bank

Use `/design` (the universal design skill): `document` to record a decision, `ingest` to absorb a
source, `review` to check a component, `adopt` to pull a global pattern in. Guidance docs here are
**timeless** — no dated snapshots or status trackers (those go in the epic or `progress.md`).
