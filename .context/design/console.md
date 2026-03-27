# Console Design

> Design rules, components, and patterns for the console/dashboard application.
> For shared tokens and foundations, see `foundations.md`.

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
