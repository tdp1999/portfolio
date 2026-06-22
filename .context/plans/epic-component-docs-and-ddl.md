# Epic: Component Docs & DDL-as-Canonical-Documentation

> Related: [Initiative: Portfolio](./initiative-portfolio.md) (consumer), but this is **design-system infrastructure** spanning landing **and** console — not a landing-CV sub-epic.
> Status: 🟢 open — research/audit complete 2026-06-22 (see [`_audit.md`](../design/components/_audit.md)). Phases below not yet started.
> Folds in: **task 304** (component bank audit & docs polish) — 304's restructure + audit ACs become Phase 0 here; its remaining doc-polish tails are tracked in the roadmap.
> Scope: **landing + console** (confirmed 2026-06-22). Console DDL (`libs/console/feature-ddl`) is brought to the same registry/skeleton, not deferred.

## Purpose

Make **DDL the single canonical documentation surface** for every component the project ships — landing *and* console/internal — the way shadcn/ui or Tailwind docs work: a consumer can open one page and get everything they need to use a component (what it is, when to use it, import, live demo, API/props, variants, accessibility, do/don't), plus links to the deeper behavior-contract bank doc.

Today three things are out of alignment:
1. **The bank is ~8% covered** (landing) / ~17% (console) / 0% (shared) — see `_audit.md`. Every primitive is undocumented.
2. **DDL is far ahead of the bank but author-generated and unlinked** — ~40 landing showcase pages, content inconsistent, no API tables, no import snippets, no link to the bank. It demos, it doesn't *document*.
3. **Reusable components are trapped in feature/DDL code** — e.g. `ddl-considered` is a generic disclosure; the filter toolbar is duplicated across projects & blog. These should be extracted to shared, then documented once.

This epic closes all three so that DDL = behavior + API + a11y + copy-paste, wired by data to the bank, and lintable.

## Problem — current state (audit 2026-06-22)

Full inventory: [`.context/design/components/_audit.md`](../design/components/_audit.md). Headlines:

| Library | Components | Bank doc | % |
|---|---|---|---|
| `libs/landing/shared/ui` | 72 | 6 | ~8% |
| `libs/console/shared/ui` | 30 | 5 | ~17% |
| `libs/shared/ui` | 9 | 0 | 0% |

Cross-cutting: `segmented-control.md`/`chips/*` are **console** docs mislabeled as covering landing twins; DDL pages don't link the bank and vice-versa; only 8/59 DDL pages have any copy-code; no API-table / import-snippet primitive exists anywhere.

## Locked decisions (2026-06-22)

| Item | Decision |
|---|---|
| End-state | DDL = canonical component doc site (shadcn/Tailwind-grade), the place a consumer learns to use any component, internal or landing |
| Scope | Landing + console both. Console `feature-ddl` adopts the same registry + skeleton |
| Source-of-truth split | **Bank doc** (`.context/design/components/`) = behavior contract + quality checklist (machine/AI-readable, lintable). **DDL page** = consumer-facing rendered doc + live demo. They link both ways via a `bankDoc` registry field |
| Sequencing | Sequential by phase (P0 foundations → P5 sweep). Each component change keeps the DDL=source-of-truth rule: bank doc + DDL page updated in the SAME commit as the code |
| Standard skeleton | Title+status(+**stability** facet) → Overview/When-to-use → Import → Live demo → API/Props table → Variants (copy-code each) → Accessibility → Do/Don't → Related + bank link |
| Lab vs shipped | Exploration content (Prototypes/Considered) must sit behind `decision-record`/`considered`, visibly separated from the consumer doc — stop interleaving research into shipped pages (current chip/segmented practice) |
| Skills | Use `/component-bank` to author bank docs, `/design-check` to validate a component against the bank, `/design-ingest` only when pulling external references |

## Roadmap

Checklist is the contract. Each phase opens its own task file(s) via `/ctx:breakdown` when it starts.

### Phase 0 — Foundations & restructure (absorbs ALL of task 304)
- [x] `_audit.md` written (full inventory: every component + domain + kind primitive/layout/composite + bank-doc?/DDL? + priority + cross-domain twins + extraction list + DDL gap) — **done 2026-06-22**
- [ ] Split `.context/design/components/` into domain subfolders: `landing/`, `console/`, `shared/` (only if genuinely cross-domain — avoid empty folders)
- [ ] Migrate existing docs: `chips/` → `console/chips/`; `segmented-control.md` → `console/segmented-control.md`; landing docs (`card`, `carousel`, `lightbox`, `landing-gallery`, `show-more`) → `landing/`. Verify contents unchanged and any inbound links updated
- [ ] Keep frontmatter `component:` with domain prefix (e.g. `console-segmented-control`) — folder location is the visible signal, frontmatter the machine-readable one
- [ ] Fix mislabels: `landing-segmented` gets its own doc (or a shared twin doc) distinct from `console-segmented-control`; same for `landing-chip` vs console `chip-*`. Note twins explicitly so readers see the parallel + differences
- [ ] **`landing/landing-segmented.md`** — full doc: frontmatter (`component: landing-segmented`, `status: stable`), why-it-exists, use-when, don't-use-when, API table (segments / active model / variant / ariaLabel / idPrefix), variant rules (apple/hairline/underline), keyboard nav, ARIA notes, "shipped from task 280b prototype A"
- [ ] `_index.md` per domain subfolder (one-line hooks, MEMORY.md style). `landing/_index.md` covers at minimum: button, link, icon-arrow, chip, eyebrow, status-dot, figure, pull-quote, section-rule, segmented — entries for not-yet-documented components marked ❌ pending so the gap is visible
- [ ] **Stretch:** stub docs (frontmatter + 1-line) for highest-frequency missing landing primitives: chip, eyebrow, status-dot, figure, pull-quote, section-rule (full bodies fillable later / in Phase 3)
- [ ] Docs-polish tails: `CLAUDE.md` "References"/design section references `landing-typography.md`; `.context/design/landing.md` adds a typography pointer near the top; verify NO dangling links to `chips/` or `segmented-control.md` after the move
- [ ] `chips/_overview.md`: when moved to `console/chips/`, leave a redirect note at top if any landing chip will eventually share rules (currently `landing-chip` is its own visual contract)
- [ ] Define TWO skeleton conventions as short authored convention docs: (a) **bank-doc body** order — Why this exists → Use when → Don't use when → API → Behavior → Accessibility → optional Variants → optional Migration/shipped-from; (b) **DDL consumer-page** skeleton (see Locked decisions). Do NOT write doc bodies for layouts (`main-layout`, `blank-layout`, `long-form-layout`) — mark in audit, defer to a layout-specific task

### Phase 1 — DDL doc-framework primitives
- [ ] Build 5 reusable DDL primitives: `ddl-import`, `ddl-api-table`, `ddl-a11y`, `ddl-do-dont`, `ddl-related`
- [ ] Add `stability` facet (stable/beta/deprecated) to the status chip, distinct from design-lifecycle
- [ ] Add `bankDoc` field to `DdlEntry` (`ddl.registry.ts`) → data-driven DDL↔bank link
- [ ] Refactor a reference page (`ddl-button`) to the full skeleton as the canonical template; document the pattern for authors

### Phase 2 — Extractions (feature/DDL → shared)
- [ ] High-confidence: `landing-disclosure` (from `ddl-considered` + about), `landing-filter-toolbar` (projects/blog dedup), `landing-post-meta` (blog dedup)
- [ ] Med (evaluate, may split to follow-up): `decision-record`, `post-card`, `feed-item`, `stage`, `locale-switcher`
- [ ] Each extraction ships with its bank doc + DDL page in the same commit (DDL=source-of-truth rule)

### Phase 3 — Landing coverage rollout
- [ ] High-priority primitives to bank doc + skeleton DDL page: form family (input/textarea/checkbox/radio/select/form-field), button, icon, link, chip, heading, segmented
- [ ] Med primitives: eyebrow, status-dot, pull-quote, section-rule, figure, image, tooltip
- [ ] Upgrade existing demo-only/partial DDL pages to the skeleton; wire `bankDoc`

### Phase 4 — Console DDL parity
- [ ] Bring `libs/console/feature-ddl` to the same registry + skeleton (or unify on the landing DDL doc primitives where sensible)
- [ ] High-priority console docs: `markdown-editor`, `translatable-group` (+ markdown variant), `section-card` (+ `consoleFormSnapshot`), `ui-sidebar` family (shared)
- [ ] Med: long-form chassis (`long-form-layout`/`scrollspy-rail`/`sticky-save-bar`), media (`asset-grid`/`upload-zone`/`media-picker-dialog`), `filter-bar`, dialogs, pickers
- [ ] Fix cookbook naming nit (`console-media-picker` → `console-media-picker-dialog`)

### Phase 5 — Sweep, lint & guardrail
- [ ] Coverage to target (every shared primitive has bank doc + DDL entry)
- [ ] Lint/guard: every component exported from a shared barrel must have a `bankDoc`-linked DDL entry; dangling-link check on bank↔DDL
- [ ] Final `_audit.md` refresh + close 304's ACs

## Dependencies & relationships
- **Folds task 304** (audit + restructure + landing-segmented doc + docs polish).
- Extraction candidates have real reuse evidence (projects/blog dedup) — Phase 2 reduces duplication, not just docs.
- DDL chrome (registry/shell/TOC/pager/decision-record) is already doc-grade — no rework, only additive primitives.
- Touches `CLAUDE.md` guardrails (DDL=source-of-truth-for-landing-UI already exists; this epic extends it to console + adds the bank-link rule).

## Open questions
- Landing-segmented vs console-segmented-control: **per-domain docs** or **one shared "segmented" doc** covering both twins? (lean per-domain; folder location is the signal). Same question for chip twins.
- Should console DDL reuse the landing DDL doc primitives directly, or get its own copies? (cross-domain component sharing of doc-chrome — decide at Phase 4 start).
- API-table data: hand-authored `DdlApiRow[]` per page, or generated from component input metadata? (start hand-authored; revisit codegen later).

## Change log
- 2026-06-22 — Epic created from task 304 research. 4 parallel audit agents scanned landing/console/shared UI + DDL. `_audit.md` written. Scope confirmed landing+console, sequential phases, DDL-as-canonical-doc end-state. Task 304 folded into Phase 0.
