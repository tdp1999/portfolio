# Task 382: RTE Console — Landing-Accurate Preview

## Status: pending

## Goal
Give console authors a way to see how a rich-text document will render on the
landing site, without leaving the form. Since task 311 swapped the markdown
textarea (which had a preview) for the WYSIWYG RTE, there is no longer a way to
preview the *landing* render — the editor surface uses console tokens/typography,
not landing's.

## Context
Discovered during task 311 (S3 Blog) visual verification: authors lose confidence
because the editing surface is console-styled and there is no "this is what
readers see" view. The RTE is WYSIWYG for *structure*, not for landing *styling*.

The canonical render path is the landing renderer (tasks 312–314) which consumes
`*Html` (sanitized cache) or re-renders from `*Json`. The preview should reuse
that exact render path so it stays truthful as landing styling evolves — not a
second, drifting renderer.

## Open Questions / Options (decide before building)
- **A. Read-only RTE in landing skin** — render the same `EditorDocument` through
  a read-only engine instance wrapped in landing typography tokens. Cheap, but
  risks drift from the real landing renderer.
- **B. Reuse the landing render component** — once 312–314 land, the landing
  prose renderer becomes a shared component the console can mount in a preview
  pane/modal. Truthful by construction; depends on 312–314.
- **C. Server-rendered preview** — hit a BE preview endpoint that returns the
  sanitized `*Html` and display it. Closest to production for SSR'd landing.
- Surface: inline toggle (Edit | Preview) vs side-by-side vs modal/QuickLook
  overlay (we already have a console QuickLook primitive — see memory).

## Acceptance Criteria
- [ ] Author can preview the current editor content rendered with **landing**
      typography/spacing/prose rules (not console styling).
- [ ] Preview uses the same render path as the real landing render (no second
      renderer that can drift) — or, if built before 312–314, is explicitly
      marked provisional and tracked to converge.
- [ ] Works per-locale for bilingual fields (preview EN vs VI).
- [ ] Images / image-ref nodes resolve in preview the same way landing resolves
      them.
- [ ] No engine-boundary violation: console feature libs still never import
      `document-engine-angular` directly.

## Dependencies
- 312/313/314 (landing render swaps) — strongly preferred prerequisite for option B/C.
- 311 (console RTE swap) — done.

## Complexity: M

## Progress Log
- [2026-06-28] Filed from task 311 S3 verification feedback: no landing-accurate
  preview after the markdown textarea (with its preview) was removed.
