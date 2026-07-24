# Epic: Component Docs & DDL-as-Canonical-Documentation

> Related: [Initiative: Portfolio](./initiative-portfolio.md) (consumer), but this is **design-system infrastructure** spanning landing **and** console — not a landing-CV sub-epic.
> Status: 🟢 open — research/audit complete 2026-06-22 (see the [Component Bank Audit appendix](#appendix-component-bank-audit--snapshot-2026-06-22) below). Phases below not yet started.
> Folds in: **task 304** (component bank audit & docs polish) — 304's restructure + audit ACs become Phase 0 here; its remaining doc-polish tails are tracked in the roadmap.
> Scope: **landing + console** (confirmed 2026-06-22). Console DDL (`libs/console/feature-ddl`) is brought to the same registry/skeleton, not deferred.

## Purpose

Make **DDL the single canonical documentation surface** for every component the project ships — landing *and* console/internal — the way shadcn/ui or Tailwind docs work: a consumer can open one page and get everything they need to use a component (what it is, when to use it, import, live demo, API/props, variants, accessibility, do/don't), plus links to the deeper behavior-contract bank doc.

Today three things are out of alignment:
1. **The bank is ~8% covered** (landing) / ~17% (console) / 0% (shared) — see the audit appendix below. Every primitive is undocumented.
2. **DDL is far ahead of the bank but author-generated and unlinked** — ~40 landing showcase pages, content inconsistent, no API tables, no import snippets, no link to the bank. It demos, it doesn't *document*.
3. **Reusable components are trapped in feature/DDL code** — e.g. `ddl-considered` is a generic disclosure; the filter toolbar is duplicated across projects & blog. These should be extracted to shared, then documented once.

This epic closes all three so that DDL = behavior + API + a11y + copy-paste, wired by data to the bank, and lintable.

## Problem — current state (audit 2026-06-22)

Full inventory: see the [Component Bank Audit appendix](#appendix-component-bank-audit--snapshot-2026-06-22) below. Headlines:

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
| Skills | Use `/design document` to author bank docs, `/design review` to validate a component against the bank, `/design ingest` only when pulling external references |

## Roadmap

Checklist is the contract. Each phase opens its own task file(s) via `/ctx:breakdown` when it starts.

### Phase 0 — Foundations & restructure (absorbs ALL of task 304)
- [x] Full audit inventory written (every component + domain + kind primitive/layout/composite + bank-doc?/DDL? + priority + cross-domain twins + extraction list + DDL gap) — **done 2026-06-22**; snapshot preserved in the [audit appendix](#appendix-component-bank-audit--snapshot-2026-06-22) below
- [ ] Split `.context/design/components/` into domain subfolders: `landing/`, `console/`, `shared/` (only if genuinely cross-domain — avoid empty folders)
- [ ] Migrate existing docs: `chips/` → `console/chips/`; `segmented-control.md` → `console/segmented-control.md`; landing docs (`card`, `carousel`, `lightbox`, `landing-gallery`, `show-more`) → `landing/`. Verify contents unchanged and any inbound links updated
- [ ] Keep frontmatter `component:` with domain prefix (e.g. `console-segmented-control`) — folder location is the visible signal, frontmatter the machine-readable one
- [ ] Fix mislabels: `landing-segmented` gets its own doc (or a shared twin doc) distinct from `console-segmented-control`; same for `landing-chip` vs console `chip-*`. Note twins explicitly so readers see the parallel + differences
- [ ] **`landing/landing-segmented.md`** — full doc: frontmatter (`component: landing-segmented`, `status: stable`), why-it-exists, use-when, don't-use-when, API table (segments / active model / variant / ariaLabel / idPrefix), variant rules (apple/hairline/underline), keyboard nav, ARIA notes, "shipped from task 280b prototype A"
- [ ] `_index.md` per domain subfolder (one-line hooks, MEMORY.md style). `landing/_index.md` covers at minimum: button, link, icon-arrow, chip, eyebrow, status-dot, figure, pull-quote, section-rule, segmented — entries for not-yet-documented components marked ❌ pending so the gap is visible
- [ ] **Stretch:** stub docs (frontmatter + 1-line) for highest-frequency missing landing primitives: chip, eyebrow, status-dot, figure, pull-quote, section-rule (full bodies fillable later / in Phase 3)
- [ ] Docs-polish tails: `CLAUDE.md` "References"/design section references `landing-typography.md`; `.context/design/system/landing.md` adds a typography pointer near the top; verify NO dangling links to `chips/` or `segmented-control.md` after the move
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
- [ ] Final audit-snapshot refresh (record a fresh dated snapshot in the appendix) + close 304's ACs

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
- 2026-06-22 — Epic created from task 304 research. 4 parallel audit agents scanned landing/console/shared UI + DDL. Audit inventory written. Scope confirmed landing+console, sequential phases, DDL-as-canonical-doc end-state. Task 304 folded into Phase 0.
- 2026-07-24 — Design-skill restructure: the standalone `.context/design/components/_audit.md` was a dated snapshot living in the design bank (violates the timeless-guidance rule). Its inventory is relocated verbatim into the appendix below; the bank now carries only a living `components/_index.md` registry.

---

## Appendix: Component Bank Audit — snapshot 2026-06-22

> Dated inventory relocated here from `.context/design/components/_audit.md` (design-skill
> restructure, 2026-07-24). This is a point-in-time snapshot — re-run the scan and record a
> fresh snapshot here when the numbers materially change; the living per-component registry
> is `.context/design/components/_index.md`.
>
> **Legend:** Bank doc = a file under `.context/design/components/`. In DDL = a `ddl-*` showcase page (landing) or coverage in `libs/console/feature-ddl` (console). Priority = doc-writing priority (high = reused primitive with non-obvious rules; low = layout/one-off/util).

### Headline numbers

| Library | Components | Bank doc | % | Biggest gap |
|---|---|---|---|---|
| `libs/landing/shared/ui` | 72 | 6 | **~8%** | every primitive (button/icon/link/chip/heading + whole form family) undocumented |
| `libs/console/shared/ui` | 30 | 5 | **~17%** | markdown-editor, translatable-group(+markdown), section-card(+`consoleFormSnapshot`) |
| `libs/shared/ui` | 9 | 0 | **0%** | `ui-sidebar` family (multi-part, shadcn-style, zero docs) |

**Cross-cutting findings**
- `segmented-control.md` frontmatter is `component: console-segmented-control` → **`landing-segmented` is effectively undocumented** (the doc is its console twin).
- `chips/*` docs are all `console-*` → **`landing-chip` / `landing-filter-chip` undocumented** (twins).
- DDL has ~40 landing showcase pages vs 6 bank docs: **DDL is far ahead of the bank**, but its content is author-generated and **not linked to / synced with** the bank. Closing this is the epic's core.
- `about-experience.md` + `brand-motif.md` document landing **feature** composites NOT exported from the shared barrel → excluded from the 72 count, flagged so they aren't mistaken for shared coverage.

### Landing — `libs/landing/shared/ui/` (6 / 72 documented)

**Documented (6)**
| Component | Kind | Bank doc | Notes |
|---|---|---|---|
| `landing-card` | composite | `card.md` | |
| `landing-carousel` (+ `[landingCarouselSlide]`) | composite | `carousel.md` | |
| `landing-gallery` | composite | `landing-gallery.md` | |
| `landing-lightbox` (+ overlay, `[lightbox]`) | composite | `lightbox.md` | |
| `landing-show-more` | composite | `show-more.md` | |
| `landing-segmented` | composite | ❌ — `segmented-control.md` is the **console** twin | high-priority: needs its own/shared doc |

**Primitives — HIGH priority gap (all undocumented):** `landing-button` (ddl-button, CVA-style, most-used), `landing-icon` (+ `landing-icon-arrow`), `landing-link` (core nav primitive), `landing-chip` (twin of console `chip-*`), `landing-heading` (typography primitive), `landing-input` / `landing-textarea` / `landing-checkbox` / `landing-radio(-group)` / `landing-select` / `landing-form-field` (form family). MED: `landing-eyebrow`, `landing-status-dot`, `landing-pull-quote`, `landing-section-rule`, `landing-figure`, `landing-image` (responsive-image primitive), `landing-tooltip`, `landing-t` (i18n). LOW: `landing-status-chip`, `landing-emphasis-text`, `landing-loading-spinner`, `landing-empty-state`.

**Layout / containers — LOW:** `landing-container`, `landing-section`, `landing-content-section`, `landing-section-header`, `landing-page-hero`, `landing-page-shell`, `landing-background`, `landing-browser-window`.

**Composites — MED (non-obvious behavior):** `landing-mega-menu`, `landing-command-palette` (uses keyboard service), `landing-pagination`, `landing-filter-chip` (twin of `chip-select`/`chip-boolean`). LOW: `landing-results-count`, `landing-view-toggle`, `landing-load-more`, `landing-social-row`, `landing-back-link`, `landing-breadcrumb`, `landing-globe` (heavy canvas/WebGL).

**In-page nav family — MED:** `landing-toc-sidebar`, `landing-toc-inline`, `landing-section-dots`, `landing-floating-pill-nav`, `landing-reading-progress`, `landing-router-progress`.

**Shell family — LOW:** `landing-shell`, `landing-header`, `landing-footer-banner`, `landing-footer-signature`, `landing-scroll-to-top`.

**Theme / directives / motion — LOW (behavior-only):** Theme `landing-theme-toggle`; directives `[landingCopyToClipboard]`, `[landingProseAnchors]`, `[landingScrollEdgeFade]`, `[hydrationSafeActive]` (SSR-critical, documented in `landing-ssr.md`), `KeyboardShortcutsDirective`/`KeyboardShortcutService`; motion `[fxSpotlight]`, `[fxTypeOut]`, `landing-stagger-text`; non-component exports `CloudinarySrcsetPipe`, `locale`, `theme` service.

### Console — `libs/console/shared/ui/` (5 / 30 documented)

**Documented (5):** `console-chip-boolean`, `console-chip-select`, `console-chip-toggle-group` (`chips/` family + `_overview.md`), `console-segmented-control` (`segmented-control.md`).

**HIGH priority undocumented:** `console-markdown-editor` (TipTap-based; complex), `console-translatable-group` (`/ddl/long-form`; i18n field group), `console-translatable-markdown-group` (sibling + markdown-editor), `console-section-card` (+ `[consoleFormSnapshot]`; long-form chassis primitive).

**MED priority undocumented:** `console-long-form-layout` (ADR-013/014 chassis), `console-scrollspy-rail`, `console-sticky-save-bar`, `console-asset-grid`, `console-asset-upload-zone` (+ `console-upload-row`), `console-filter-bar` (+ `console-filter-search`, `console-filter-select`), `console-media-picker-dialog` (+ `console-recently-used-strip`; cookbook mis-names it `console-media-picker`), `console-confirm-dialog`, `console-month-year-picker`, `console-time-picker`, `console-toast-container` (+ `ToastService`).

**LOW priority:** `console-asset-filter-bar`, `console-timezone-picker`, `console-skeleton` (+ table/row; in `loading.md`), `console-spinner` (+ full-page/overlay + `SpinnerService`; `loading.md`), `console-loading-bar` (`loading.md`), `console-relative-time` (`loading.md`), `console-error-message`, `console-blank-layout`, `console-main-layout`, `enum-label` pipe, `rx/with-list-loading` (RxJS helper — exclude from visual bank).

### Shared — `libs/shared/ui/` (0 / 9 documented)

| Artifact | Kind | Priority | Notes |
|---|---|---|---|
| `ui-sidebar` family | composite + 7 directives | **high** | `ui-sidebar`, `-provider/-header/-content/-footer/-group/-rail/-inset/-trigger/-menu-sub` + `uiSidebarMenu/MenuItem/MenuSubItem/MenuBadge/MenuSkeleton/Separator`. Largest undocumented surface; used by `console-main-layout`. |
| pipes (`isImage`, `mimeCategory`, `cloudinaryThumb`, `dateRange`, `initials`, `readableSize`, `translatable`, `fileIcon`, `monthYear`) | util-pipe | low | `libs/shared/ui/pipes` |
| `styles` (tokens/themes/base/material) | non-component | n/a | documented via cookbook/scale-contract |

### Extraction candidates — code that should move to shared

> Feature/DDL code that should become a reusable shared component. High-confidence rows have real duplication evidence.

| Candidate | Lives now | Why extract | Target | Effort | Conf |
|---|---|---|---|---|---|
| `landing-disclosure` (detail/summary) | `ddl-considered/*` + raw `<details>` at `about.experience.html:189-202` | `ddl-considered` template is literally a generic `<details>` disclosure; same pattern hand-rolled in about | `…/ui/src/components/disclosure` | S | **high** |
| `landing-filter-toolbar` | `projects.html:8-75` **and** `blog.list.html:233-270` (DDL prototype: `ddl-feed-filter-bar`) | results-count + view-toggle + collapsible filter-chip panel + `filtersOpen/clearAll/activeFilterCount` duplicated in both features | `…/components/filter-toolbar` | M | **high** |
| `landing-post-meta` | `blog.list.html` (~63, 302, 337) + `blog.detail.html` (~28) | time + separator + category strip repeated 4+ times | `…/components/post-meta` | S | **high** |
| `landing-decision-record` | `ddl-decision-record/*` | standardized verdict block; DDL-only, no shared equivalent | `…/components/decision-record` | M | med |
| `landing-post-card` (row+grid) | `blog.list.html` + `projects.html` | row/grid list-item cards near-identical across both | `…/components/post-card` | M | med |
| `landing-command-palette` (promote) | already `…/command-palette` in shared barrel; `ddl-command-palette` is the demo | confirm: production version exists; DDL is showcase — **not an extraction**, a doc target | — | — | n/a |
| `landing-feed-item` | `ddl-feed-item/*` | timeline/feed entry; overlaps post-card — evaluate together | `…/components/feed-item` | S | med |
| `landing-stage` | `ddl-stage/*` | "expand to full-viewport preview" behavior; reusable | `…/components/stage` | M | med |
| `landing-locale-switcher` | `ddl-language-switcher/*` (6 variants) | i18n control once locale switch wires up | `…/components/locale-switcher` | M | low |

**False candidate:** `ddl-scroll-edge-fade` — production version already exists as `…/directives/scroll-edge-fade/`; DDL page is just its demo.

### DDL gap summary (vs a real doc site like shadcn/Tailwind)

**Already doc-grade (no rework):** registry-as-source-of-truth (`ddl.registry.ts` → sidebar/badges/pager/Reference-vs-Lab split), app-shell, grouped sidebar, auto-TOC, status chip, prev/next pager, `decision-record` + `considered` lab primitives.

**Missing (the content contract):**
1. No **API/Props table** primitive — inputs appear as prose/bullets or not at all (biggest gap).
2. No **Import/Install snippet** — no page shows the import path/selector to copy.
3. **Copy-code rare** — only 8/59 pages pass `[code]`, one snippet each; carousel/lightbox have none.
4. **Disconnected from the bank** — no DDL page links to `.context/design/components/` and vice-versa.
5. **No consumer-API stability facet** — status chip tracks design lifecycle, not consume-ability (stable/beta/deprecated).
6. **Inconsistent section order/vocabulary** — research ("Prototypes") interleaved with consumer docs on the same page.
7. **No standard Accessibility section** and **no Do/Don't** primitive.

**Proposed standard skeleton** (Component page): Title+status(+stability) → Overview/When-to-use → **Import** → Live demo → **API/Props table** → Variants (copy-code each) → Accessibility → Do/Don't → Related + **bank-doc link**.
**5 new DDL primitives** to support it: `ddl-import`, `ddl-api-table`, `ddl-a11y`, `ddl-do-dont`, `ddl-related`. **2 data changes:** `stability` facet on status chip + `bankDoc` field on `DdlEntry` (data-driven DDL↔bank link).
