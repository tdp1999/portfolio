/** What a page change hands the list: the page to load and how many rows it holds. */
export interface PaginatorChange {
  pageIndex: number;
  pageSize: number;
}

/**
 * One slot in the page strip: a page button, or an ellipsis that stands for the hidden pages
 * and jumps to `target` when clicked.
 */
export type PaginatorSlot =
  | { kind: 'page'; index: number; label: string; current: boolean }
  | { kind: 'gap'; target: number; label: string };
