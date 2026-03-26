# Scale Contract

> Authoritative reference for all spatial, typographic, and sizing values. Code must derive from this contract.
> Enforced by: Claude hook (`scripts/scale-audit.js`), pre-commit lint-staged, CLAUDE.md guardrails.

## 4px Grid Rule

Every fixed pixel value MUST be a multiple of 4.

| Category | Policy |
|----------|--------|
| **Multiples of 4** (8, 12, 16, 20, 24, 32, 40, 48...) | Always allowed |
| **Even non-multiples** (6, 10, 14, 18) | Sparingly, justified in exceptions table |
| **Odd values** (9, 11, 13, 15) | Banned |
| **1px** (border-width) | Exempt — CSS convention |

### Accepted Even Exceptions

| Value | Where | Justification |
|-------|-------|---------------|
| `6px` | `rounded-md` border-radius | Tailwind/industry standard |
| `10px` | `--text-2xs` token (group labels, badges) | Micro-label size, smallest readable uppercase |
| `18px` | `line-height` in compact inputs | Even, close to 20px but needed for density |
| `2px` | Micro-spacing (prefix icon margin) | Sub-component adjustment |

### Angular Material Density

Only use even densities: 0, -2, -4.

| Density | Form-field height | Padding | 4px? |
|---------|-------------------|---------|------|
| 0 | 56px | 16px | Yes |
| **-2** | **48px** | **12px** | **Yes (current)** |
| -4 | 40px | 8px | Yes |

## Typography Hierarchy

Unified classes in `base/components.scss`, used by ALL apps.

| Class | Composition | Usage |
|-------|-------------|-------|
| `.text-page-title` | `text-3xl font-bold tracking-tight text-text` | Page H1 |
| `.text-page-subtitle` | `text-base text-text-secondary` | Below page title |
| `.text-section-heading` | `text-lg font-semibold text-text` | Section H2 |
| `.text-card-title` | `text-base font-semibold text-text` | Card/dialog headers |
| `.text-stat-label` | `text-xs font-bold text-text-muted uppercase tracking-widest` | KPI labels |
| `.text-stat-value` | `text-3xl font-bold text-text` | KPI numbers |
| `.text-body` | `text-sm text-text leading-normal` | Descriptions, cells |
| `.text-caption` | `text-xs text-text-muted` | Timestamps, helpers |
| `.text-nav-item` | `text-sm` | Sidebar nav items |
| `.text-nav-label` | `text-2xs` + font-bold uppercase tracking-[0.1em] #64748b | Group labels |
| `.text-badge` | `text-2xs` font-semibold uppercase leading-none | Badges |

### Font Weights (allowed)

300 (font-light), 400 (font-normal), 500 (font-medium), 600 (font-semibold), 700 (font-bold). No 800.

## Layout Tokens

CSS custom properties in `tokens/layout.scss`:

| Token | Value |
|-------|-------|
| `--layout-sidebar-expanded` | 240px |
| `--layout-sidebar-collapsed` | 64px |
| `--layout-topbar-height` | 48px |
| `--layout-content-padding` | 32px (2rem) |
| `--layout-footer-min-height` | 40px |

## Component Spacing

| Context | Class | px |
|---------|-------|-----|
| Card internal | `p-6` | 24 |
| Sidebar nav icon-to-text | `gap-3` | 12 |
| Inline icon-to-text | `gap-2` | 8 |
| Card grid gap | `gap-4` | 16 |
| Section grid gap | `gap-8` | 32 |
| Sidebar content | `p-4` | 16 |
| Sidebar group gap | `gap-6` | 24 |
| Sidebar item gap | `space-y-1` | 4 |
| Sidebar item padding | `px-3 py-2.5` | 12/10 |
| Sidebar header/footer | `p-4` | 16 |
| Topbar | `px-4 py-2` | 16/8 |
| Footer | `px-6 py-3` | 24/12 |
| Page title to content | `mb-8` | 32 |

## Content Max-Widths

| Page type | Tailwind | Notes |
|-----------|----------|-------|
| Dashboard | `max-w-7xl mx-auto` | Card-based, benefits from max-width |
| CRUD list / table pages | No max-width (fluid) | Tables fill available space |
| Settings / forms | `max-w-md` | Narrow form container |
| Auth card | `max-w-md` | Centered login/reset card |

## Component Sizes

| Component | Size |
|-----------|------|
| Button sm/md/lg | 32/40/48px |
| Avatar sm/md | 32/40px (`h-8 w-8` / `h-10 w-10`) |
| Stat card icon container | 40px (`h-10 w-10 rounded-lg`) |
| Activity icon container | 32px (`h-8 w-8 rounded-full`) |
| Form-field (density -2) | 48px |
| Icon-button touch target | 40px |

## Border Radius

| Element | Class | px |
|---------|-------|-----|
| Sidebar menu items | `rounded-md` | 6 |
| Buttons, inputs, menus | `rounded-lg` | 8 |
| Cards, tables | `rounded-xl` | 12 |
| Auth card, modals | `rounded-2xl` | 16 |
| Avatars | `rounded-full` | -- |

**Nested radius:** inner <= outer - padding.

## Icon Sizes

Classes in `material/icons.scss` (no `!important`):

| Class | Size | Usage |
|-------|------|-------|
| `.icon-sm` | 16px | Inline badges |
| `.icon-md` | 20px | Sidebar items, button icons, stat cards |
| (default) | 24px | Topbar actions |
| `.icon-xl` | 32px | Feature icons |
| `.icon-2xl` | 48px | Empty states, upload |

## Interaction Targets

| Context | Min |
|---------|-----|
| Desktop click | 32px |
| Mobile touch | 44px |
| Icon-button | 40px |

## Design Quality Checklist (Manual Review)

- [ ] Peer components have matching font-size (all stat cards, all nav items, all table headers)
- [ ] Peer components have matching dimensions (all cards same height, all buttons same size per variant)
- [ ] Vertical alignment: elements in the same row share baseline
- [ ] Text readability: no text-muted on dark backgrounds where contrast < 4.5:1
- [ ] Spacing rhythm: section gaps are consistent (mb-8 between sections)
- [ ] Visual weight balance: content does not cluster to one side
- [ ] Responsive behavior: layout does not break at 1024px, 768px breakpoints
