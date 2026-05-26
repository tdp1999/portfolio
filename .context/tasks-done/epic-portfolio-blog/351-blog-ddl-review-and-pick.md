# Task: DDL review — Phuong picks list + detail winner + featured treatment

## Status: done

## Goal
Capture the winning list variant (A / B / C), winning detail variant (1 / 2 / 3), and featured-posts treatment (α filter chip / β tab) chosen after side-by-side DDL comparison.

## Context
Per `epic-portfolio-blog.md` — this is a non-code gate task. The DDL variant pages (tasks 349 + 350) exist precisely to support this conversation. No production code changes here; the outcome is a recorded decision that drives tasks 352, 353, 354.

## Acceptance Criteria
- [ ] DDL review session held with Phuong on `/ddl/blog-list-variants` and `/ddl/blog-detail-variants`.
- [ ] List winner recorded (A, B, or C) — written into this task's Progress Log AND into a brief decision in `.context/decisions.md`.
- [ ] Detail winner recorded (1, 2, or 3) — same.
- [ ] Featured treatment recorded (α or β) — same.
- [ ] Any modifications/tweaks captured (e.g. "Variant A with B's year-grouping merged in" is a legitimate outcome — document precisely).
- [ ] Per project memory rule `feedback_ddl_keep_after_graduate`: both DDL pages stay in `DDL_SUBROUTES` after this — do not propose removal.
- [ ] Tasks 352 and 353 updated with the chosen variant name (replace TBD placeholders) so the implementer has zero ambiguity.
- [ ] If any DDL feedback uncovers a missed requirement (e.g. "we also need X"), file as a separate follow-up task — do NOT pollute the graduation tasks with new scope.

## Technical Notes
- This task has **no files to write directly**. Outputs: decision log entry + progress log update + task-352/353 placeholder replacements.
- Decision log entry format (in `.context/decisions.md`):
  ```
  ## YYYY-MM-DD — Blog page list + detail variants
  - List winner: Variant <X> (<name>). Rationale: ...
  - Detail winner: Variant <N> (<name>). Rationale: ...
  - Featured treatment: <α | β>. Rationale: ...
  - DDL pages kept at /ddl/blog-list-variants and /ddl/blog-detail-variants.
  ```
- Do not over-engineer rationale — 1-2 sentences per pick is enough.

## Files to Touch
- `.context/decisions.md` (append decision)
- `.context/tasks/352-blog-graduate-list-winner.md` (replace TBD placeholders)
- `.context/tasks/353-blog-graduate-detail-winner.md` (replace TBD placeholders)
- This file's Progress Log

## Dependencies
- 349 (list DDL must exist for review)
- 350 (detail DDL must exist for review)

## Complexity: S

## Progress Log

### 2026-05-25 — Featured strip winner (partial)
- DDL `/ddl/blog-list-variants` reviewed against the new V1/V2/V3 magazine variants
  (the page was rebuilt during the 2026-05-24 pivot from the morning A/B/C +
  afternoon V1-V4 rounds — those are kept under Prototypes → Historical).
- **Featured strip layout chosen: V1 + V3 hybrid, switched by featured-post count.**
  - **3-4 posts → V3** (top hero + 2-3 archive cards, archive grid spans full
    container width at counts ≤ 2).
  - **5+ posts → V1** (center hero + 4 side cards).
  - V2 (left-anchored asymmetric editorial) NOT chosen — retained on the DDL page
    per the DDL-keep-after-graduate rule.
- DDL page updated: chosen banner under the intro, per-variant "chosen / not chosen"
  pills next to each eyebrow.
- Featured-strip vertical budget formalised at **~800-900px** (was loosely
  ~900-1200px hero+strip). DDL copy + variant grid heights now reflect this.
- Detail winner blocked on task 350 (detail variant DDL) — still pending. This
  task stays open until 350 ships and detail review happens.

### 2026-05-25 — Task 350 shipped
- `/ddl/blog-detail-variants` now exists. Three variants (Editorial banner ·
  Dan minimal · Sticky meta rail) staged side-by-side against the seeded deep-dive
  post + the seeded note (for V1's auto-hide-TOC branch).
- Ready for the detail-winner review pass.

### 2026-05-25 — Detail winner picked + V4 staged
- **Detail layout chosen: V4 (new) — center hero + far-right floating TOC.**
  - Hero: V1's centered treatment (eyebrow chips → title → dek → meta strip),
    cover image rendered as a magazine `<figure>` below the meta.
  - TOC: V3's `<landing-toc-sidebar>` (with scrollspy wiring) but anchored
    `position: fixed; top: 96px; right: 24px; width: 220px` — pinned to the
    far right of the viewport, OUTSIDE the article container. Distinct from
    `/projects` which keeps TOC inside the 2-col article grid.
  - Mobile (<1280px): floating TOC hides, the V1-style inline top-of-prose
    TOC card appears in its place.
  - Share: shared `<landing-blog-share-row>` (X intent · LinkedIn share-offsite
    · `landingCopyToClipboard` copy-link) sits in the article footer alongside
    related posts + JSON-LD payload `<details>`.
  - V4 added as the first/default tab on the DDL with a "chosen" pill on the
    eyebrow; V1/V2/V3 retained per the DDL-keep-after-graduate rule.
- DDL bugs fixed in the same pass: V2 article centered (`margin-inline: auto`),
  V3 rail overlap resolved (override `landing-toc-sidebar` host sticky inside
  the `.v3-rail__inner` flex column), variants moved into separate tabs (fixes
  the auto-scroll caused by V3's sticky pulling hidden rail into viewport
  when V1's prose IDs collided across stacked variants).
- Prose styling switched from a hand-written 80-line block to the canonical
  `.landing-prose` global class (+ `landingProseAnchors` directive) — matches
  the pattern used by `project-detail`.

### 2026-05-25 — Task closed: ADR-018 logged + 352/353 placeholders replaced
- **Featured treatment chosen: Treatment γ (bento strip, no archive filter).**
  - Pre-pivot α (filter chip) and β (tab) both rejected — the 2026-05-24 afternoon
    pivot replaced the magazine-style featured hero with a hero + bento-strip +
    archive-list layout. The bento strip already does the surfacing job α/β were
    designed for, so no `Featured only` chip or `All / Featured` tab in the
    archive toolbar.
  - URL param `?featured=1` is **not** wired in v1; filter-shape extension point
    is left open per the pivot rule "shape must be extensible".
- ADR-018 added to `.context/decisions.md` capturing all three picks (list V1+V3
  hybrid, detail V4, featured γ) with rationale + implementation notes lifted
  from the DDL fixes (floating-TOC override, signature block, sectionCount
  threshold, etc.).
- Tasks 352 + 353 placeholder lines replaced with concrete variant names +
  implementation notes so the graduator has zero ambiguity. Both ACs tightened:
  task 352 strips "Featured treatment α/β" wording; task 353 collapses three
  variant-switch ACs into a single V4 spec + mobile fallback.
- DDL pages stay at `/ddl/blog-list-variants` and `/ddl/blog-detail-variants`
  per `feedback_ddl_keep_after_graduate`.
- Task closed.
