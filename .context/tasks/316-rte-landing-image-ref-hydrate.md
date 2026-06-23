# Task: Landing — Hydrate `image-ref` Blocks via `landing-figure`

## Status: pending

## Goal
Teach the renderer to recognize `<figure data-block="image-ref" data-image-id="...">` and render through the existing `landing-figure` component (responsive `<picture>` + caption).

## Context
The HTML cache stores the semantic figure with `data-image-id`. At render time, landing must resolve the Media metadata and render via the project's `landing-figure` primitive — not the raw `<img>` from the editor. This keeps responsive image and caption styling consistent with the moodboard.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 7.

## Acceptance Criteria
- [ ] `<rte-render-html>` (or a sibling component) walks the HTML and replaces every `<figure data-block="image-ref">` with `<landing-figure>` instances. Implementation: post-render DOM transform inside the component, OR an Angular structural pattern using `[innerHTML]` + a directive that scans descendants — pick the simpler approach.
- [ ] Media metadata (URL variants, alt, dimensions, caption) is resolved via the existing landing data-access — single API call batched per page.
- [ ] If `Media` row deleted: renderer falls back to broken-image placeholder + the original alt text (per epic risk row).
- [ ] SSR-safe: the transform runs on both server and client; first paint includes the fully-hydrated `landing-figure`.
- [ ] Image-ref scope confirmed: only used in `Project.body` and `BlogPost.content` reads (other fields don't trigger this code path).
- [ ] Visual: figure caption uses mono caps `FIG. 0X · CAPTION` per E4 typography rules. Numbering computed per-page (1, 2, 3...).

## Technical Notes
- Two implementation strategies:
  1. **String transform pre-bind**: parse HTML on the server before binding, replace `<figure data-block="image-ref">` with rendered `<landing-figure>` HTML. Loses Angular bindings inside but is SSR-trivial.
  2. **DOM walk after render**: bind raw HTML, then in `afterNextRender` walk `[data-block="image-ref"]` and render `<landing-figure>` via `ViewContainerRef.createComponent`. Preserves Angular lifecycle but has hydration mismatch risk.
  - Recommend strategy 1 for SSR simplicity. Justify if picking 2.
- Caption numbering: scoped to the rendered HTML root, not page-global. Use `IntersectionObserver`-free counter at render time.

## Files to Touch
- `libs/shared/features/rte-renderer/**` (new transform pass)
- `libs/landing/shared/ui/figure/**` (no change expected; verify selector + signal inputs match)
- `libs/landing/data-access/**` (batch media metadata fetch)

## Dependencies
- 308-rte-renderer-lib
- 315-rte-image-ref-mediapicker

## Complexity: M

## Progress Log
