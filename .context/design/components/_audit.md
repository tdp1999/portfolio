# Component Bank Audit — Full Inventory

> Produced 2026-06-22 (task 304 / epic [Component Docs & DDL Canonical](../../plans/epic-component-docs-and-ddl.md)).
> Source of truth for what exists vs what is documented vs what is shown in DDL. Re-run the scan and update counts when components are added/removed.
>
> **Legend:** Bank doc = a file under `.context/design/components/`. In DDL = a `ddl-*` showcase page (landing) or coverage in `libs/console/feature-ddl` (console). Priority = doc-writing priority (high = reused primitive with non-obvious rules; low = layout/one-off/util).

## Headline numbers

| Library | Components | Bank doc | % | Biggest gap |
|---|---|---|---|---|
| `libs/landing/shared/ui` | 72 | 6 | **~8%** | every primitive (button/icon/link/chip/heading + whole form family) undocumented |
| `libs/console/shared/ui` | 30 | 5 | **~17%** | markdown-editor, translatable-group(+markdown), section-card(+`consoleFormSnapshot`) |
| `libs/shared/ui` | 9 | 0 | **0%** | `ui-sidebar` family (multi-part, shadcn-style, zero docs) |

**Cross-cutting findings**
- `segmented-control.md` frontmatter is `component: console-segmented-control` → **`landing-segmented` is effectively undocumented** (the doc is its console twin).
- `chips/*` docs are all `console-*` → **`landing-chip` / `landing-filter-chip` undocumented** (twins).
- DDL has ~40 landing showcase pages vs 6 bank docs: **DDL is far ahead of the bank**, but its content is author-generated and **not linked to / synced with** the bank. Closing this is the epic's core.
- `about-experience.md` + `brand-motif.md` document landing **feature** composites NOT exported from the shared barrel → excluded from the 72 count, flagged so they aren't mistaken for shared coverage.

---

## Landing — `libs/landing/shared/ui/` (6 / 72 documented)

### Documented (6)
| Component | Kind | Bank doc | Notes |
|---|---|---|---|
| `landing-card` | composite | `card.md` | |
| `landing-carousel` (+ `[landingCarouselSlide]`) | composite | `carousel.md` | |
| `landing-gallery` | composite | `landing-gallery.md` | |
| `landing-lightbox` (+ overlay, `[lightbox]`) | composite | `lightbox.md` | |
| `landing-show-more` | composite | `show-more.md` | |
| `landing-segmented` | composite | ❌ — `segmented-control.md` is the **console** twin | high-priority: needs its own/shared doc |

### Primitives — HIGH priority gap (all undocumented)
| Component | In DDL? | Priority | Notes |
|---|---|---|---|
| `landing-button` | ddl-button | high | CVA-style, most-used |
| `landing-icon` (+ `landing-icon-arrow`) | ddl-icon / ddl-arrow | high | |
| `landing-link` | ddl-link | high | core nav primitive |
| `landing-chip` | ddl-chip | high | twin of console `chip-*` (documented); landing undocumented |
| `landing-heading` | ddl-section-heading / ddl-typography | high | typography primitive |
| `landing-input` | ddl-input / ddl-form-input | high | form family |
| `landing-textarea` | ddl-form-input | high | form family |
| `landing-checkbox` | ddl-form-lib | high | form family |
| `landing-radio` / `landing-radio-group` | ddl-form-lib | high | form family |
| `landing-select` | ddl-form-lib | high | form family |
| `landing-form-field` | ddl-form-input/lib | high | field wrapper (label/error) |
| `landing-eyebrow` | ddl-eyebrow | med | |
| `landing-status-dot` | ddl-status-dot | med | |
| `landing-status-chip` | ddl-status-chip | low | |
| `landing-pull-quote` | ddl-pull-quote | med | |
| `landing-section-rule` | ddl-section-rule | med | |
| `landing-figure` | ddl-figure | med | |
| `landing-image` | ❌ | med | responsive-image primitive (responsive-contract) |
| `landing-tooltip` | ❌ | med | |
| `landing-t` (i18n) | ❌ | med | |
| `landing-emphasis-text` | ❌ | low | |
| `landing-loading-spinner` | ddl-loading-spinner | low | |
| `landing-empty-state` | ddl-empty-state | low | |

