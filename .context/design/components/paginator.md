---
component: console-paginator
status: stable
related: [skeleton-table]
---

# paginator

> The one pager for every console list: rows-per-page select, row range, and a numbered page
> strip that stays usable past 50 pages. Stateless; the list owns the page state.

## Why this exists

`mat-paginator` only offers prev/next and first/last, so reaching page 30 of 45 meant 29
clicks. `console-paginator` keeps the same slot (`.crud-pagination`, sticky bottom, joined flush
to `.crud-table-container`) and adds direct page access without a "Go to page" box.

## Use when

- Any server-paged console list (table or grid) with a total count.

## Don't use when

- Infinite or cursor-based lists with no total: there is nothing to number.
- Client-side lists short enough to show whole (no pager at all).

## Behavior contract

- **Inputs:** `length`, `pageIndex` (0-based), `pageSize` (all required), `pageSizeOptions`
  (default `20, 50, 100, 200`), `disabled`, `compact` (boolean attribute). **Output:** `page: { pageIndex, pageSize }`, emitted
  only on a real change.
- **Strip:** always 9 slots once there are more than 9 pages, so buttons never shift under the
  pointer: first page, last page, the current page with 2 siblings each side, and an ellipsis for
  each hidden run. A hidden run of one page shows that page instead of an ellipsis.
- **Ellipsis:** a button that jumps 5 pages in its direction (tooltip says so), clamped to the
  list.
- **Page size change** keeps the first visible row on screen: the new index is
  `floor(pageIndex * oldSize / newSize)`.
- **Scroll:** every emitted change scrolls `.console-content` back to the top, so a new page
  starts at row one. Lists do not do this themselves.
- **Narrow:** below a 640px container width the strip collapses to `10 / 18` between the arrows
  (container query, so it follows the card, not the viewport).
- **Compact:** `compact` drops the rows-per-page select and the first/last arrows and tightens the
  row to 40px, for a pager
  under a narrow list column (the Radar Feed's Split list). The page size is then changed from
  the list's full view.
- **A11y:** `nav[aria-label="Pagination"]`, current page has `aria-current="page"`, the range is
  `aria-live="polite"`, each arrow has an `aria-label` and tooltip.

## Wiring

```html
<console-paginator
  class="crud-pagination"
  [length]="total()"
  [pageIndex]="pageIndex()"
  [pageSize]="pageSize()"
  [pageSizeOptions]="pageSizeOptions"
  (page)="onPage($event)"
/>
```

`onPage` sets both signals and reloads. A filter or sort change resets `pageIndex` to 0 on the
list's own signal; there is no paginator instance to reset.

## Anti-patterns

- Holding a `viewChild` to the paginator to reset it: the inputs are the state.
- A per-list page-size array: use `PAGE_SIZE_OPTIONS` from `@portfolio/console/shared/util`, or
  a feature constant only when the API caps lower.
- Hand-rolled scroll-to-top in `onPage`: the paginator owns it.

## Related layout

For a list whose paginator must not move between loading and loaded (and a filter row that
stays pinned while scrolling), use `.crud-page--fill`, `<console-skeleton-table fill>` and
`.crud-toolbar`. See `cookbook/console.md` → List table + pagination.
