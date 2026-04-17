# Console Design

> Design rules, components, and patterns for the console/dashboard application.
> For shared tokens and foundations, see `foundations.md`.
> **Before writing console HTML/SCSS:** use `console-cookbook.md` for spacing and typography decisions.

## Styling Approach

Console uses **Angular Material v21** as the primary component library, with semantic tokens mapped via `mat.theme-overrides()`.
Custom components use `console-` prefix. Import from `@portfolio/console/shared/ui`.

**Key files:**

- `libs/console/shared/ui/src/styles/material/_overrides.scss` — Material token overrides, CRUD template, search field
- `apps/console/src/styles.scss` — Global console styles (imports shared tokens + Material theme)

## Theme Support

Console supports light and dark mode via `ThemeService` (toggles `.dark` class on `<html>`).

- **Color tokens:** CSS custom properties in `:root` (light) and `.dark` (dark) — see `foundations.md`
- **Material theme:** Base `theme-type: dark` with all surface/text tokens overridden by CSS variables
- **Rule:** All component styles MUST use `var(--color-*)` tokens, never hardcoded hex. Exception: brand colors (e.g., Google SVG).
- **Theme-adaptive effects:** Use `:host-context(.dark)` for dark-specific overrides (grain opacity, glow intensity, shadows)

## Component Inventory

| Component | Description |
|-----------|-------------|
| `ConsoleMainLayoutComponent` | Sidebar + content layout with grain texture and radial glow overlay |
| `ConsoleBlankLayoutComponent` | Auth layout: centered card, grain+glow background, logo, footer |
| `FilterBarComponent` | Search + filter controls for list views |
| `ToastContainerComponent` | Notification toasts (via `ToastService`) |
| `LoadingBarComponent` | Top-of-page loading indicator |
| `SkeletonComponent` | Content placeholder during loading |
| `FullPageSpinnerComponent` | Blocking spinner overlay |
| `ConfirmDialogComponent` | Material dialog for destructive action confirmation |
| `ErrorMessageComponent` | Inline error display |

## Material Overrides

Material components are customized to use the project's semantic tokens. Density is set to `-2` (compact).

Overrides are defined in `libs/console/shared/ui/src/styles/material/_overrides.scss` covering:
- Form fields, buttons, icon buttons, menus, checkboxes, progress spinners
- All interactive states (focus, hover, disabled, error)
- Button hover: filled buttons get `brightness(1.08)`, outlined buttons get indigo hover glow

## Visual Effects

- **Grain texture:** SVG noise overlay on main content and auth pages. Dark mode: `opacity: 0.025-0.04`; Light mode: `opacity: 0.02-0.03`
- **Radial glow:** Indigo gradient overlay. Dark: `rgba(99,102,241, 0.06-0.2)`; Light: `rgba(99,102,241, 0.03-0.08)`
- **Hover glow:** Interactive elements get `box-shadow: 0 0 20px -5px rgba(99,102,241,0.15)` on hover
- **Transitions:** All interactive elements use `transition: all 0.15s ease`
- **No box-shadow on cards/tables** — borders provide visual separation
- **No parallax, bouncing, or scaling animations**

## Long-Form / Settings Page Layout Contract

Applies to any console page editing many fields (Profile, Experience, Project,
Article, future entities). Backed by ADR-013 (layout chassis) and ADR-014
(save semantics). Bank refs: `bank/patterns/long-form-layout.md`,
`bank/patterns/settings-section.md`, `bank/patterns/atomic-save.md`.

### Page Skeleton

```
┌─────────────────────────────────────────────────┐
│ Page header: title · subtitle  ·  [save bar?]   │
├──────────────┬──────────────────────────────────┤
│ Scrollspy    │  [Section card 1]                │
│ rail         │  description-left · form-right   │
│ (sticky)     │                                  │
│ ● Identity   │  ─── 32px gap, no rule ───       │
│ ○ Work       │  [Section card 2]                │
│ ○ Skills     │  …                               │
│ ⚠ Achiev.    │                                  │
└──────────────┴──────────────────────────────────┘
                                  [Sticky save bar — atomic only]
```

### Layout Rules

- **Outer container**: full content width of console main layout. No max-width
  on the wrapper — `max-width` only on the right-side form column inside each
  section card (~640–720px for ≈45–75 char line length).