### Layout / containers — LOW
`landing-container` (ddl-container), `landing-section` (ddl-section), `landing-content-section`, `landing-section-header` (ddl-section-header), `landing-page-hero` (ddl-page-hero), `landing-page-shell` (ddl-page-shell), `landing-background` (ddl-backgrounds), `landing-browser-window`.

### Composites — MED (non-obvious behavior)
| Component | In DDL? | Priority | Notes |
|---|---|---|---|
| `landing-mega-menu` | ddl-mega-menu | med | |
| `landing-command-palette` | ddl-command-palette | med | uses keyboard service |
| `landing-pagination` | ddl-feed-pagination | med | |
| `landing-filter-chip` | ddl-feed-filter-bar | med | twin of `chip-select`/`chip-boolean` |
| `landing-results-count` | ddl-feed-filter-bar | low | |
| `landing-view-toggle` | ❌ | low | |
| `landing-load-more` | ❌ | low | twin of `show-more`? |
| `landing-social-row` | ddl-get-in-touch | low | |
| `landing-back-link` | ddl-back-link | low | |
| `landing-breadcrumb` | ❌ | low | |
| `landing-globe` | ❌ | low | heavy canvas/WebGL |

### In-page nav family — MED
`landing-toc-sidebar` (ddl-doc-page), `landing-toc-inline` (ddl-fragment-navigation), `landing-section-dots`, `landing-floating-pill-nav`, `landing-reading-progress`, `landing-router-progress` (ddl-router-progress).

### Shell family — LOW
`landing-shell` (ddl-shell), `landing-header`, `landing-footer-banner`, `landing-footer-signature`, `landing-scroll-to-top`.

### Theme / directives / motion — LOW (behavior-only)
- Theme: `landing-theme-toggle`.
- Directives: `[landingCopyToClipboard]`, `[landingProseAnchors]` (ddl-prose-flow), `[landingScrollEdgeFade]` (ddl-scroll-edge-fade), `[hydrationSafeActive]` (med — SSR-critical, documented in `landing-ssr.md`, cross-ref not duplicate), `KeyboardShortcutsDirective`/`KeyboardShortcutService`.
- Motion: `[fxSpotlight]`, `[fxTypeOut]`, `landing-stagger-text` (all ddl-interactions).
- Non-component exports: `CloudinarySrcsetPipe`, `locale`, `theme` service.

---

## Console — `libs/console/shared/ui/` (5 / 30 documented)

### Documented (5)
`console-chip-boolean`, `console-chip-select`, `console-chip-toggle-group` (`chips/` family + `_overview.md`), `console-segmented-control` (`segmented-control.md`).

### HIGH priority undocumented
| Component | In DDL? | Notes |
|---|---|---|
| `console-markdown-editor` | ❌ | TipTap-based; complex, non-obvious |
| `console-translatable-group` | `/ddl/long-form` | i18n field group; non-obvious rules |
| `console-translatable-markdown-group` | ❌ | sibling of above + markdown-editor; undocumented |
| `console-section-card` (+ `[consoleFormSnapshot]`) | `/ddl/long-form` | long-form chassis primitive + structural directive; narrated in console.md/cookbook → promote to bank doc |

### MED priority undocumented
`console-long-form-layout` (`/ddl/long-form`, ADR-013/014 chassis), `console-scrollspy-rail` (`/ddl/long-form`), `console-sticky-save-bar` (`/ddl/long-form`), `console-asset-grid` (DDL), `console-asset-upload-zone` (+ `console-upload-row`, DDL), `console-filter-bar` (+ `console-filter-search`, `console-filter-select`, DDL), `console-media-picker-dialog` (+ `console-recently-used-strip`; cookbook mis-names it `console-media-picker`), `console-confirm-dialog`, `console-month-year-picker`, `console-time-picker`, `console-toast-container` (+ `ToastService`, DDL via service).

### LOW priority
`console-asset-filter-bar` (DDL), `console-timezone-picker`, `console-skeleton` (+ table/row; covered in `loading.md`), `console-spinner` (+ full-page/overlay + `SpinnerService`; `loading.md`), `console-loading-bar` (`loading.md`), `console-relative-time` (`loading.md`), `console-error-message`, `console-blank-layout`, `console-main-layout`, `enum-label` pipe, `rx/with-list-loading` (RxJS helper — exclude from visual bank).

---

## Shared — `libs/shared/ui/` (0 / 9 documented)

