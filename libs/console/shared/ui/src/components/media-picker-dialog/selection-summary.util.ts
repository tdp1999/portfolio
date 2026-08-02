import { readableSize } from '@portfolio/shared/ui';
import type { MediaItem } from '@portfolio/console/shared/util';

/**
 * One-line technical summary of a picked asset: `PNG · 245 KB · 1200×800`.
 *
 * Shown next to the filename in the picker footer so a selection can be told apart
 * from a near-identical neighbour (same-looking screenshots, `logo.svg` vs
 * `logo.png`) without leaving the dialog.
 */
export function formatMediaMeta(item: MediaItem): string {
  const parts: string[] = [];

  const subtype = item.mimeType?.split('/')[1];
  if (subtype) parts.push(subtype.replace(/^.*\+/, '').toUpperCase());

  parts.push(readableSize(item.bytes));

  if (item.width && item.height) parts.push(`${item.width}×${item.height}`);

  return parts.join(' · ');
}
