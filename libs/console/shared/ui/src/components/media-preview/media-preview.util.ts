import type { MediaPreviewItem } from './media-preview.types';

/** Shown when an asset carries no caption, no filename and no alt text. */
export const UNTITLED_MEDIA_LABEL = 'Untitled';

/**
 * One label for one picture, in the order a reader wants it:
 *
 *   1. `caption`  — the only field written *about the picture*, so it wins.
 *   2. `filename` — factual and always present on a real upload.
 *   3. `altText`  — written for screen readers, not for this label, so it is the
 *      last resort rather than the first (which is what the old
 *      `altText || 'Untitled'` got wrong: assets with no alt read "Untitled"
 *      even though every one of them had a filename).
 *
 * Blank and whitespace-only values fall through — an empty string in the database
 * is the same as an absent one for labelling purposes.
 */
export function resolveMediaLabel(item: Pick<MediaPreviewItem, 'caption' | 'filename' | 'altText'>): string {
  return firstNonBlank(item.caption, item.filename, item.altText) ?? UNTITLED_MEDIA_LABEL;
}

/**
 * The `alt` attribute, which is a different question from the label. Real alt text
 * wins; otherwise fall back to the caption or filename so the image is not silent
 * to a screen reader. Never returns the `Untitled` placeholder: an image with no
 * usable description is better announced as empty than as the word "Untitled".
 */
export function resolveMediaAlt(item: Pick<MediaPreviewItem, 'caption' | 'filename' | 'altText'>): string {
  return firstNonBlank(item.altText, item.caption, item.filename) ?? '';
}

/**
 * Cloudinary transform for a tile rendered at `cssWidth` CSS pixels.
 *
 * `c_limit` shrinks to fit and never upscales, so a small source stays untouched.
 * The requested width is doubled for retina, then rounded up to a 160px step: a
 * handful of distinct widths across the console means Cloudinary's derived-asset
 * cache actually hits, instead of every tile size minting its own derivative.
 */
export function mediaThumbTransform(cssWidth: number): string {
  const step = 160;
  const target = Math.max(step, Math.ceil((cssWidth * 2) / step) * step);
  return `c_limit,w_${target},f_auto,q_auto`;
}

function firstNonBlank(...values: (string | null | undefined)[]): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}
