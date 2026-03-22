# Console Design

> Design rules, components, and patterns for the console/dashboard application.
> For shared tokens and foundations, see `foundations.md`.

## Styling Approach

Console uses **Angular Material v21** as the primary component library, with semantic tokens mapped via `mat.theme-overrides()`.
Custom components use `console-` prefix. Import from `@portfolio/console/shared/ui`.

**Key files:**

- `libs/console/shared/ui/src/styles/material/_overrides.scss` — Material token overrides
- `apps/console/src/styles.scss` — Global console styles (imports shared tokens + Material theme)

## Component Inventory

| Component | Description |
|-----------|-------------|
| `ConsoleMainLayoutComponent` | Sidebar + content layout with Material toolbar |
| `ConsoleBlankLayoutComponent` | Full-page layout without sidebar (login, errors) |
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
- Form fields, buttons, menus, checkboxes, progress spinners
- All interactive states (focus, hover, disabled, error)
