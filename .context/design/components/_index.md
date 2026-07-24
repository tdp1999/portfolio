# Components — registry

Living index of documented components. One line each: doc → one-line contract → global parent.
This is the registry, not a snapshot — add a row when a component doc is written, edit the line
when its contract changes. (The dated coverage audit lives in the epic, not here:
`../../plans/epic-component-docs-and-ddl.md` → Appendix.)

## Landing — `libs/landing/shared/ui`

| Doc | Contract in one line | Global parent |
|---|---|---|
| `card.md` | Translucent surface panel; glass gated to `laptop+`, flat fill below (perf). | `taste/expensive-effects-and-progressive-enhancement` |
| `carousel.md` | One reusable slider; image/content modes; one-slide-per-gesture; 6px click-through. | `patterns/carousel-and-gestures` |
| `lightbox.md` | Opt-in full-screen zoom/pan viewer; JS computes, CSS renders; FLIP open/close. | `patterns/image-lightbox` |
| `landing-gallery.md` | Count-aware curated grid (1–4); layout per count; no filler padding. | `patterns/count-aware-gallery` |
| `show-more.md` | Overflow disclosure (toggle/scroll); SSR-expanded; self-measuring. | `patterns/overflow-disclosure` |

## Console — `libs/console/shared/ui`

| Doc | Contract in one line | Global parent |
|---|---|---|
| `segmented-control.md` | Single-select sliding pill; value never null; equal-width shrink rule. | `patterns/segmented-control` |
| `chips/_overview.md` | Chip toggle family; three members by value shape; null-safe; `mat-chip-listbox`. | `patterns/chip-toggles` |
| `chips/chip-select.md` | One-of-N, always set (`FormControl<Enum>`). | `patterns/chip-toggles` |
| `chips/chip-toggle-group.md` | Many-of-N (`FormControl<string[]>`). | `patterns/chip-toggles` |
| `chips/chip-boolean.md` | On/off single concept (`FormControl<boolean>`). | `patterns/chip-toggles` |
| `record-view/_overview.md` | `console-record-*` read chassis; slot model + 3-layer logic split. | `patterns/read-view-chassis`, `patterns/record-detail-layout` |

## Feature composites (not shared-barrel exports)

| Doc | Contract in one line | Notes |
|---|---|---|
| `about-experience.md` | Sticky-tab career history for the About page; desktop tablist / mobile accordion. | Project-only (`feature-about`); low novelty. |
| `brand-motif.md` | Lines-only blueprint-grid background; the Dot is reserved for the mark. | Brand identity (`shared/features/brand`); see brand epic. |

> **Coverage gap:** most shared primitives are still undocumented — see the audit appendix in
> `../../plans/epic-component-docs-and-ddl.md`. Add rows here as docs land.
