/**
 * Per-cell rendered widths for the four curated gallery layouts.
 *
 * These are MEASURED, not guessed. The gallery's container caps at 682 CSS px
 * (Chromium, landing home, Selected Work right column), so with the 16px grid gap:
 *
 * | viewport | gallery | layout-4 cell |
 * |----------|---------|---------------|
 * | 1024     | 528     | 256           |
 * | 1200     | 634     | 309           |
 * | 1366+    | 682     | 333 (capped)  |
 *
 * `maxCss` is that cap rounded up to a round number; `sizes` describes the ramp
 * below it so the browser picks a smaller rung on a narrower laptop. The previous
 * code declared a flat 720 for layouts 2–4 and 960 for layout-1, which is why a
 * 333px cell was being handed a 1440px file.
 *
 * Below `laptop` the grid collapses to one column (see gallery.scss), so the last
 * `sizes` clause is `100vw`.
 */
export interface GalleryCellSizing {
  /** Widest this cell is ever laid out at, in CSS px. */
  readonly maxCss: number;
  /** `sizes` attribute describing the cell width per viewport band. */
  readonly sizes: string;
}

const FULL: GalleryCellSizing = {
  maxCss: 700,
  sizes: '(min-width: 1366px) 690px, (min-width: 64rem) 56vw, 100vw',
};

const HALF: GalleryCellSizing = {
  maxCss: 340,
  sizes: '(min-width: 1366px) 340px, (min-width: 64rem) 27vw, 100vw',
};

const HERO_OF_THREE: GalleryCellSizing = {
  maxCss: 410,
  sizes: '(min-width: 1366px) 400px, (min-width: 64rem) 33vw, 100vw',
};

const SIDE_OF_THREE: GalleryCellSizing = {
  maxCss: 280,
  sizes: '(min-width: 1366px) 270px, (min-width: 64rem) 22vw, 100vw',
};

/**
 * Sizing for cell `index` in a gallery of `count` images. Mirrors the grid areas in
 * `gallery.scss`: layout-3 promotes cell 1 to a two-row hero at 3fr against 2fr.
 */
export function cellSizing(count: 1 | 2 | 3 | 4, index: number): GalleryCellSizing {
  if (count === 1) return FULL;
  if (count === 3) return index === 0 ? HERO_OF_THREE : SIDE_OF_THREE;
  return HALF;
}
