# Epic: Unified `design` Skill + Design-Knowledge Split

## Summary

Consolidate the scattered design skills (`design-ingest`, `design-check`, `component-bank`, plus the
temporary `ui-research` and `design` facade) into ONE user-scope skill `design` that owns the full
design lifecycle, and split the portfolio's `.context/design/` (33 files, ~3700 lines) into two
homes: a **reusable global library** shipped with the skill, and a **thinned project folder** that
links back to it by concept. The single-skill layout is chosen so it can later be split
near-mechanically into a plugin on the private `tdp-plugins` marketplace.

## Why

- Design skills are fragmented across scopes; even the author (who built them) must remember which
  skill does what. One front door `/design` with modes removes that friction.
- `.context/design/` mixes three tiers — research-backed universal principles, the author's portable
  taste, and this-repo specifics. The first two tiers should be reusable across every project; today
  they are trapped in the portfolio repo.
- The per-component "bank" causes a chronic tension: alongside DDL + code + JSDoc it looks redundant,
  bloats context, and goes stale — yet dropping it loses carefully-researched, reusable knowledge.
  Resolved here by a single Source-of-Truth rule.

## Design

### Two homes
- **Global** `~/.claude/skills/design/` — reusable library (`shared/principles/ patterns/ taste/`),
  7 mode docs, `imported/` (verbatim third-party sources, **resource-only**), `shared/templates/`,
  `shared/conventions/`, config. Splittable to a plugin later.
- **Project** `.context/design/` — restructured into `system/ contracts/ cookbook/ patterns/
  components/ workflow/ ingest/`; project-specific only; links the global library by concept name.

### Modes (7 — deliberately lean)
`init` · `adopt` · `research` (DDL prototyping folded in) · `ingest` · `revamp` · `review` ·
`document`. `/design` with no args prints the mode menu + current bank status.

### Core rules (invariants)
- **SoT rule** — the bank stores only knowledge with no other source of truth (behavior-contract
  invariants, rationale, rejected alternatives, anti-patterns, family/when-not rules). Everything
  else is a **link by concept**, never a copy. API → JSDoc, visual → DDL, how-to → cookbook.
- **Save-routing** — default **global** (~80%); project only for project residue; author chooses each time.
- **Minimal record** — NO execution logs (the ctx bloat lesson); ADR only for load-bearing /
  contested / hard-to-reverse decisions, capped; ordinary "why" is a one-line inline note.
- **Import = resource only** — imported skills are never promoted to first-class skills; on import,
  cross-check content, detect conflicts, report them in plain (ELI5) detail, author picks resolution.
- **Progressive disclosure** — bundled files load on demand; the bank is never bulk-loaded into context.

### Config (3 knobs)
`saveDefault: global|project` (default global) · `autoRecord: on|off` (ambient new-component
record) · `suggestGatedSources: on|off`.

### Ambient enforcement (CLAUDE.md, not a hook yet)
A small guardrail block: any UI/UX work follows global `taste/` + project `contracts/`, read before
writing; a new shareable component adds a record (pushes the kernel to global). This is a strong
**nudge** honored via CLAUDE.md, not a hard gate. A hard gate (PreToolUse/PostToolUse hook) becomes
available once `design` is a plugin — future phase.

### Component-bank resolution (the headache)
**Keep it, thinned to only what has no other SoT.** The reusable half lives in global `patterns/` —
that is the cross-project reuse vehicle (answers "how do I reuse research in another project"). The
project keeps only residue (which primitive, which ADR) as thin decision-records linking the global
parent. This simultaneously kills redundancy (linked, not copied), staleness (only stable rationale
is stored), and context bloat (on-demand load).

### Knowledge split (from the classification in task 391)
- **Universal → skill:** 3 pure-universal files + the kernels of ~20 mixed files, distilled into
  `principles/` (5), `patterns/` (13), `taste/` (7), plus `index.md` + `sources.md`.
- **Project restructure:** `system/ contracts/ cookbook/ patterns/ components/ workflow/ ingest/`;
  dissolve `bank/`; replace the dated `_audit.md` with a living `_index.md`.

### Resolved decisions (from classification ambiguities A–J)
- **A** pure-universal files (`settings-section`, `form-validation`) → stub-with-link in project.
- **B** foundations value-validation table → split columns (skill: research+defaults; project: Our Value/Status).
- **C** bilingual `{en,vi}` FormGroup → project-only for now.
- **D** record-view 3-layer chassis → lift to skill `patterns/shared-read-view-chassis.md` (**author confirm at task 391**).
- **E** card glass-perf → cross-link the `diagnose-scroll-jank` skill, do not duplicate.
- **F** loading thresholds → skill says "~300ms"; project keeps exact aligned numbers.
- **G** `about-experience` → stays project (low novelty).
- **H** live credentials in `visual-feedback.md` → relocated (task 395).
- **I** `_audit.md` → move dated snapshot to `epic-component-docs-and-ddl.md`; replace with living `_index.md`.
- **J** `ingest`/`review` routing → universal to skill, project to `.context/design/ingest/`.

### Splittability (future phase, out of v1)
`modes/*.md` → `skills/*/SKILL.md` (+ frontmatter); `shared/` unchanged; add
`.claude-plugin/plugin.json`; add a `plugins[]` entry to `tdp-plugins` `marketplace.json`. Commands
become `/design:<mode>`. A hard-gate hook can ship in `hooks/hooks.json` at that point.

## Tasks
- **390** — Scaffold the global `design` skill (structure + router + config + `imported/`)
- **391** — Distill universal knowledge into `shared/` (principles/patterns/taste + index + sources)
- **392** — Restructure project `.context/design/` (buckets, dissolve `bank/`, thin components, `_index.md`)
- **393** — Write the 7 mode docs with the locked core rules
- **394** — Delete old skills + update CLAUDE.md (collapse rows + ambient guardrail)
- **395** — [security] Relocate live credentials out of `visual-feedback.md`

## Out of scope (v1)
- Splitting to a plugin / publishing to the marketplace (future phase).
- Hard-gate hooks (future, plugin-only).

## Status

`completed` — created 2026-07-24; all 6 tasks (390–395) done 2026-07-24 and archived to
`tasks-done/epic-design-skill/`. Epic archived to `plans-done/` via `/ctx:sync`.
