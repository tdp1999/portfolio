# Console Spacing, Typography & Layout Cookbook

> Actionable decision rules for console pages. No research — just pick the right value.
> Source of truth for spacing: `../contracts/scale-contract.md`. Source of truth for layout
> intent: `../system/console.md`.
>
> **Form-specific how-to moved out:** widget/validator pairs and the new-form checklist live
> in `forms.md`. Section bucketing, field-labeling hierarchy, and bilingual field groups are
> now patterns (`../patterns/section-bucketing.md`, `../patterns/field-labeling-hierarchy.md`,
> `../patterns/bilingual-formgroup.md`).

---

## Spacing — Pick the Right Gap

Use this table at every point of decision. Ask: "What is the relationship between these two elements?"

| Relationship | Tailwind class | px | Example |
|---|---|---|---|
| Icon → its label | `gap-2` | 8 | Scrollspy icon + text, button icon + text |
| Bilingual field pair (EN / VI) | `gap-3` | 12 | Two mat-form-fields for the same field |
| **Fields within a form group** | `gap-4` | 16 | Name EN + Name VI, or unrelated adjacent fields |
| **Between form groups / subsections** | `gap-6` | 24 | "Basic info" group → "Display name" group |
| **Between major sections / cards** | `gap-8` | 32 | Section card → section card (baked into `long-form-layout`) |
| Between independent page regions | `gap-12` | 48 | Page header → scrollspy+content area |

**Rule of thumb:** each level up doubles the gap. Violating this collapses hierarchy.

### What's already baked in — do NOT re-add

| Primitive | What it already applies |
|---|---|
| `console-section-card` | `p-6` (24px) header + form + footer padding |
| `console-section-card` | header zone (`--color-surface-elevated`) + form zone (`--color-surface`) + footer zone (`--color-surface-elevated`) — three distinct visual bands |
| `console-section-card` | `border: 1px solid var(--color-border)` + `border-radius: 12px` — do NOT add extra borders inside |
| `console-section-card` | form content capped at `max-width: 672px` (max-w-2xl) |
| `console-long-form-layout` | `gap-8` (32px) between section cards — requires `<div content class="flex flex-col gap-8">` wrapper in the page |
| Angular Material density `-2` | Label-to-input padding inside `mat-form-field` |

Do not add padding/gap **inside** `mat-form-field` — Material already handles it at density `-2`.

---

## Typography — Pick the Right Class

All classes live in `base/components.scss`. Use exactly these; do not compose ad-hoc.

| Slot | Class | Looks like |
|---|---|---|
| Page H1 | `.text-page-title` | 30px bold, tight tracking |
| Section card title | `.text-section-heading` | 18px semibold |
| Card/dialog header | `.text-card-title` | 16px semibold |
| Description / helper text | `.text-body` + `text-text-secondary` | 14px, gray |
| Form field label (custom) | `.text-body` | 14px, primary text |
| Timestamp, hint, caption | `.text-caption` | 12px, muted |
| Scrollspy label | `.text-body` (14px) | Already set in `.scrollspy-rail__item` |
| Status badge | `.text-badge` | 10px bold uppercase |

**Decision rule:** if it labels a section card → `.text-section-heading`. If it describes/helps → `.text-body text-text-secondary`. If it's fine print → `.text-caption`.

---

## Surface + Text Pairings

| Surface token | Tailwind bg | Text to use | Do NOT use |
|---|---|---|---|
| `--color-background` | `bg-background` | `text-text`, `text-text-secondary` | `text-text-muted` for body copy |
| `--color-surface-elevated` | — (section card bg) | `text-text`, `text-text-secondary` | hardcoded hex |
| Inside error banner | `bg-error-container` | `text-error` (via token) | `text-text-muted` |
| Inside success label | — | `text-success` (via token) | — |

**WCAG AA floor:** `text-text-secondary` (`#4b5563` light / `#94a3b8` dark) on `--color-surface-elevated` passes 4.5:1.  
`text-text-muted` is for captions only — never use it for body copy or field descriptions.

---

## Page Layout & Max-Width Rules

