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
import { monogramSvg, signatureSvg } from '../../../libs/shared/features/brand/src/lib/master.util';
import { TDP_BRAND } from '../../../libs/shared/features/brand/src/lib/brand.config';

// Run from the repo root (see SKILL.md) — cwd is the stable anchor whether this runs
// as source or as the esbuild bundle, so we don't depend on the file's own location.
const REPO_ROOT = process.cwd();
const OUT_DIR = resolve(REPO_ROOT, 'apps/landing/public/brand');
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

/** Favicon set — Monogram centred on a solid square, every required size + .ico. */
async function buildFavicons(): Promise<void> {
  // wide mark, modest internal clearspace
  const markSvg = monogramSvg({ variant: 'full', ink, accent, padding: 8 });
  const pngPaths: Record<number, string> = {};

  for (const size of FAVICON_SIZES) {
    const markWidth = Math.round(size * 0.88); // fill ~88% of the square width
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

const OG = { w: 1200, h: 630 } as const;

/** OG / social card — Signature centred on the brand surface. */
async function buildOg(): Promise<void> {
  const sig = signatureSvg({ layout: 'horizontal', variant: 'full', ink, accent });
  const sigPng = await rasterizeSvg(sig, Math.round(OG.w * 0.62)); // ~62% canvas width
  const out = resolve(OUT_DIR, 'og.png');
  await canvas(OG.w, OG.h, surface)
    .composite([{ input: sigPng, gravity: 'centre' }])
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
