/**
 * Stage 1 of the Brand pipeline — ORIGINATION.
 *
 * Turns "a chosen font + the brand's text" into the per-glyph outline data the
 * runtime + asset builders consume. This is the hard, reusable half: extract the
 * Monogram / Wordmark glyph outlines and place the accent Dot, deterministically.
 *
 * Prerequisite (run once per font, documented in references/pipeline.md):
 *   python3 -m fontTools.varLib.instancer <variable>.ttf wght=500 opsz=40 -o <out>.ttf
 * → bakes a static instance; opentype.js can't read variable axes or woff2.
 *
 * Emits libs/shared/features/brand/src/lib/glyph-outlines.data.ts. Re-run whenever
 * the font, the monogram/wordmark text, the weight, or the Dot size changes.
 *
 *   node .claude/skills/brand-identity/gen-glyphs.mjs        # from the repo root
 *
 * For a NEW product: copy this skill, drop the product's instanced .ttf in fonts/,
 * edit the CONFIG block below, run. That's the whole "minimal redo".
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const opentype = createRequire(import.meta.url)('opentype.js');

// ── CONFIG (the only per-product lines) ─────────────────────────────────────
const REPO_ROOT = process.cwd(); // run from repo root
const CONFIG = {
  font: '.claude/skills/brand-identity/fonts/newsreader-500.ttf',
  monogram: 'tdp', // the Monogram letters (the Dot is added separately, theme-coloured)
  wordmark: 'Phuong Tran', // the Wordmark
  fontSize: 120, // extraction em — arbitrary; everything scales by viewBox
  dotR: 13, // the Dot radius in font units (brand atom — bigger than a true period)
  dotGap: 14, // clear space between the last glyph's INK edge and the Dot's left edge
  out: 'libs/shared/features/brand/src/lib/glyph-outlines.data.ts',
};
// ────────────────────────────────────────────────────────────────────────────

const FS = CONFIG.fontSize;
// opentype.js is pinned to 1.3.4 — 2.0.0 regresses `toPathData` and corrupts some
// complex glyphs (e.g. 'g', 'a'). loadSync is the proven path on 1.3.4.
const font = opentype.loadSync(resolve(REPO_ROOT, CONFIG.font));
const round = (n) => Math.round(n * 100) / 100;

const glyphs = (text) => font.getPaths(text, 0, 0, FS, { kerning: true }).map((p) => p.toPathData(2));
function viewBox(text, dot) {
  const bb = font.getPath(text, 0, 0, FS, { kerning: true }).getBoundingBox();
  const x1 = Math.min(bb.x1, dot.cx - dot.r);
  const y1 = Math.min(bb.y1, dot.cy - dot.r);
  const x2 = Math.max(bb.x2, dot.cx + dot.r);
  const y2 = Math.max(bb.y2, dot.cy + dot.r);
  const p = 10;
  return `${Math.floor(x1 - p)} ${Math.floor(y1 - p)} ${Math.ceil(x2 - x1 + 2 * p)} ${Math.ceil(y2 - y1 + 2 * p)}`;
}

// The Dot — accent atom. Placed a fixed `dotGap` past the last glyph's true INK edge
// (its bounding box, NOT the advance — advance hides the side bearing and reads cramped),
// so the visual gap is constant regardless of the radius. cy = -7 sits it just above the
// baseline. Monogram + Wordmark dots share R/cy/gap → one proportion, one rhythm.
const R = CONFIG.dotR;
function dotFor(text) {
  const inkRight = font.getPath(text, 0, 0, FS, { kerning: true }).getBoundingBox().x2;
  return { cx: round(inkRight + CONFIG.dotGap + R), cy: -7, r: R };
}

const MONO = glyphs(CONFIG.monogram);
const WORD = glyphs(CONFIG.wordmark);
const DOT = dotFor(CONFIG.monogram);
const WORDMARK_DOT = dotFor(CONFIG.wordmark);
const MONO_VB = viewBox(CONFIG.monogram, DOT);
const WORD_VB = viewBox(CONFIG.wordmark, WORDMARK_DOT);

const arr = (a) => '[\n  ' + a.map((d) => `'${d}'`).join(',\n  ') + ',\n]';
const ts = `// AUTO-GENERATED — do not hand-edit. Regenerate: node .claude/skills/brand-identity/gen-glyphs.mjs
// Per-glyph Newsreader (OFL 1.1) outline path data, weight 500 / opsz 40, for the
// Brand monogram, wordmark, and the staggered draw-on loader. Each entry is one glyph.
export const MONOGRAM_GLYPHS: string[] = ${arr(MONO)};
export const WORDMARK_GLYPHS: string[] = ${arr(WORD)};
// The Dot — accent atom after the monogram ('${CONFIG.monogram}.'). Theme-coloured.
export const DOT = { cx: ${DOT.cx}, cy: ${DOT.cy}, r: ${DOT.r} } as const;
// The matching Dot after the wordmark ('${CONFIG.wordmark}.'), same proportion as DOT.
export const WORDMARK_DOT = { cx: ${WORDMARK_DOT.cx}, cy: ${WORDMARK_DOT.cy}, r: ${WORDMARK_DOT.r} } as const;
export const MONOGRAM_VIEWBOX = '${MONO_VB}';
export const WORDMARK_VIEWBOX = '${WORD_VB}';
`;
writeFileSync(resolve(REPO_ROOT, CONFIG.out), ts);
console.log('wrote', CONFIG.out);
console.log('MONO_VB', MONO_VB, '| DOT', JSON.stringify(DOT));
console.log('WORD_VB', WORD_VB, '| WORDMARK_DOT', JSON.stringify(WORDMARK_DOT));
