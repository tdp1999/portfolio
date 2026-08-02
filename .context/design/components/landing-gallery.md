---
component: landing-gallery
status: stable
related: [landing-figure]
---

# landing-gallery

> Count-aware curated image grid (1–4 images). Picks the right layout per count so a project with 2 screenshots doesn't render as a half-empty 2×2.

> **Universal kernel:** the count-aware "pick the layout per image count, don't pad with
> filler" rule lives in `→ skill patterns/count-aware-gallery`. This doc keeps the
> `landing-gallery` per-count layouts and the curated slot contract.

## Why this exists

Hardcoded 2×2 grids look broken when projects have fewer than 4 production-ready screenshots — the empty cells either need placeholders (clutter) or hidden treatment (text-only fallback, hides real assets). A count-aware gallery promotes whatever images exist into a layout designed for that count.

## Use when

- Section needs an image grid of 1–4 screenshots/figures (Selected Work tab, project detail teaser, case-study side panel).
- Images are curated and ordered (image-1 is the strongest frame).

## Don't use when

- Archive / lightbox of 5+ images — needs a separate component (pagination, modal, keyboard nav).
- Single hero image inline with body copy → `<landing-figure>` directly.
- Image count is unknown or dynamic-from-user (e.g. blog post embedded media).

## Layouts (per image count)

| Count | Layout                      | Aspect ratios                            | Rationale                                                           |
| ----- | --------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| 1     | Single full-width           | 16:10                                    | One frame deserves the room — no cropping into a square.            |
| 2     | 1×2 split                   | 4:3 each                                 | Equal weight; pacing matters more than primacy.                     |
| 3     | Hero left + 2 stacked right | 4:3 (hero, 2 rows) · 16:9 (each stacked) | Promotes image-1 to a 2-row hero; secondaries are landscape strips. |
| 4     | 2×2                         | 4:3 each                                 | Even cadence; each frame holds equal weight.                        |

Mobile (< 640px): all layouts collapse to a single column, each cell at 16:10.

## Hidden content contract

Authors compose the `images[]` array in this order so the curated layouts read well — **the gallery does not enforce this; the contract lives in this doc and the component header**:

| Slot | Content guidance                                                     | Why                                                               |
| ---- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1    | Primary "money shot" — wide landscape, the strongest single frame    | In Layout-3 it spans 2 rows; in Layout-1 it owns the whole frame. |
| 2    | Secondary detail — UI close-up, supporting landscape, or detail crop | Always equal-or-smaller weight than 1; pairs with 1 in Layout-2.  |
| 3    | Tertiary — different angle (mobile UI, terminal, before/after)       | In Layout-3 it sits below image-2; in Layout-4 it anchors row 2.  |
| 4    | Supporting / atmosphere — team photo, sketch, system diagram         | Optional; only Layout-4 uses it.                                  |

When a project only has 2 strong screenshots, **upload only 2** — don't pad with weak filler to reach 4. The layout will adapt.

## Implementation rules

- Compose `<landing-figure>` per cell — never reimplement frame styling.
- Pass `[aspectRatio]` to `<landing-figure>` (the cropped variant — image fills frame via `object-fit: cover`).
- `[numbered]` defaults to true — captions get `FIG. 0X` numbering.
- Caption falls back to `slug.toUpperCase()` if `image.alt` is empty (consumer-side responsibility, not gallery).
- **Cell width is a measured constant, not a guess.** `gallery.sizing.ts` maps count+index to
  `{ maxCss, sizes }`, and the figure emits a `w`-descriptor srcset from it. The numbers come
  from the browser, not from intuition: the gallery caps at 682 CSS px, so a layout-4 cell is
  256px at 1024, 309px at 1200 and 333px from 1366 up. A flat guess is exactly the bug this
  replaced — `cellWidth` used to be a hardcoded 720, so a retina browser fetched `w_1440` for
  a 333px box, roughly 4.7× the bytes. Re-measure and update the table in `gallery.sizing.ts`
  if the container's max-width changes.
- **`w` descriptors need `sizes`; `1x/2x` does not.** Use `buildCloudinaryWidthSet` + `[sizes]`
  when the element's width changes across breakpoints (grid cells, carousel slides). Use plain
  `buildCloudinarySrcset` only when the element has one fixed width everywhere.
- `[lightbox]` (opt-in, default off) wires each cell to the shared `landing-lightbox`; pass `[lightboxGroup]` so a gallery's cells navigate together. Note: the grid caps at 4 cells, so the lightbox group is the rendered ≤4 — a `landing-carousel` of the same images (e.g. the mobile half of a BP-swap) will show all of them.

## Quality checklist

- [ ] Test all 4 counts in the DDL gallery section before shipping a layout change.
- [ ] Verify mobile collapse (< 640px) — each cell readable.
- [ ] Verify no `::ng-deep` bleed if extending — extend `<landing-figure>` API instead.
- [ ] If adding count=5+, get UX approval first — current contract says use lightbox/route.