| Artifact | Kind | Priority | Notes |
|---|---|---|---|
| `ui-sidebar` family | composite + 7 directives | **high** | `ui-sidebar`, `-provider/-header/-content/-footer/-group/-rail/-inset/-trigger/-menu-sub` + `uiSidebarMenu/MenuItem/MenuSubItem/MenuBadge/MenuSkeleton/Separator`. Largest undocumented surface; used by `console-main-layout`. |
| pipes (`isImage`, `mimeCategory`, `cloudinaryThumb`, `dateRange`, `initials`, `readableSize`, `translatable`, `fileIcon`, `monthYear`) | util-pipe | low | `libs/shared/ui/pipes` |
| `styles` (tokens/themes/base/material) | non-component | n/a | documented via cookbook/scale-contract |

---

## Extraction candidates — code that should move to shared

> Feature/DDL code that should become a reusable shared component. High-confidence rows have real duplication evidence.

| Candidate | Lives now | Why extract | Target | Effort | Conf |
|---|---|---|---|---|---|
| `landing-disclosure` (detail/summary) | `ddl-considered/*` + raw `<details>` at `about.experience.html:189-202` | `ddl-considered` template is literally a generic `<details>` disclosure; same pattern hand-rolled in about | `…/ui/src/components/disclosure` | S | **high** |
| `landing-filter-toolbar` | `projects.html:8-75` **and** `blog.list.html:233-270` (DDL prototype: `ddl-feed-filter-bar`) | results-count + view-toggle + collapsible filter-chip panel + `filtersOpen/clearAll/activeFilterCount` duplicated in both features | `…/components/filter-toolbar` | M | **high** |
| `landing-post-meta` | `blog.list.html` (~63, 302, 337) + `blog.detail.html` (~28) | time + separator + category strip repeated 4+ times | `…/components/post-meta` | S | **high** |
| `landing-decision-record` | `ddl-decision-record/*` | standardized verdict block; DDL-only, no shared equivalent | `…/components/decision-record` | M | med |
| `landing-post-card` (row+grid) | `blog.list.html` + `projects.html` | row/grid list-item cards near-identical across both | `…/components/post-card` | M | med |
| `landing-command-palette` (promote) | already `…/command-palette` in shared barrel; `ddl-command-palette` is the demo | confirm: production version exists; DDL is showcase — **not an extraction**, a doc target | — | — | n/a |
| `landing-feed-item` | `ddl-feed-item/*` | timeline/feed entry; overlaps post-card — evaluate together | `…/components/feed-item` | S | med |
| `landing-stage` | `ddl-stage/*` | "expand to full-viewport preview" behavior; reusable | `…/components/stage` | M | med |
| `landing-locale-switcher` | `ddl-language-switcher/*` (6 variants) | i18n control once locale switch wires up | `…/components/locale-switcher` | M | low |

**False candidate:** `ddl-scroll-edge-fade` — production version already exists as `…/directives/scroll-edge-fade/`; DDL page is just its demo.

---

## DDL gap summary (vs a real doc site like shadcn/Tailwind)

**Already doc-grade (no rework):** registry-as-source-of-truth (`ddl.registry.ts` → sidebar/badges/pager/Reference-vs-Lab split), app-shell, grouped sidebar, auto-TOC, status chip, prev/next pager, `decision-record` + `considered` lab primitives.

**Missing (the content contract):**
1. No **API/Props table** primitive — inputs appear as prose/bullets or not at all (biggest gap).
2. No **Import/Install snippet** — no page shows the import path/selector to copy.
3. **Copy-code rare** — only 8/59 pages pass `[code]`, one snippet each; carousel/lightbox have none.
4. **Disconnected from the bank** — no DDL page links to `.context/design/components/` and vice-versa.
5. **No consumer-API stability facet** — status chip tracks design lifecycle, not consume-ability (stable/beta/deprecated).
6. **Inconsistent section order/vocabulary** — research ("Prototypes") interleaved with consumer docs on the same page.
7. **No standard Accessibility section** and **no Do/Don't** primitive.

**Proposed standard skeleton** (Component page): Title+status(+stability) → Overview/When-to-use → **Import** → Live demo → **API/Props table** → Variants (copy-code each) → Accessibility → Do/Don't → Related + **bank-doc link**.
**5 new DDL primitives** to support it: `ddl-import`, `ddl-api-table`, `ddl-a11y`, `ddl-do-dont`, `ddl-related`. **2 data changes:** `stability` facet on status chip + `bankDoc` field on `DdlEntry` (data-driven DDL↔bank link).
