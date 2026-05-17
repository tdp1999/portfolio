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
