---
name: brand-identity
description: Generate a Brand identity end-to-end — from a chosen font + the brand's name to the per-glyph Master outline data, then to the rendered asset set (favicon set + .ico, OG/social image, email signature). Two stages, both committed and reproducible. Use when bootstrapping a new product's identity, or when the font / mark / accent / theme / Dot changes and the glyph data or rendered assets need regenerating.
---

# Brand Identity Generator

The full, reproducible pipeline behind the Brand system — **both halves committed**, no
throwaway scratch. Turns "an existing font + a name" into a themeable, scalable identity
and all its assets. No custom-drawn glyphs, no AI raster: the marks are real font outlines,
everything else is deterministic code.

```
 font (.ttf, weight-instanced)              brand.config.ts (name, theme)
        │                                            │
        ▼  Stage 1 · gen-glyphs.mjs                  │
  glyph-outlines.data.ts  ──►  master.util.ts (SVG builders) ──►  <brand-*> components (runtime)
        (Master outlines + Dots)                     │
                                                     ▼  Stage 2 · gen-assets.mts
                                          favicon set · og.png · email signature
```

## When to use

- **New product** onto the Brand system → see "Bootstrapping a new identity" below.
- Mark / accent / mode / **Dot size** changed → re-run Stage 1 then Stage 2.
- Only theme (accent/mode) changed → re-run Stage 2 (assets) — Stage 1 output is theme-independent.

## Files

| File | Role |
| --- | --- |
| `gen-glyphs.mjs` | **Stage 1 (origination).** Font → `glyph-outlines.data.ts` (per-glyph outlines + Dot placement + viewBoxes). |
| `gen-assets.mts` | **Stage 2 (assets).** Master builders → favicon/og/email into the app's `public/`. |
| `fonts/newsreader-500.ttf` | The instanced font input (OFL — bundling allowed). |
| `references/pipeline.md` | Full end-to-end recipe + the locked design decisions behind it. |
| `references/asset-spec.md` | Per-asset sizes / layout rationale. |

## Prerequisites (one-time, per font)

1. **Pick an existing font** (we use Newsreader, SIL OFL 1.1 — free for logos/trademark; shipping the mark as *outlines* sidesteps font-embedding entirely). Don't draw bespoke glyphs.
2. **Instance the weight** — opentype.js can't read variable axes or woff2, so bake a static instance with fonttools (Python):
   ```bash
   python3 -m fontTools.varLib.instancer Newsreader.ttf wght=500 opsz=40 -o newsreader-500.ttf
   ```
   Drop the result in `fonts/`.
3. **Tooling:** `opentype.js` — **pinned to 1.3.4** (devDep). ⚠️ 2.0.0 regresses `toPathData` and corrupts complex glyphs (`g`, `a`). `sharp` (SVG→PNG, already a dep) + `png-to-ico` (the `.ico`).

## Run

Both run **from the repo root** (cwd is the anchor).

```bash
# Stage 1 — regenerate the Master glyph data (after font / text / Dot change)
node .claude/skills/brand-identity/gen-glyphs.mjs

# Stage 2 — render assets. esbuild-bundles first (native sharp/png-to-ico stay external),
# because node's type-stripping conflicts with tsx for .ts imports.
node_modules/.pnpm/node_modules/.bin/esbuild .claude/skills/brand-identity/gen-assets.mts \
  --bundle --platform=node --format=esm --external:sharp --external:png-to-ico \
  --outfile=.brand-gen.run.mjs
node .brand-gen.run.mjs            # all, or filter: favicons | og | email
rm -f .brand-gen.run.mjs
```

## Bootstrapping a new identity (the "minimal redo")

For a new product, the reusable machinery stays; you only supply inputs:

1. Instance the product's chosen font → `fonts/<name>.ttf` (prereq step 2).
2. Edit the `CONFIG` block in **`gen-glyphs.mjs`**: `font`, `monogram`, `wordmark`, `dotR`, `out`.
3. Edit the `PROJECT WIRING` imports + `OUT_DIR` in **`gen-assets.mts`** to point at that product's brand lib.
4. Set the product's `brand.config.ts` (name, theme accent/mode) in its lib.
5. Run Stage 1 then Stage 2.

Everything else — Dot placement math, viewBox computation, the Master SVG builders, asset
sizes/layouts, the raster pipeline — is shared and needs no rework.

## Notes

- The **Dot** is the brand atom: theme-coloured, deliberately larger than a true period, placed a fixed `dotGap` (14u) past the last glyph's true ink edge so the spacing reads natural at any radius. Both the Monogram (`tdp.`) and Wordmark (`Phuong Tran.`) close with it.
- Stage 1 output is **theme-independent** (just geometry); colour is applied at render time (`currentColor` ink + `--brand-accent` Dot), so one glyph file serves every theme/variant.
- The locked design rationale (why this font, why outlines, the ubiquitous language) lives in the epic: `.context/plans/epic-portfolio-brand-identity.md`. `references/pipeline.md` digests the parts needed to operate the pipeline.