**Boxed-centred standard (ADR-025):** every page is a horizontally-**centred box** so
wide screens keep balanced margins on both sides (no one-sided void). Page wrappers never
set their own padding (the shell already applies `p-8`). Two widths only:

- `--console-page-max` = **1440px** — lists + forms (content that needs the full width, incl. a section rail).
- `--console-reading-max` = **1200px** — detail pages (narrower reading column).

| Context | Rule |
|---|---|
| CRUD list / dashboard page | Boxed 1440, centred. Baked into `.crud-page` (keeps `height:100%` so the table scrolls naturally). |
| Detail page | Boxed reading column 1200, centred. Baked into `.detail-page` (`max-width: var(--console-reading-max)`). |

| Multi-section form | `console-section-tabs` (rail + content) inside a `.console-page` root → boxed 1440, centred. |
| Simple form (single column) | Wrap content in `.console-reading` (1200, centred). |
| Section card form column | Card column keeps lines ≤ ~70 chars; add `.console-reading` on the slot only if it still feels wide. |
| Auth / narrow forms | `max-w-md` (448px) — intentional exception. |

**Detail page internals (ADR-026):** the page body is `console-record-layout` —
content column + `[aside]` rail. Pick the component by **data shape**, not topic:

| What you are rendering | Component |
|---|---|
| Short scalar (slug, status, date, order, tags, links) | `console-property` inside `console-property-list`, in the rail |
| Long-form field (description, motivation, RTE body) | `console-record-field` inside a `console-record-section` |
| Member of a collection (highlight, responsibility) | `console-record-item` inside a `console-record-section` |
| Any of the above, compressed | wrap in `console-record-fold` — **must** pass a `gist` |
| A rail panel (Properties, Content language) | `console-record-panel` |
| Sections absent in full | `console-record-empty-sections` |

- **Never** use `.detail-field` on a detail page — it is superseded for read views.
- **Empty field inside a visible section** → leave it in place, `state="unset"` renders one muted line. **Empty whole section** → omit it, pass the name to `console-record-empty-sections`. Never both.
- **Rail scalars are not sections** — a `console-property` that is empty already reports itself with `Not set`; never also list it in `console-record-empty-sections`.
- **Partial section** → pass `[gaps]` so the header says so.
- **Attribute-only record** (tag/category/skill) → project nothing into the content slot; the grid collapses on its own.
- Section names and order must match the entity's form 1:1.

**Boxing utility:** `.console-page` (max `--console-page-max`, `margin-inline:auto`, `width:100%`)
adds width + centring only, so it composes with a root's own flex/grid layout. Use it on any
page root that isn't already `.crud-page` / `.detail-page` (e.g. section-tabs form roots).

**List toolbar:** use `console-filter-bar` (a **bare** flex row — no surrounding card) +
`console-filter-search`. The search field fills the row (`flex-1`) clamped **300–1200px**, so
filters/actions after it sit to the right (`ml-auto` on the first trailing control).

**List table + pagination:** put the table in `.crud-table-container` with a sibling
`<mat-paginator class="crud-pagination">`. Shared CSS joins them **flush** into one bordered
card (no gap). Don't add your own wrapper or spacing.

**Badges / status pills:** use the shared `.console-badge` class (`--success` / `--warn` /
`--danger` / `--muted`) for status cells, detail-header status, and header count badges. Never
hand-roll Tailwind pills (`rounded-full bg-green-100 …`).

**Reference:** `/ddl/anatomy-{list,detail,form}` are built on these exact shared components —
use them as the living spec.

**Page header:** use the shared `.console-page-header` primitive (`__titles` + optional
`__subtitle` + optional `__actions`) so every page header reads the same. List pages may
keep `.crud-header`; detail pages `.detail-header`.

**Never** add page-level `padding` (the shell owns it).

---

## Material Density `-2` Interaction

The console global theme sets `$density: -2` on all form fields. This means:

- Form-field height: **48px** (not 56px default)
- Internal padding already applied — **do not** add `pt-*` / `pb-*` to inputs
- Use `gap-4` (16px) **between** `mat-form-field` elements, not tighter

If a section feels cramped: the problem is almost never field density. Check gap between **groups** first (`gap-4` → `gap-6`).
