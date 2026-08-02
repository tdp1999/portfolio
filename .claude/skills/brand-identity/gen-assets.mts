/**
 * Brand asset generator — renders the v1 Asset set from the Master SVG builders.
 *
 * Portable by design: the only project-specific lines are the two PROJECT WIRING
 * imports below (the brand lib's Master builders + the Brand config) and OUT_DIR.
 * Everything else (asset sizes, OG/email layouts, the sharp + png-to-ico pipeline)
 * is project-agnostic — copy this skill to another product, repoint the two imports
 * at its brand lib, and it emits the same set from that product's config.
 *
 * Run via the skill recipe (esbuild-bundle → node), see SKILL.md. Never imports the
 * lib barrel (it re-exports Angular components) — only the pure `master.util` +
 * `brand.config`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

// ── PROJECT WIRING (the only project-specific lines) ────────────────────────
import {
  adaptiveMonogramSvg,
  monogramSvg,
  motifSvg,
  signatureSvg,
} from '../../../libs/shared/features/brand/src/lib/master.util';
import { TDP_BRAND } from '../../../libs/shared/features/brand/src/lib/brand.config';

// Run from the repo root (see SKILL.md) — cwd is the stable anchor whether this runs
// as source or as the esbuild bundle, so we don't depend on the file's own location.
const REPO_ROOT = process.cwd();
const OUT_DIR = resolve(REPO_ROOT, 'apps/landing/public/brand');
/** Second surface for the same Brand: the admin console, on a transparent mark. */
const CONSOLE_OUT_DIR = resolve(REPO_ROOT, 'apps/console/public/brand');
const brand = TDP_BRAND;
// ────────────────────────────────────────────────────────────────────────────

/** Mode → surface/ink. Accent always comes from the Brand's Theme. */
const PALETTE = {
  dark: { surface: '#0a0d12', ink: '#e7e9ee' },
  light: { surface: '#fbfbfd', ink: '#0a0d12' },
} as const;

const mode = brand.theme.mode ?? 'dark';
const { surface, ink } = PALETTE[mode];
const accent = brand.theme.accent;

const svgBuf = (svg: string) => Buffer.from(svg);

/** Solid square/rect canvas as a sharp pipeline. */
function canvas(width: number, height: number, background: string) {
  return sharp({ create: { width, height, channels: 4, background } });
}

/** Rasterize an SVG string to a PNG buffer at an explicit pixel width (sharp sizes the SVG directly). */
async function rasterizeSvg(svg: string, width: number, height?: number): Promise<Buffer> {
  const img = sharp(svgBuf(svg), { density: 384 });
  return (height ? img.resize(width, height, { fit: 'contain', background: '#00000000' }) : img.resize({ width }))
    .png()
    .toBuffer();
}

const FAVICON_SIZES = [16, 32, 48, 180, 192, 512] as const;

/**
 * Favicon set — Monogram centred on a solid square, every required size + .ico.
 *
 * Two numbers decide how big the mark reads, and they compound: the viewBox
 * padding and the share of the square the mark is scaled into. Stage 1 already
 * bakes 10 units of clearspace into MONOGRAM_VIEWBOX, so *adding* more on top
 * shrank the ink to ~41% of the icon's height. -6 trims that back to a hair of
 * margin; 0.90 keeps a visible gutter inside the box edge. Together they put
 * the ink at ~47%, about 15% more than before, with the mark unchanged.
 *
 * These stay solid: the manifest icons (192/512) and the apple-touch icon (180)
 * come out of this set, and both get composited onto a launcher surface where
 * transparency would flatten to a colour we do not control.
 */
async function buildFavicons(): Promise<void> {
  const markSvg = monogramSvg({ variant: 'full', ink, accent, padding: -6 });
  const pngPaths: Record<number, string> = {};

  for (const size of FAVICON_SIZES) {
    const markWidth = Math.round(size * 0.9);
    const markPng = await rasterizeSvg(markSvg, markWidth);
    const out = resolve(OUT_DIR, `favicon-${size}.png`);
    await canvas(size, size, surface)
      .composite([{ input: markPng, gravity: 'centre' }])
      .png()
      .toFile(out);
    pngPaths[size] = out;
    console.log('favicon', `${size}×${size}`, '→', out);
  }

  // apple-touch-icon convention = the 180 png
  const ico = await pngToIco([pngPaths[16], pngPaths[32], pngPaths[48]]);
  const icoOut = resolve(OUT_DIR, 'favicon.ico');
  writeFileSync(icoOut, ico);
  console.log('favicon.ico ←', '16/32/48', '→', icoOut, `(${ico.length} bytes)`);
}

/**
 * Console favicon set — the same Monogram, TRANSPARENT.
 *
 * The console reads as a sibling of landing rather than a second brand, so the
 * mark does not change; only the surface goes away. Two consequences drive this
 * whole function:
 *
 * 1. A transparent icon sits directly on the browser's tab strip, which is
 *    light or dark by the user's theme. A single fixed ink is invisible on one
 *    of the two (measured: light ink scores 1.08 contrast on a light strip).
 *    So the primary asset is an SVG carrying both inks behind a
 *    `prefers-color-scheme` query, resolved by the browser painting the tab.
 * 2. The `.ico` fallback cannot run that query, so it uses the accent monotone
 *    — the only fixed ink that clears both strips (3.5 either way).
 *
 * No surface also means no box edge to keep clear of, so the mark runs to ~98%
 * of the icon instead of landing's 88% — worth ~16% more ink at 16px.
 *
 * Deliberately no apple-touch-icon: iOS composites it onto the home screen with
 * transparency flattened to black, which would undo the whole point. The console
 * is not a home-screen app.
 */
