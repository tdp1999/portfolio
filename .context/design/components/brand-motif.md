---
component: brand-motif
family: brand
status: stable
related: [brand-monogram, brand-wordmark, brand-signature]
---

# brand-motif

> The Brand's decoration layer — a lines-only blueprint grid derived from the brand's
> structure, painted as a full-bleed background behind a mark.

## Why this exists

The identity needs an *ambient* surface, not just marks. The chosen direction (A · lines-only)
came out of a two-round review: every dot-bearing motif (dot-field, halftone) read as a second,
clashing system because a field dot is never the same size/rhythm as the mark's accent **Dot** —
"nothing blends". Removing dots entirely resolves it: the motif is pure structure, so the mark's
Dot is always the only circle on the canvas and always reads as the special atom.

## Use when

- A surface needs subtle brand texture behind a mark (asset backgrounds — OG; future product /
  console sections that have no other decoration system).
- You want a recolourable, theme-aware grid that costs nothing (pure CSS) and never steals focus.

## Don't use when

- On the **landing site**. Landing owns a richer decoration system (`landing-background`: blueprint
  perspective grid, dots, hatch, topo, crosshair, aurora). Use that there — do not stack `brand-motif`
  on top, it duplicates and competes.
- As a foreground element, divider, or anything that must respond to pointer input (it is inert).

## Behavior contract

- **Inert background layer.** Fills its nearest positioned ancestor (absolute, inset 0),
  `pointer-events: none`, `aria-hidden` — never focusable, never in the a11y tree, never intercepts clicks.
- **No circles.** The motif renders grid lines only. The **Dot is reserved exclusively for the mark** —
  this is the load-bearing rule; a motif that paints dots breaks the blend and must not ship.
- **Themeable.** Line colour follows the accent (defaults to the inherited brand accent); it recolours
  with the live accent and inverts correctly across light/dark surfaces.
- **Density is tunable, identity is not.** Cell size and opacity are adjustable; the "lines-only,
  Dot-free" nature is fixed.

## Implementation guide

Portable across stacks; in this repo it's `<brand-motif>` in `libs/shared/features/brand`.

- **Two render paths, one source of truth.** Web = a CSS-gradient grid (two `linear-gradient`s at the
  cell size) so it needs no SVG `id` and is safe to repeat many times on one page. Assets = the
  `motifSvg(w, h, opts)` builder (a tiled `<pattern>`) rasterized by the generator. Both read the shared
  `MOTIF` token (cell / stroke / opacity) so they render identically — never fork the numbers.
- **Colour.** Drive the line colour from one accent variable at a low alpha (token default ~0.13). The
  surface shows through; do not bake the surface colour into the motif.
- **Placement.** The consumer provides a `position: relative` (or `isolate`) host; the motif fills it.
  It must not set its own size or margins.
- **Keep the Dot out.** Any contributor extending the motif (denser grid, secondary lines, accents) must
  preserve the no-circle rule — see *Why this exists*.

## Quality checklist

- [ ] Renders zero circles/dots — only lines.
- [ ] `pointer-events: none` and `aria-hidden` set; not focusable.
- [ ] Recolours with the live accent and is legible (subtle, not invisible) on both light and dark surfaces.
- [ ] Cell + opacity come from the shared `MOTIF` token, not hard-coded per call-site.
- [ ] Not used on a landing-site surface that already has `landing-background`.
- [ ] The mark placed over it still has the visually dominant — and only — Dot.

## See also

- Spec & decision history: `.context/plans/epic-portfolio-brand-identity.md` (Phase 3 · motif).
- Landing's separate decoration system: `landing-background` (`libs/landing/shared/ui`).
- Sibling marks: `brand-monogram`, `brand-wordmark`, `brand-signature`, `brand-loader`.
