import type { GalleryImage } from './gallery.types';

export type Cell = {
  readonly img: GalleryImage;
  readonly area: string;
  readonly ratio: string;
};

/** Per-instance fallback group id (SSR-safe: deterministic instantiation order). */
let gallerySeq = 0;

export function nextGalleryGroup(): string {
  return `lb-gallery-${gallerySeq++}`;
}

/** Aspect-ratio per cell index, per layout count. See `landing-gallery` doc above. */
export function ratioFor(count: 1 | 2 | 3 | 4, index: number): string {
  // 1-image uses 4:3 instead of 16:10 — narrower contexts (e.g. a 60% column)
  // benefit from taller frames so the gallery doesn't read "short" next to the
  // accompanying text column.
  if (count === 1) return '4 / 3';
  if (count === 2) return '4 / 3';
  if (count === 3) return index === 0 ? '4 / 3' : '16 / 9';
  return '4 / 3';
}