- **No top tabs**. Cross-page navigation lives in the console sidebar / routes.
- **No 3-column layouts**. The console main sidebar may collapse on long-form
  detail pages to keep visual density low.
- **Scrollspy rail**: 200–220px wide, sticky to viewport top under the header,
  surface_container background, no border.
- **Section cards**: surface_container_high, no box-shadow (border-only per
  existing console rule), 32px vertical gap between cards, no horizontal rule.
- **Section card layout**: 30/35% description column · 65/70% form column. Form
  column uses single-column field stack except for semantically paired fields
  (e.g., First/Last name, Currency/Amount).

### Scrollspy Rail Spec

| Element | Spec |
|---|---|
| Width | 200–220px |
| Position | `position: sticky; top: <header-height + 16px>` |
| Background | `var(--color-surface-container)` |
| Items | One per section card; flex row with status icon + label |
| Active item | Primary text color + 3px primary left accent bar |
| Hover item | Subtle surface tonal shift, no background fill |
| Status icons | `✓` saved · `●` editing (dirty) · `⚠` error · `○` untouched |
| Click | Smooth scroll to section anchor + update URL fragment |
| Implementation | Angular CDK `ScrollDispatcher` + `IntersectionObserver`; no third-party |

### Section Card Spec

| Element | Spec |
|---|---|
| Background | `var(--color-surface-container-high)` |
| Border | None (or 1px ghost border at 15% opacity if accessibility requires) |
| Radius | `var(--radius-lg)` (per existing scale) |
| Padding | 24px |
| Anchor id | `section-{slug}` matching scrollspy entry |
| Header | Section title (title-lg semibold) + description (body-sm, on_surface_variant) on the LEFT column |
| Form | Label-above-input; field labels use existing typography classes |
| Per-section footer (per-section save mode only) | Right-aligned `[Cancel] [Save section]` with dirty indicator |

### Save UX — Choose by Module Type (ADR-014)

#### Per-Section Save (Settings / Preferences — e.g., Profile)
- Each section card has its own `[Cancel] [Save section]` footer
- Save button enabled only when section is dirty
- Successful save: optimistic update + small inline confirm "Saved 2s ago"
- Failed save: inline error banner inside the card; other sections unaffected
- No global sticky save bar
- `CanDeactivate` guard if **any** section is dirty

#### Atomic Save (Domain entity — e.g., Experience, Project)
- Single sticky save bar bound to bottom of viewport, appears when form dirty
  - Layout: `[● Unsaved changes]    [Discard]    [Save changes]`
  - Save: primary, loading state during request
  - Discard: ghost; opens confirm dialog
- Submit-time validation summary banner at top of content on submit failure:
  `"3 errors in 2 sections — Skills (1), Achievements (2)"` with field links
- Scrollspy rail shows `⚠` on sections with errors; click → scroll + focus first error
- `CanDeactivate` guard + `beforeunload` listener for unsaved changes
- Optional tier 2: localStorage draft autosave every 30s; restore prompt on return

### Anti-patterns (rejected; do not introduce)

- Top tabs inside a long-form page (use routes for cross-page nav)
- Accordions as primary structure
- 3-column layouts (sidebar + scrollspy + content)
- Single Save button at page bottom with no sticky bar
- Sticky nav without scrollspy active state
- Section card without anchor id (breaks scrollspy + deep-link)
- Form left-aligned with `max-width` but unaligned outer container (the bug
  this layout contract was created to fix)

### Component Inventory

| Component | Selector | Library | Status |
|-----------|----------|---------|--------|
| `LongFormLayoutComponent` | `console-long-form-layout` | `@portfolio/console/shared/ui` | ✓ shipped |
| `ScrollspyRailComponent` | `console-scrollspy-rail` | `@portfolio/console/shared/ui` | ✓ shipped |
| `SectionCardComponent` | `console-section-card` | `@portfolio/console/shared/ui` | ✓ shipped |
| `StickySaveBarComponent` | `console-sticky-save-bar` | `@portfolio/console/shared/ui` | ✓ shipped |
| `UnsavedChangesGuard` | `canDeactivate` fn | `@portfolio/console/shared/util` | ✓ shipped |

## Bilingual FormGroup Convention

Applies to any console form editing translatable (EN/VI) fields (Profile, Project,
Experience, Article, …). Backs the long-form chassis so all consumers share one
shape. Demoed on `/ddl/long-form` (Basics card).

