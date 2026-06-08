/**
 * Master — the single source of SVG truth for the Brand.
 *
 * Pure, framework-agnostic builders that render the Monogram / Wordmark / Signature
 * as standalone SVG **strings** from the locked Newsreader-500 outline data. The
 * Angular components render the same glyphs via templates for the live web; these
 * builders exist so the **generator skill** (Phase 2) can rasterize assets
 * (favicon / OG / email signature) deterministically — no browser, no AI raster.
 *
 * Standalone SVG cannot inherit `currentColor` from CSS, so the foreground (`ink`)
 * is resolved to an explicit colour here. `variant` follows the components: it only
 * recolours the Dot (`full` → accent, `mono`/`knockout` → ink); `background` and
 * `padding` (clearspace) are asset-composition concerns the caller controls.
 */
import { TDP_BRAND } from './brand.config';
import type { BrandVariant } from './brand.types';
import {
  DOT,
  MONOGRAM_GLYPHS,
  MONOGRAM_VIEWBOX,
  WORDMARK_DOT,
  WORDMARK_GLYPHS,
  WORDMARK_VIEWBOX,
} from './glyph-outlines.data';

export interface MarkRenderOptions {
  /** Render mode — only affects the Dot colour (matches `<brand-monogram>`). */
  variant?: BrandVariant;
  /** Foreground colour resolving `currentColor` (glyph fill). */
  ink?: string;
  /** Dot / accent colour (used when `variant === 'full'`). */
  accent?: string;
  /** Surface rect behind the mark; `null`/omitted = transparent. */
  background?: string | null;
  /** Clearspace around the mark, in viewBox user units. */
  padding?: number;
}

export interface SignatureRenderOptions extends MarkRenderOptions {
  layout?: 'horizontal' | 'stacked';
}

const DEFAULT_INK = '#0a0d12';

/** Parse a `'minX minY w h'` viewBox into numbers. */
function parseViewBox(vb: string): { x: number; y: number; w: number; h: number } {
  const [x, y, w, h] = vb.split(/\s+/).map(Number);
  return { x, y, w, h };
}

/** Grow a viewBox outward by `padding` on every side. */
function padViewBox(vb: string, padding: number): string {
  const { x, y, w, h } = parseViewBox(vb);
  return `${x - padding} ${y - padding} ${w + padding * 2} ${h + padding * 2}`;
}

function backgroundRect(vb: string, fill: string | null | undefined): string {
  if (!fill) return '';
  const { x, y, w, h } = parseViewBox(vb);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" />`;
}

function glyphPaths(glyphs: readonly string[], ink: string): string {
  return `<g fill="${ink}">${glyphs
    .filter(Boolean)
    .map((d) => `<path d="${d}" />`)
    .join('')}</g>`;
}

/** The Monogram (`tdp.`) — primary mark, Dot included. */
export function monogramSvg(options: MarkRenderOptions = {}): string {
  const {
    variant = 'full',
    ink = DEFAULT_INK,
    accent = TDP_BRAND.theme.accent,
    background = null,
    padding = 0,
  } = options;
  const vb = padViewBox(MONOGRAM_VIEWBOX, padding);
  const dotFill = variant === 'full' ? accent : ink;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none">`,
    backgroundRect(vb, background),
    glyphPaths(MONOGRAM_GLYPHS, ink),
    `<circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dotFill}" />`,
    `</svg>`,
  ].join('');
}

/** The Wordmark (`Phuong Tran.`) — secondary mark, closed by the accent Dot. */
export function wordmarkSvg(options: MarkRenderOptions = {}): string {
  const {
    variant = 'full',
    ink = DEFAULT_INK,
    accent = TDP_BRAND.theme.accent,
    background = null,
    padding = 0,
  } = options;
  const vb = padViewBox(WORDMARK_VIEWBOX, padding);
  const dotFill = variant === 'full' ? accent : ink;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none">`,
    backgroundRect(vb, background),
    glyphPaths(WORDMARK_GLYPHS, ink),
    `<circle cx="${WORDMARK_DOT.cx}" cy="${WORDMARK_DOT.cy}" r="${WORDMARK_DOT.r}" fill="${dotFill}" />`,
    `</svg>`,
  ].join('');
}

/**
 * The Signature — locked lockup of Monogram + Wordmark. Composed via nested `<svg>`
 * so each mark keeps its own aspect ratio. Monogram is rendered 1.6× the Wordmark
 * height (mirrors the component's `font-size` ratio).
 */
