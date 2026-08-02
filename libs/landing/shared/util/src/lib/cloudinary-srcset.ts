/**
 * Build a 1×/2× `srcset` for a Cloudinary delivery URL.
 *
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/<transforms?>/<publicId>.<ext>
 *
 * We inject `f_auto,q_auto,w_{width}` into the transform segment for the 1× variant
 * and `w_{width * 2}` for the 2× variant. Non-Cloudinary URLs are returned with an
 * empty `srcset` so the caller falls back to the original `src`.
 *
 * `width` is the **rendered CSS width** of the image (e.g. 960 for a hero capped at
 * 960 CSS pixels). Cloudinary serves the closest physical resolution back.
 */
export interface CloudinarySrcset {
  readonly src: string;
  readonly srcset: string;
}

const CLOUDINARY_HOST = 'res.cloudinary.com';
const UPLOAD_SEGMENT = '/image/upload/';

export function buildCloudinarySrcset(url: string | null | undefined, width: number): CloudinarySrcset {
  if (!url) return { src: '', srcset: '' };
  if (!isCloudinary(url)) return { src: url, srcset: '' };

  const oneX = withWidth(url, width);
  const twoX = withWidth(url, width * 2);
  if (!oneX || !twoX) return { src: url, srcset: '' };
  return { src: oneX, srcset: `${oneX} 1x, ${twoX} 2x` };
}

/**
 * Shared width ladder for `w`-descriptor srcsets. A small fixed set of widths that
 * every responsive image on the site draws from, so Cloudinary's derived-asset cache
 * is shared instead of each call site minting its own one-off derivative.
 */
export const RESPONSIVE_WIDTH_LADDER = [320, 480, 640, 768, 960, 1280, 1600, 1920] as const;

/**
 * Build a `w`-descriptor `srcset` for a Cloudinary URL, to be paired with a `sizes`
 * attribute on the `<img>`.
 *
 * **Why this exists next to {@link buildCloudinarySrcset}.** The 1×/2× form encodes
 * a single assumed CSS width, so it cannot react to the element actually being
 * narrower at one breakpoint than another. That is precisely what went wrong in the
 * home gallery: `cellWidth` was a hardcoded 720 while the measured cell never exceeds
 * 333 CSS px, so a retina browser fetched `w_1440` for a 333px box — 2.2× too wide
 * in each dimension, roughly 4.7× the bytes. With `w` descriptors the browser reads
 * the real laid-out width out of `sizes` and picks the smallest rung that covers it,
 * at whatever device pixel ratio the screen happens to have.
 *
 * `maxCssWidth` is the widest the image is ever laid out at. The ladder is capped at
 * 2.5× that (retina headroom without serving a 4K rung to a thumbnail), and always
 * keeps at least the smallest rung.
 */
export function buildCloudinaryWidthSet(url: string | null | undefined, maxCssWidth: number): CloudinarySrcset {
  if (!url) return { src: '', srcset: '' };
  if (!isCloudinary(url)) return { src: url, srcset: '' };

  const cap = Math.round(maxCssWidth * 2.5);
  const widths = RESPONSIVE_WIDTH_LADDER.filter((w) => w <= cap);
  if (!widths.length) widths.push(RESPONSIVE_WIDTH_LADDER[0]);

  const entries = widths.map((w) => `${withWidth(url, w)} ${w}w`);
  // Fallback `src` for a browser that ignores srcset: the 1× rung, not the largest.
  const fallback = withWidth(url, Math.min(...widths));
  if (!fallback) return { src: url, srcset: '' };
  return { src: fallback, srcset: entries.join(', ') };
}

function isCloudinary(url: string): boolean {
  return url.includes(CLOUDINARY_HOST) && url.includes(UPLOAD_SEGMENT);
}

function withWidth(url: string, width: number): string | null {
  const idx = url.indexOf(UPLOAD_SEGMENT);
  if (idx === -1) return null;
  const head = url.slice(0, idx + UPLOAD_SEGMENT.length);
  const tail = url.slice(idx + UPLOAD_SEGMENT.length);
  const transform = `f_auto,q_auto,w_${Math.round(width)},c_limit/`;
  // Tail may already start with a transform segment (e.g. `v1234567890/<publicId>`
  // or `c_fill,w_100/<publicId>`). We unconditionally prepend our own — Cloudinary
  // applies chained transforms left-to-right and our `c_limit` only kicks in if the
  // source is larger than `width`, so this is safe to layer.
  return `${head}${transform}${tail}`;
}