async function buildConsoleFavicons(): Promise<void> {
  mkdirSync(CONSOLE_OUT_DIR, { recursive: true });

  // Stage 1 bakes 10 units of clearspace into MONOGRAM_VIEWBOX for the boxed
  // marks. A transparent favicon wants that back: -6 leaves a hair of margin
  // and nothing more, which is what makes the mark read bigger than landing's.
  const TIGHTEN = -6;

  const svg = adaptiveMonogramSvg({
    lightInk: PALETTE.light.ink,
    darkInk: PALETTE.dark.ink,
    accent,
    padding: TIGHTEN,
  });
  const svgOut = resolve(CONSOLE_OUT_DIR, 'favicon.svg');
  writeFileSync(svgOut, svg);
  console.log('console favicon.svg (theme-adaptive) →', svgOut);

  // Fallback raster: accent monotone, the only fixed ink that reads on both strips.
  const fallbackSvg = monogramSvg({ ink: accent, accent, padding: TIGHTEN });
  const pngPaths: Record<number, string> = {};
  for (const size of [16, 32, 48] as const) {
    const markWidth = Math.round(size * 0.98);
    const markPng = await rasterizeSvg(fallbackSvg, markWidth);
    const out = resolve(CONSOLE_OUT_DIR, `favicon-${size}.png`);
    await sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
      .composite([{ input: markPng, gravity: 'centre' }])
      .png()
      .toFile(out);
    pngPaths[size] = out;
    console.log('console favicon', `${size}×${size}`, '→', out);
  }

  const ico = await pngToIco([pngPaths[16], pngPaths[32], pngPaths[48]]);
  const icoOut = resolve(CONSOLE_OUT_DIR, 'favicon.ico');
  writeFileSync(icoOut, ico);
  console.log('console favicon.ico ←', '16/32/48', '→', icoOut, `(${ico.length} bytes)`);
}

const OG = { w: 1200, h: 630 } as const;

/** OG / social card — Signature centred on the brand surface over the blueprint Motif. */
async function buildOg(): Promise<void> {
  const motif = motifSvg(OG.w, OG.h, { accent, cell: 48 }); // subtle blueprint texture
  const motifPng = await rasterizeSvg(motif, OG.w, OG.h);
  const sig = signatureSvg({ layout: 'horizontal', variant: 'full', ink, accent });
  const sigPng = await rasterizeSvg(sig, Math.round(OG.w * 0.62)); // ~62% canvas width
  const out = resolve(OUT_DIR, 'og.png');
  await canvas(OG.w, OG.h, surface)
    .composite([
      { input: motifPng, gravity: 'centre' },
      { input: sigPng, gravity: 'centre' },
    ])
    .png()
    .toFile(out);
  console.log('og', `${OG.w}×${OG.h}`, '→', out);
}

/**
 * Email signature — Signature PNG (2× for retina) + an email-safe HTML snippet.
 * Always rendered in **light-mode ink** (dark glyphs): email clients composite on a
 * white body, so the web `mode` (which may be dark) must not drive the sig colour.
 */
async function buildEmailSig(): Promise<void> {
  const emailInk = PALETTE.light.ink;
  const sig = signatureSvg({ layout: 'horizontal', variant: 'full', ink: emailInk, accent });
  const displayW = 320;
  const sigPng = await rasterizeSvg(sig, displayW * 2); // 2× retina
  const imgOut = resolve(OUT_DIR, 'email-signature.png');
  writeFileSync(imgOut, sigPng);
  console.log('email-signature.png', `@${displayW * 2}w`, '→', imgOut);

  const html = `<!-- Brand email signature — paste into your mail client.
     Replace SIGNATURE_URL with the hosted location of email-signature.png. -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Georgia,'Times New Roman',serif;color:${emailInk}">
  <tr>
    <td style="padding-bottom:6px">
      <img src="SIGNATURE_URL" alt="${brand.name}" width="${displayW}" style="display:block;border:0;outline:none" />
    </td>
  </tr>
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;letter-spacing:.02em">
      ${brand.wordmark}
    </td>
  </tr>
</table>`;
  const htmlOut = resolve(OUT_DIR, 'email-signature.html');
  writeFileSync(htmlOut, html);
  console.log('email-signature.html →', htmlOut);
}

const TARGETS: Record<string, () => Promise<void>> = {
  favicons: buildFavicons,
  'console-favicons': buildConsoleFavicons,
  og: buildOg,
  email: buildEmailSig,
};

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  // optional CLI filter: `node generate.run.mjs favicons og`
  const wanted = process.argv.slice(2).filter((a) => a in TARGETS);
  const run = wanted.length ? wanted : Object.keys(TARGETS);
  console.log(`brand-asset-gen → ${brand.name} (${mode}, accent ${accent})`);
  console.log('out:', OUT_DIR, '\ntargets:', run.join(', '), '\n');
  for (const t of run) await TARGETS[t]();
  console.log('\n✓ done');
})();