### Rule

**In the FE reactive form, bilingual fields are modelled as a nested FormGroup
keyed by language code:**

```ts
this.fb.group({
  name: this.fb.group({
    en: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
    vi: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
  }),
  title: this.fb.group({
    en: this.fb.control('', { nonNullable: true }),
    vi: this.fb.control('', { nonNullable: true }),
  }),
});
```

**Templates** bind through `formGroupName="name"` then `formControlName="en" / "vi"`,
so one bilingual field = one visual pair in the UI.

### Why nested `{ en, vi }` (chosen) over flat `{ field_en, field_vi }` (rejected)

| Concern | Nested `{ en, vi }` | Flat `field_en, field_vi` |
|---|---|---|
| Section dirty detection | `sectionForm.get('name').dirty` covers both languages at once | must OR two controls |
| Adding a third language (e.g. `ja`) | drop a new control inside the existing group | schema + every consumer updates |
| Matches domain value object (`TranslatableText { en, vi }`) | 1:1 | needs mapping on every read |
| Reusable `TranslatableInputComponent` CVA shape (`Record<string,string>`) | drops in with `formControlName` + nested group | requires custom glue |
| Storage-agnostic (JSON translatable blob) | renders `{ en, vi }` verbatim | needs split columns or mapping |
| Matches current HTTP DTO shape | **no** — DTO is flat `field_en` / `field_vi` | yes |

The only trade-off that goes to flat is **HTTP DTO alignment**. We absorb that
cost at the mapper layer rather than in every FormGroup.

### Boundary mapping

```
Domain / FE FormGroup  ←── mapper ──→  HTTP DTO / BE Zod schema
{ name: { en, vi } }                    { name_en, name_vi }
```

- **Read**: `mapDtoToForm(dto)` — flatten keys `foo_en|foo_vi` into `{ foo: { en, vi } }`.
- **Write**: `mapFormToDto(value)` — lift nested group back into `foo_en`/`foo_vi`.
- Keep mapping in the feature library's command/data-access layer, not in the
  component. Components see only the nested shape.

> If/when the BE migrates to a translatable JSON column (`name JSONB = { en, vi }`),
> the FE shape does not change; the mapper becomes a no-op.

### Scope

- **FE FormGroups**: nested `{ en, vi }` everywhere.
- **FE display types / DTOs from API**: keep today's flat `*_en` / `*_vi` until
  the BE storage decision (ADR-pending) is made. Mappers bridge the two.
- **Shared UI (`TranslatableInputComponent`)** already expects
  `Record<string, string>` — plug it into a nested group with
  `formControlName="name"` to get both languages in one control; use the split
  form-pair pattern (see `/ddl/long-form`) when you want full Material form-field
  chrome per language.

## CRUD Page Template

Reusable CSS classes for list/management pages:

- `.crud-page` — flex column layout
- `.crud-header` — title + action button row
- `.crud-table-container` — bordered, rounded table wrapper with header/row/hover styles
- `.crud-pagination` — sticky bottom paginator
- `.col-actions` — 3-dot menu column

## Auth Pages (Blank Layout)

Centered card on full-page background:

- **Background:** `var(--color-background)` with grain texture + indigo radial glow
- **Card:** `var(--color-surface)`, `var(--color-border)`, rounded-2xl, max-w-420px, 32px padding
- **Light mode:** Card gets subtle shadow (`0 4px 24px rgba(0,0,0,0.06)`); Dark mode: no shadow
- **Logo:** 48px circle with `var(--color-primary)` background, white "C"
- **Footer:** `text-text-muted`, "© 2026 Console Portfolio Management"
- **Subtitles:** Use `text-text-secondary` (not `text-text-muted`) for readability

**Stitch reference:** screen `bbe44133aede44be` in project `17973930401225587522`

## Changelog

- [2026-03-27] Updated — added auth layout, visual effects, theme support, CRUD template, Stitch reference
- [2026-04-13] Added — Long-form / Settings page layout contract (ADR-013, ADR-014). Sectioned cards + sticky scrollspy rail chassis, per-section vs atomic save mechanic, component inventory.
- [2026-04-14] Added — Bilingual FormGroup convention: nested `{ en, vi }` FormGroup per field in FE forms; flat `*_en` / `*_vi` on HTTP DTO; mapper bridges the two. Demoed on `/ddl/long-form`.