export function signatureSvg(options: SignatureRenderOptions = {}): string {
  const {
    variant = 'full',
    ink = DEFAULT_INK,
    accent = TDP_BRAND.theme.accent,
    background = null,
    padding = 0,
    layout = 'horizontal',
  } = options;

  const mono = parseViewBox(MONOGRAM_VIEWBOX);
  const word = parseViewBox(WORDMARK_VIEWBOX);

  const WORD_H = 100;
  const MONO_H = 160; // 1.6× — matches `.sig__mono { font-size: 1.6em }`
  const GAP = 44;

  const monoW = (mono.w / mono.h) * MONO_H;
  const wordW = (word.w / word.h) * WORD_H;

  const inner = (vb: string, x: number, y: number, w: number, h: number, body: string): string =>
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" fill="none">${body}</svg>`;

  const dotFill = variant === 'full' ? accent : ink;
  const monoBody = `${glyphPaths(MONOGRAM_GLYPHS, ink)}<circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${dotFill}" />`;
  const wordBody = `${glyphPaths(WORDMARK_GLYPHS, ink)}<circle cx="${WORDMARK_DOT.cx}" cy="${WORDMARK_DOT.cy}" r="${WORDMARK_DOT.r}" fill="${dotFill}" />`;

  let canvasW: number;
  let canvasH: number;
  let monoX: number;
  let monoY: number;
  let wordX: number;
  let wordY: number;

  if (layout === 'stacked') {
    canvasW = Math.max(monoW, wordW);
    canvasH = MONO_H + GAP + WORD_H;
    monoX = (canvasW - monoW) / 2;
    monoY = 0;
    wordX = (canvasW - wordW) / 2;
    wordY = MONO_H + GAP;
  } else {
    canvasW = monoW + GAP + wordW;
    canvasH = MONO_H;
    monoX = 0;
    monoY = 0;
    wordX = monoW + GAP;
    wordY = (MONO_H - WORD_H) / 2;
  }

  const vb = `${-padding} ${-padding} ${canvasW + padding * 2} ${canvasH + padding * 2}`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="none">`,
    backgroundRect(vb, background),
    inner(MONOGRAM_VIEWBOX, monoX, monoY, monoW, MONO_H, monoBody),
    inner(WORDMARK_VIEWBOX, wordX, wordY, wordW, WORD_H, wordBody),
    `</svg>`,
  ].join('');
}

/** Convenience: build any mark by name (the skill dispatches on this). */
export type MarkName = 'monogram' | 'wordmark' | 'signature';

export function masterSvg(mark: MarkName, options: SignatureRenderOptions = {}): string {
  switch (mark) {
    case 'wordmark':
      return wordmarkSvg(options);
    case 'signature':
      return signatureSvg(options);
    case 'monogram':
    default:
      return monogramSvg(options);
  }
}

/**
 * Decoration Motif tokens — the locked Phase-3 motif: a **lines-only blueprint grid**.
 * Shared by the web `<brand-motif>` primitive and `motifSvg()` so both render identically.
 * The Dot is intentionally absent: the mark's accent Dot must stay the only circle
 * wherever the motif sits behind it (chosen direction A — keep the Dot exclusive).
 */
export const MOTIF = {
  /** Grid cell size — px (web) / user units (asset). */
  cell: 40,
  /** Line thickness — px / user units. */
  stroke: 0.75,
  /** Line opacity over the surface. */
  opacity: 0.13,
} as const;

export interface MotifRenderOptions {
  /** Accent / line colour. */
  accent?: string;
  /** Grid cell size in user units. */
  cell?: number;
  /** Line thickness in user units. */
  strokeWidth?: number;
  /** Line opacity. */
  opacity?: number;
  /** Surface rect behind the grid; `null`/omitted = transparent. */
  background?: string | null;
}

/**
 * The Motif as a standalone tileable SVG sized `width`×`height` — for asset
 * composition (OG / email backgrounds, section textures). The web uses the
 * `<brand-motif>` CSS primitive instead; both follow `MOTIF`.
 */
export function motifSvg(width: number, height: number, options: MotifRenderOptions = {}): string {
  const {
    accent = TDP_BRAND.theme.accent,
    cell = MOTIF.cell,
    strokeWidth = MOTIF.stroke,
    opacity = MOTIF.opacity,
    background = null,
  } = options;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" fill="none">`,
    background ? `<rect width="${width}" height="${height}" fill="${background}" />` : '',
    `<defs><pattern id="brand-motif" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">`,
    `<path d="M${cell} 0 H0 V${cell}" stroke="${accent}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}" />`,
    `</pattern></defs>`,
    `<rect width="${width}" height="${height}" fill="url(#brand-motif)" />`,
    `</svg>`,
  ].join('');
}
