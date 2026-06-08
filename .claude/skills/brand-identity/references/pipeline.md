# Brand identity pipeline — end-to-end

How a name + a font become a full, themeable identity. This is the durable capture of the
process we discovered, so a new product reuses it instead of re-deriving it. Design
*rationale* (the "why" debates) lives in the epic; this is the operational "how".

## The core insight

The hard part of identity is **origination** (inventing a soulful mark), not production.
AI/tools are bad at origination and good at production — so the human supplies the idea
(which name, which font, the Dot), and the pipeline does deterministic production. We do
**not** hand-draw bezier glyphs (they read amateur) and we do **not** AI-generate a raster
(can't re-theme/re-render/version). Instead: **set the name in an existing high-quality
font, ship it as outlines.**

## Inputs the human chooses

| Input | Ours | Why it's a human call |
| --- | --- | --- |
| Font | Newsreader (Production Type) | taste; must be OFL/licence-clean |
| Weight / optical size | 500 / opsz 40 | taste — the mark's voice |
| Monogram text | `tdp` (+ Dot → `tdp.`) | the primary mark |
| Wordmark text | `Phuong Tran` (+ Dot) | the secondary mark |
| Accent (Dot colour) | `#6E66D9` indigo | brand palette |
| Dot radius | 13 (font units @ em 120) | the atom's presence |

## Stage 0 — licence & font prep

- **Licence:** Newsreader is SIL OFL 1.1 → free commercial use incl. logos & trademark.
  The only restriction is selling the *font file* under its name. We ship the mark as
  **path outlines** (not the font), so embedding rules don't even apply. Verify any new
  font clears the same bar before building on it.
- **Instance the static weight:** opentype.js reads neither variable axes nor woff2. Bake a
  static instance from the variable font:
  ```bash
  python3 -m fontTools.varLib.instancer Newsreader[opsz,wght].ttf wght=500 opsz=40 -o newsreader-500.ttf
  ```
  (`pip install fonttools`.) Commit the `.ttf` under `fonts/`.

## Stage 1 — origination → Master data (`gen-glyphs.mjs`)

opentype.js extracts **per-glyph** outlines (one `<path d>` per letter — needed for the
draw-on loader to trace letters independently) and computes:

- `MONOGRAM_GLYPHS` / `WORDMARK_GLYPHS` — `font.getPaths(text, …).map(p => p.toPathData(2))`.
- `DOT` / `WORDMARK_DOT` — the accent atom. Placed a fixed `dotGap` (14u) past the last
  glyph's true **ink edge** (bbox `x2`, NOT the advance — advance hides the side bearing and
  reads cramped), so `cx = inkRight + dotGap + R` and the visual gap stays constant at any
  radius. `cy = -7` sits it just above the baseline. Both marks share `R`/`cy`/`dotGap` → one
  proportion and rhythm.
- `MONOGRAM_VIEWBOX` / `WORDMARK_VIEWBOX` — glyph bbox unioned with the Dot, + 10u padding.

Output `glyph-outlines.data.ts` is **pure geometry, theme-independent** — colour is applied
later. Pin **opentype.js 1.3.4** (2.0.0 corrupts `g`/`a` via a `toPathData` regression).

## Stage 2 — Master builders + assets

- `master.util.ts` (in the brand lib) builds standalone SVG **strings** for monogram /
  wordmark / signature, themeable (`ink`/`accent`), variant-aware (`full`/`mono`/`knockout`),
  with `background`/`padding` for composition. `currentColor` is resolved to explicit `ink`
  (standalone SVG can't inherit it). The Angular `<brand-*>` components render the same
  geometry for the live web.
- `gen-assets.mts` rasterizes via **sharp** (SVG→PNG at any size; `composite` to centre a
  mark on a surface) + **png-to-ico**. See `asset-spec.md` for the output set.

## Where things live (portability contract)

- **Skill (this dir):** the reusable process — both generators, the font, the docs.
- **Project brand lib:** the outputs (`glyph-outlines.data.ts`, `master.util.ts`, the
  `<brand-*>` components) + the per-product `brand.config.ts`.
- A new product reuses the skill verbatim; it only supplies a font, the `CONFIG`/wiring
  edits, and its `brand.config.ts`. See SKILL.md → "Bootstrapping a new identity".

## Gotchas (paid for once)

- `node Buffer.buffer` ≠ the file bytes (it's the shared pool) → use `opentype.loadSync(path)`.
- Run generators from the **repo root**; both anchor on `process.cwd()`.
- esbuild-bundle `gen-assets.mts` (externalize the native `sharp`/`png-to-ico`); don't `tsx`
  it — node's type-stripping fights tsx on `.ts` imports.
- Email signature must render in **light-mode ink** (dark glyphs) — email bodies are white,
  so the web `mode` (possibly dark) must not drive it.
- Favicon: a wide mark (`tdp.` ≈ 1.6:1) is `composite`-centred on a square, never stretched.
