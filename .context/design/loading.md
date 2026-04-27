# Loading Indicators — Console

Single source of truth for "what loading indicator do I use here?". Every console page must follow this taxonomy.

## Taxonomy

| Indicator                | When                                                                  | Component                            | Notes                                                         |
| ------------------------ | --------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------- |
| **Skeleton rows**        | Initial list load, filter / sort / pagination change                  | `<console-skeleton-table>`           | Min-duration 300ms (built-in) to prevent flicker              |
| **Top progress bar**     | Route navigation, background list refresh after a mutation            | `<console-loading-bar>` (in `App`)   | Ref-counted via `ProgressBarService`                          |
| **Button spinner**       | Action in-flight (Save, Delete, Restore)                              | Local — `<mat-spinner>` inside button + `disabled` | Per-action, never global                            |
| **Full-page spinner**    | Bootstrap (auth check), critical blocking operations                  | `<console-full-page-spinner>`        | Rare — only when user must not interact at all                |
| **Shimmer placeholder**  | Image / media thumbnails while bytes load                             | Inline div + `animate-pulse`         | For known dimensions only                                     |
| **None (SSR initial)**   | Server-rendered first paint                                           | n/a                                  | Render real content from server, no placeholder               |

## Rules

1. **Never two simultaneously.** Skeleton table + top progress bar at the same time = no. Choose one.
2. **Skeleton ≠ refresh.** Skeleton replaces empty content on *initial* or *filter-change* loads. After a mutation (save / delete), list data already exists — use top progress bar, do not blank the table.
3. **Min-duration only on skeleton.** Top progress bar already has its own min-display; button spinner is instantaneous. Min-duration prevents flicker on fast networks.
4. **Spinner overlay is deprecated for list pages.** Keep `<console-spinner-overlay>` only for true blocking operations (e.g., bulk destructive action where user must wait).
5. **Min-duration value: 300ms** for skeleton rows; aligned with existing 250ms loading-bar threshold and 400ms media picker minimum.

## API summary

### Skeleton table

```html
<console-skeleton-table [columns]="6" [rows]="8" />
```

Drop in place of `<table mat-table>` (or as overlay) when `loading() && !data().length`.

### Top progress bar

Router navigation calls `start()`/`complete()` automatically — no manual wiring needed. For background list refresh after a mutation, use the `withListLoading` operator with `silent: true` — see below.

### Standard list-loading operator

All list pages use the same `withListLoading` RxJS operator instead of hand-rolling skeleton/progress logic per page. The operator:

- **silent=false (default):** flips the `loading` signal on subscribe, applies `withMinDuration` to prevent skeleton flicker, and clears the flag on settle/error
- **silent=true:** holds a `ProgressBarService` handle for the duration of the request — top bar shows, no skeleton

```ts
private loadList(opts: { silent?: boolean } = {}) {
  this.service.list(...)
    .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
    .subscribe({
      next: (res) => { this.data.set(res.data); this.total.set(res.total); },
      error: () => this.toast.error('Failed to load …'),
    });
}

// Mutation handlers call silent reload:
onDeleted() { this.loadList({ silent: true }); }
```

The underlying min-duration helper `withMinDuration(ms)` is also exported standalone from `@portfolio/console/shared/util` for non-list use cases (image preload, file upload, etc.).

### Relative time

```html
<console-relative-time [value]="row.updatedAt" />
```

Renders relative text ("3 hours ago") with a tooltip showing the absolute date and full relative duration on hover.

## Decision flow

```
Is data already on screen?
├── No  → Skeleton table
└── Yes → Is the user blocked from interacting?
         ├── Yes → Full-page spinner (rare)
         └── No  → Top progress bar (background refresh)
```

For per-button actions: always button spinner + disabled state, never global.
