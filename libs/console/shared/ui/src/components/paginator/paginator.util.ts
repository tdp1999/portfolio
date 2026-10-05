import type { PaginatorSlot } from './paginator.types';

/** Pages shown on each side of the current one. */
export const PAGINATOR_SIBLINGS = 2;
/** How far an ellipsis jumps, so a 50-page list is a few clicks from end to end. */
export const PAGINATOR_GAP_JUMP = 5;

/**
 * The page strip for `pageCount` pages with `current` selected (both 0-based): the first and last
 * page always, `PAGINATOR_SIBLINGS` pages on each side of the current one, and an ellipsis for each
 * hidden run. A run of one hidden page shows that page instead, since the ellipsis would take the
 * same room. The strip keeps the same number of slots wherever the current page is, so the
 * buttons do not shift under the pointer while paging.
 */
export function pageSlots(pageCount: number, current: number): PaginatorSlot[] {
  const page = (index: number): PaginatorSlot => ({
    kind: 'page',
    index,
    label: String(index + 1),
    current: index === current,
  });
  // first + last + current + siblings on both sides + two ellipses
  const width = 2 * PAGINATOR_SIBLINGS + 5;
  if (pageCount <= width) return Array.from({ length: pageCount }, (_, i) => page(i));

  const last = pageCount - 1;
  // Slide the sibling window inward at the edges so the strip length stays constant.
  const start = Math.min(Math.max(current - PAGINATOR_SIBLINGS, 2), last - 2 - 2 * PAGINATOR_SIBLINGS);
  const end = start + 2 * PAGINATOR_SIBLINGS;

  const slots: PaginatorSlot[] = [page(0)];
  slots.push(
    start === 2 ? page(1) : { kind: 'gap', target: Math.max(current - PAGINATOR_GAP_JUMP, 0), label: 'Back 5 pages' }
  );
  for (let i = start; i <= end; i++) slots.push(page(i));
  slots.push(
    end === last - 2
      ? page(last - 1)
      : { kind: 'gap', target: Math.min(current + PAGINATOR_GAP_JUMP, last), label: 'Forward 5 pages' }
  );
  slots.push(page(last));
  return slots;
}

/** After a page-size change, the page that still holds the first row the Owner was looking at. */
export const keepFirstRow = (pageIndex: number, oldSize: number, newSize: number): number =>
  Math.floor((pageIndex * oldSize) / newSize);
