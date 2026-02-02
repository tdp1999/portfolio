# Epic: Comprehensive Design System Implementation

**Status:** ready
**Created:** 2026-02-02
**Complexity:** XL (Foundational infrastructure with multiple phases)

## Overview

A comprehensive, CSS variable-based design system built on **SCSS + Angular Material v21 + Tailwind CSS v4**, designed for timelessness, configurability, and professional refinement.

**Design Philosophy:** Professional & Refined, minimal animations, generous spacing
**Core Features:**
- Dashboard-configurable accent color via HSL-based dynamic palette generation (deferred to Phase 5)
- Tailwind v4 for spacing, layout, and effect utilities
- Build-time configurable icon component
- Base component library with example implementations

---

## Why

The portfolio project needs a consistent, professional design foundation that:
1. **Ensures visual consistency** across all pages and components
2. **Enables rapid development** with pre-built, tested components
3. **Supports theming** for dark/light modes and future accent color customization
4. **Provides scalability** through industry-standard token architecture
5. **Aligns with TDD principles** by co-locating tests with components

Currently, the project has SCSS configured but no design tokens, components, or styling patterns defined. This epic establishes the complete foundation.

---

## Target Users

- **Developers:** Reusable components and styling utilities for building features
- **Future Dashboard Users:** Will configure accent colors and theme preferences (Phase 5)
- **Portfolio Visitors:** Experience consistent, accessible, professional design

---

## Scope

### In Scope (Phases 1-4)
- Tailwind CSS v4 installation and configuration with custom color/typography tokens
- HSL-based accent color palette (hardcoded, configurable later)
- Angular Material v21 installation and theme integration
- Lucide icon system with provider architecture
- Base component library: Button, Card, Input, Badge, Link, Container, Section
- Dark mode CSS token overrides (manual toggle initially)
- Example implementations in landing app (hero section, card grid)
- SCSS patterns documentation in `.context/patterns.md`
- Typography system with fluid clamp() scaling
- Comprehensive test coverage for all components

### Out of Scope (Deferred)
- **Phase 5:** Dashboard-configurable accent colors (requires API, dashboard app, theme service)
- **Phase 5:** Runtime theme toggle component and persistence
- **Phase 5:** System theme detection and preference sync
- Material Symbols, Heroicons, Tabler icon providers (only Lucide initially)
- Storybook documentation (manual testing + example usage sufficient for now)
- Advanced components (Modals, Dropdowns, Tables, Forms) - future epics
- Animation utilities beyond basic transitions
- Print stylesheets and PWA styling

---

## Architecture: Three-Layer Token System

Based on industry best practices ([Martin Fowler](https://martinfowler.com/articles/design-token-based-ui-architecture.html), [Material Design 3](https://m3.material.io/foundations/design-tokens), [W3C Design Tokens](https://uxdesign.cc/design-tokens-with-confidence-862119eb819b)):

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: Component Tokens (where)                              │
│  --button-bg, --card-border, --input-focus-ring                │
│  Maps decisions to specific UI elements                         │
│  → Defined in component .scss files                            │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: Semantic/Decision Tokens (how)                        │
│  --color-surface, --color-primary, --text-body                 │
│  Contextual application of options                              │
│  → Defined in libs/ui/styles/tokens/*.css                      │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: Option/Primitive Tokens (what)                        │
│  --accent-50...900, --gray-50...900, --text-xs...5xl           │
│  Raw design values (Tailwind defaults + custom colors)          │
│  → Defined in @theme via Tailwind CSS v4                       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Layer 1 (Primitives):** Tailwind handles spacing (p-4), gray scale (gray-50), effects (shadow-sm). We add custom colors (accent palette via HSL) and typography (fluid clamp scale).
- **Layer 2 (Semantic):** CSS variables map primitives to purpose (--color-primary = --color-accent-500). Dark mode overrides semantic tokens.
- **Layer 3 (Component):** Components reference semantic tokens (button uses --color-primary, not --color-accent-500 directly).

**Benefits:**
- **Consistency:** Changing --color-primary updates all components
- **Theming:** Dark mode only updates Layer 2, Layer 3 inherits changes
- **Scalability:** New components use existing semantic tokens, no new color definitions needed

---

## Tailwind CSS v4 Integration Strategy

### What Tailwind Handles (Utilities)

Use Tailwind's built-in utilities for:
- **Spacing:** `p-4`, `m-8`, `gap-6`, `space-y-4` (Tailwind's default scale)
- **Layout:** `flex`, `grid`, `container`, `max-w-*`, responsive breakpoints (`sm:`, `md:`, etc.)
- **Effects:** `shadow-sm`, `rounded-lg`, `transition-colors`, `duration-150`
- **Z-index:** `z-10`, `z-50`, etc.

### What We Customize (CSS Variables)

Define custom tokens that Tailwind references:
- **Colors:** Dynamic accent palette, semantic color mappings
- **Typography:** Font families, fluid type scale
- **Component-specific tokens:** Button, card, input styles

### Tailwind v4 Configuration

```css
/* apps/landing/src/styles.css (or tailwind entry) */
@import "tailwindcss";

@theme {
  /* === COLORS (Custom) === */
  /* Accent - HSL-based for dashboard configurability */
  --color-accent-50: hsl(var(--accent-hue) var(--accent-saturation) 97%);
  --color-accent-100: hsl(var(--accent-hue) var(--accent-saturation) 94%);
  --color-accent-200: hsl(var(--accent-hue) var(--accent-saturation) 86%);
  --color-accent-300: hsl(var(--accent-hue) var(--accent-saturation) 74%);
  --color-accent-400: hsl(var(--accent-hue) var(--accent-saturation) 62%);
  --color-accent-500: hsl(var(--accent-hue) var(--accent-saturation) 50%);
  --color-accent-600: hsl(var(--accent-hue) var(--accent-saturation) 42%);
  --color-accent-700: hsl(var(--accent-hue) var(--accent-saturation) 34%);
  --color-accent-800: hsl(var(--accent-hue) var(--accent-saturation) 26%);
  --color-accent-900: hsl(var(--accent-hue) var(--accent-saturation) 18%);

  /* Semantic colors */
  --color-primary: var(--color-accent-500);
  --color-primary-hover: var(--color-accent-600);
  --color-surface: #ffffff;
  --color-background: #fafafa;

  /* === TYPOGRAPHY (Custom) === */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Fluid type scale */
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-base: clamp(1rem, 0.925rem + 0.4vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.5rem + 1.75vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem);
  --text-5xl: clamp(3rem, 2rem + 4vw, 4.5rem);

  /* === CUSTOM EASINGS === */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Configurable base values (set via dashboard/SSR) */
:root {
  --accent-hue: 210;
  --accent-saturation: 65%;
}
```

This gives you utilities like:
- `bg-accent-500`, `text-accent-600`, `border-accent-200`
- `text-primary`, `bg-surface`, `bg-background`
- `font-sans`, `font-mono`
- `text-xs` through `text-5xl` (fluid)

---

## 1. Color System

### 1.1 Foundation: HSL-Based Dynamic Accent

```css
:root {
  /* Configurable base (set via dashboard/API) */
  --accent-hue: 210;
  --accent-saturation: 65%;
}
```

Tailwind's `@theme` generates the full palette from these base values.

### 1.2 Neutral Palette

Use Tailwind's default `gray` scale (`gray-50` through `gray-950`). No customization needed.

### 1.3 Semantic Color Tokens

```css
@theme {
  /* Light mode semantic tokens */
  --color-background: theme(colors.gray.50);
  --color-surface: #ffffff;
  --color-surface-elevated: #ffffff;

  --color-primary: var(--color-accent-500);
  --color-primary-hover: var(--color-accent-600);
  --color-primary-container: var(--color-accent-100);

  --color-text: theme(colors.gray.900);
  --color-text-secondary: theme(colors.gray.600);
  --color-text-muted: theme(colors.gray.400);
  --color-text-on-primary: #ffffff;

  --color-border: theme(colors.gray.200);
  --color-border-strong: theme(colors.gray.300);

  /* Feedback */
  --color-success: theme(colors.green.500);
  --color-warning: theme(colors.amber.500);
  --color-error: theme(colors.red.500);
  --color-info: var(--color-accent-500);
}

/* Dark mode */
.dark {
  --color-background: theme(colors.gray.950);
  --color-surface: theme(colors.gray.900);
  --color-surface-elevated: theme(colors.gray.800);

  --color-primary: var(--color-accent-400);
  --color-primary-hover: var(--color-accent-300);
  --color-primary-container: var(--color-accent-900);

  --color-text: theme(colors.gray.50);
  --color-text-secondary: theme(colors.gray.400);
  --color-text-muted: theme(colors.gray.500);

  --color-border: theme(colors.gray.800);
  --color-border-strong: theme(colors.gray.700);
}
```

### 1.4 Angular Material Integration

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  @include mat.theme((
    color: mat.$azure-palette,
    typography: 'Inter',
    density: 0,
  ));

  // Override Material tokens with our semantic tokens
  @include mat.theme-overrides((
    primary: var(--color-primary),
    on-primary: var(--color-text-on-primary),
    surface: var(--color-surface),
    on-surface: var(--color-text),
  ));
}
```

---

## 2. Typography System

### 2.1 Font Stack

Defined in Tailwind `@theme` (see above):
- `--font-sans`: Inter with system fallbacks
- `--font-mono`: JetBrains Mono with system fallbacks

### 2.2 Type Scale

Fluid scale using `clamp()`, defined in `@theme`. Use via:
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`

### 2.3 Semantic Typography Classes

```css
/* Base typography layer */
@layer base {
  h1 { @apply text-5xl font-semibold leading-tight tracking-tight; }
  h2 { @apply text-4xl font-semibold leading-tight; }
  h3 { @apply text-3xl font-semibold leading-snug; }
  h4 { @apply text-2xl font-medium leading-snug; }
  h5 { @apply text-xl font-medium leading-normal; }
  h6 { @apply text-lg font-medium leading-normal; }

  p { @apply text-base leading-relaxed; }

  code { @apply font-mono text-sm; }
}
```

---

## 3. Spacing, Layout & Effects (Tailwind Native)

### 3.1 Spacing

**Use Tailwind's default scale.** No customization needed.
- `p-1` (4px) through `p-96` (384px)
- Same for margin, gap, space-between, etc.

For "generous/airy" feel, use larger values:
- Component padding: `p-4` to `p-8`
- Section spacing: `py-16` to `py-32`
- Page margins: `px-4 md:px-8`

### 3.2 Layout

**Use Tailwind's layout utilities:**
- Container: `container mx-auto max-w-4xl` (or `max-w-6xl` for wide)
- Flexbox: `flex items-center justify-between gap-4`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8`
- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes

### 3.3 Effects

**Use Tailwind's built-in utilities:**

**Shadows:**
- `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`
- Cards: `shadow-sm hover:shadow-md`
- Modals: `shadow-2xl`

**Border Radius:**
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`
- Buttons: `rounded-lg`
- Cards: `rounded-xl`
- Badges: `rounded-full`

**Transitions (Minimal & Subtle):**
- `transition-colors duration-150 ease-in-out`
- `transition-shadow duration-150`
- `transition-transform duration-150`

**Z-Index:**
- `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`

---

## 4. Icon System (Build-Time Configurable)

### 4.1 Architecture

A wrapper component that abstracts the icon source, allowing build-time switching:

```typescript
// libs/ui/src/lib/icon/icon.component.ts

// Icon provider interface
export interface IconProvider {
  getIcon(name: string): Type<unknown> | null;
}

// Environment-based configuration
// Set in environment.ts or via build configuration
export const ICON_PROVIDER = new InjectionToken<IconProvider>('ICON_PROVIDER');
```

### 4.2 Supported Icon Sets

Build-time selection from:
1. **Lucide** (default) - Clean, professional, 1000+ icons
2. **Material Symbols** - Google's icon set, good Material integration
3. **Heroicons** - By Tailwind team, minimal style
4. **Tabler Icons** - Large collection, consistent stroke width

### 4.3 Icon Component Usage

```html
<!-- Template usage (icon set determined at build time) -->
<app-icon name="arrow-right" size="md" class="text-primary" />
<app-icon name="check" size="lg" [strokeWidth]="2" />
```

### 4.4 Configuration

```typescript
// apps/landing/src/app/app.config.ts
import { provideIcons, lucideIconProvider } from '@portfolio/ui/icon';

export const appConfig = {
  providers: [
    provideIcons(lucideIconProvider),  // or materialIconProvider, heroiconsProvider
  ]
};
```

To switch icon sets, change the provider and rebuild.

### 4.5 Icon Sizing (Tailwind Classes)

Use Tailwind's `size-*` utilities:
- `size-4` (16px) - sm
- `size-5` (20px) - md (default)
- `size-6` (24px) - lg
- `size-8` (32px) - xl

---

## 5. Base Components

Components in `libs/ui/` using semantic tokens + Tailwind utilities:

| Component | Implementation |
|-----------|----------------|
| Button | `bg-primary text-on-primary rounded-lg px-4 py-2 transition-colors hover:bg-primary-hover` |
| Card | `bg-surface rounded-xl shadow-sm p-6 transition-shadow hover:shadow-md` |
| Input | `bg-surface border border-border rounded-md px-3 py-2 focus:border-primary focus:ring-1` |
| Badge | `bg-primary-container text-primary rounded-full px-2 py-0.5 text-xs font-medium` |
| Link | `text-primary hover:text-primary-hover transition-colors underline-offset-2 hover:underline` |
| Container | `mx-auto max-w-4xl px-4 md:px-8` |
| Section | `py-16 md:py-24 lg:py-32` |

---

## 6. File Architecture

```
libs/ui/src/
├── styles/
│   ├── index.css               # Main entry - Tailwind + custom tokens
│   ├── tokens/
│   │   ├── colors.css          # @theme color tokens
│   │   └── typography.css      # @theme typography tokens
│   ├── themes/
│   │   └── dark.css            # Dark mode token overrides
│   ├── base/
│   │   ├── reset.css           # CSS reset/normalize (if needed beyond Tailwind)
│   │   └── typography.css      # Base element styles
│   └── material/
│       └── overrides.scss      # Angular Material customization (SCSS for mat mixins)
│
├── components/
│   ├── icon/
│   │   ├── icon.component.ts
│   │   ├── providers/
│   │   │   ├── lucide.provider.ts
│   │   │   ├── material.provider.ts
│   │   │   └── heroicons.provider.ts
│   │   └── index.ts
│   ├── button/
│   ├── card/
│   └── ...

apps/landing/src/
├── styles.css                  # @import 'tailwindcss'; @import '@portfolio/ui/styles';
└── app/
    └── app.config.ts           # Icon provider configuration
```

---

## 7. Theme Configuration Flow

```
Dashboard Settings
       │
       ▼
┌─────────────────┐
│ API: /settings  │  ← Stores: { accentHue: 210, theme: 'system' }
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Landing App     │  ← Fetches settings on SSR/load
│ (SSR/SSG)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CSS Variables   │  ← document.documentElement.style.setProperty('--accent-hue', '210')
│ Applied to :root│     + class toggle for dark mode (.dark)
└─────────────────┘
```

---

## High-Level Requirements

### Functional Requirements
1. **FR-1:** Tailwind CSS v4 utilities available for spacing, layout, shadows, transitions
2. **FR-2:** HSL-based color system generating full 50-900 accent palette from two base variables
3. **FR-3:** Fluid typography scale (text-xs through text-5xl) using clamp() for responsive sizing
4. **FR-4:** Angular Material components styled with custom theme tokens
5. **FR-5:** Icon component accepting `name` prop and rendering Lucide icons
6. **FR-6:** Base components (Button, Card, Input, Badge, Link, Container, Section) following semantic token patterns
7. **FR-7:** Dark mode token overrides via `.dark` class on root element
8. **FR-8:** Example landing page sections demonstrating design system usage
9. **FR-9:** All components have corresponding .spec.ts test files with >70% coverage

### Non-Functional Requirements
1. **NFR-1:** Design tokens follow three-layer architecture (Primitive → Semantic → Component)
2. **NFR-2:** Components use BEM naming convention for CSS classes
3. **NFR-3:** SCSS files co-located with components
4. **NFR-4:** Type-safe icon component with TypeScript interfaces
5. **NFR-5:** Bundle size remains under landing app budget (500kb warning, 1mb error)
6. **NFR-6:** Build-time icon provider switching without runtime overhead
7. **NFR-7:** Documentation in `.context/patterns.md` for design system patterns

---

## Technical Considerations

### Architecture Integration

**Current Project Structure:**
- Nx monorepo with pnpm workspaces
- Angular 21 landing app (`apps/landing/`) with SSR configured
- NestJS API (`apps/api/`) - not involved in Phases 1-4
- Shared library structure: `libs/ui/`, `libs/types/`, `libs/utils/` (some not yet created)
- SCSS standardization (ADR-007, 2026-02-02)
- Testing infrastructure: Jest, Playwright, @testing-library/angular

**Design System File Structure:**
```
libs/ui/src/
├── styles/
│   ├── index.css                    # Main entry (@import tailwindcss + token imports)
│   ├── tokens/
│   │   ├── colors.css               # @theme color tokens (HSL accent palette)
│   │   └── typography.css           # @theme typography tokens (Inter font, clamp scale)
│   ├── themes/
│   │   └── dark.css                 # .dark class token overrides
│   ├── base/
│   │   └── typography.css           # Base HTML element styles (@layer base)
│   └── material/
│       └── overrides.scss           # Angular Material theme configuration
│
├── components/
│   ├── icon/
│   │   ├── icon.component.ts        # Main icon component
│   │   ├── icon.component.spec.ts   # Tests
│   │   ├── icon-provider.interface.ts
│   │   ├── providers/
│   │   │   ├── lucide.provider.ts   # Lucide implementation
│   │   │   └── index.ts
│   │   └── index.ts                 # Public API
│   ├── button/
│   │   ├── button.component.ts
│   │   ├── button.component.spec.ts
│   │   ├── button.component.scss
│   │   └── index.ts
│   ├── card/
│   ├── input/
│   ├── badge/
│   ├── link/
│   └── ...
│
└── index.ts                         # Library public API exports

apps/landing/src/
├── styles.css                       # Landing app entry: @import '@portfolio/ui/styles';
└── app/
    └── app.config.ts                # Configure icon provider: provideIcons(lucideProvider)
```

### Dependencies to Install

**New Dependencies:**
- `tailwindcss` - v4 (CSS-first architecture with @theme directive)
- `@angular/material` - v21 (Angular Material components)
- `@fontsource/inter` - Inter font self-hosted
- `lucide-angular` - Lucide icons for Angular (or `lucide-static` if building custom wrapper)

**Configuration Files to Update:**
- `libs/ui/project.json` - Add `inlineStyleLanguage: "scss"` (if generating components with styles)
- `apps/landing/project.json` - Verify `inlineStyleLanguage: "scss"` already set (line 16 ✓)
- `package.json` - Add new dependencies
- `apps/landing/src/styles.css` - New entry point (replaces styles.scss for Tailwind)
- `.context/patterns.md` - Add design system patterns section
- `.context/decisions.md` - May need ADR update if Tailwind changes SCSS-only stance

### Integration Points

**With Existing Code:**
- `apps/landing/src/app/app.ts` - Will import and use new UI components
- `apps/landing/src/styles.scss` → **Replace with `styles.css`** for Tailwind v4
- `libs/ui/src/lib/ui/ui.ts` - Current stub component, will be removed or refactored
- `libs/ui/src/lib/ui/ui.scss` - Current empty file (has styleUrl bug - references `.css` but file is `.scss`)

**Theme Configuration Flow (Hardcoded for Phases 1-4):**
```
:root CSS Variables (hardcoded)
       │
       ▼
┌──────────────────────────┐
│ --accent-hue: 210;       │  Hardcoded in libs/ui/styles/tokens/colors.css
│ --accent-saturation: 65%;│
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ HSL Palette Generation   │  Calculated in @theme (--color-accent-50 through 900)
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Semantic Tokens          │  --color-primary, --color-surface, --color-text, etc.
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Component Classes        │  .btn-primary, .card, .input, etc.
└──────────────────────────┘

Note: Phase 5 will replace hardcoded :root values with API-driven injection
```

### Data Model (Phase 5 - Future)

Not implemented in Phases 1-4, but design system prepared for:

```typescript
// libs/types/src/lib/theme.types.ts (future)
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  accentHue: number;           // 0-360 (e.g., 210 for blue)
  accentSaturation: number;    // 0-100 (e.g., 65 for moderately saturated)
  defaultMode: ThemeMode;
}

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}
```

### Testing Strategy

**Unit Tests (Jest):**
- All components in `libs/ui/components/*/` have `.spec.ts` files
- Test behavior, props, accessibility, and visual states
- Coverage target: 70-80% for components

**Component Tests (@testing-library/angular):**
- Icon component: Rendering, provider switching, size props
- Button: Variants (primary, secondary, ghost), disabled state, click events
- Card: Layout, slots/projection, hover states
- Input: Value binding, validation states, focus behavior

**E2E Tests (Playwright) - landing app:**
- Example hero section renders with design system components
- Card grid displays correctly
- Dark mode toggle works (when implemented in Phase 5)
- Responsive breakpoints function correctly

**Visual Regression (Future):**
- Not in scope for Phases 1-4
- Consider Storybook + Chromatic in future epic

---

## Implementation Phases (Detailed)

### Phase 1: Tailwind + Token Foundation

**Goal:** Install Tailwind v4 and define custom color/typography tokens

**Tasks:**
1. Install Tailwind CSS v4 and @fontsource/inter via pnpm
2. Create `libs/ui/src/styles/` directory structure
3. Create `libs/ui/src/styles/tokens/colors.css`:
   - Define `@theme` with HSL-based accent palette (--color-accent-50 through 900)
   - Define semantic tokens (--color-primary, --color-surface, --color-text, etc.)
   - Use `theme(colors.gray.X)` for neutrals (Tailwind defaults)
4. Create `libs/ui/src/styles/tokens/typography.css`:
   - Define `@theme` with font families (--font-sans: Inter, --font-mono: JetBrains Mono)
   - Define fluid type scale (--text-xs through --text-5xl using clamp())
5. Create `libs/ui/src/styles/themes/dark.css`:
   - `.dark` class overrides for semantic tokens
6. Create `libs/ui/src/styles/base/typography.css`:
   - `@layer base` with h1-h6, p, code styles using @apply directive
7. Create `libs/ui/src/styles/index.css`:
   - `@import "tailwindcss";`
   - Import all token and theme files
8. Update `apps/landing/src/styles.css` (rename from .scss):
   - `@import '@portfolio/ui/styles';`
9. Test: Run `pnpm dev:landing` and verify Tailwind utilities work (add test classes to app.component.html)

**Acceptance Criteria:**
- [ ] Tailwind utilities render correctly (bg-accent-500, text-primary, p-4, rounded-lg)
- [ ] Fluid typography scales between viewport sizes
- [ ] Gray scale tokens (gray-50 through gray-950) available
- [ ] No build errors or warnings
- [ ] Landing app serves successfully

---

### Phase 2: Angular Material Integration

**Goal:** Install Angular Material and integrate with custom theme tokens

**Tasks:**
1. Install @angular/material v21 via `ng add @angular/material` (select custom theme option)
2. Create `libs/ui/src/styles/material/overrides.scss`:
   - Import Angular Material theming: `@use '@angular/material' as mat;`
   - Define base Material theme using `mat.theme()` with azure palette
   - Override Material tokens with custom semantic tokens using `mat.theme-overrides()`
3. Update `libs/ui/src/styles/index.css` to import Material overrides:
   - Add `@import './material/overrides.scss';` (CSS can import SCSS)
4. Test Angular Material components:
   - Add `<mat-button>`, `<mat-card>` to landing app temporarily
   - Verify custom colors apply (primary should use accent-500)
5. Document Material integration in `.context/patterns.md`:
   - How to override Material tokens
   - Which Material components to prefer vs. custom components

**Acceptance Criteria:**
- [ ] Angular Material installed without errors
- [ ] Material components render with custom accent color
- [ ] Material components respond to `.dark` class (when added to root)
- [ ] No style conflicts between Tailwind and Material
- [ ] Material typography aligns with custom type scale

---

### Phase 3: Icon System

**Goal:** Build configurable icon component with Lucide provider

**Tasks:**
1. Install lucide-angular: `pnpm add lucide-angular`
2. Create icon provider architecture:
   - `libs/ui/src/components/icon/icon-provider.interface.ts` - Define IconProvider interface
   - `libs/ui/src/components/icon/providers/lucide.provider.ts` - Implement Lucide provider
   - `libs/ui/src/components/icon/providers/index.ts` - Export providers
3. Create icon component:
   - `libs/ui/src/components/icon/icon.component.ts` - Main component
   - Props: `name: string`, `size?: 'sm' | 'md' | 'lg' | 'xl'`, `strokeWidth?: number`
   - Use Angular DI to inject IconProvider
   - Render icon dynamically based on provider
4. Create provider configuration helper:
   - `libs/ui/src/components/icon/provide-icons.ts` - `provideIcons(provider: IconProvider)` function
5. Configure provider in landing app:
   - Update `apps/landing/src/app/app.config.ts` - Add `provideIcons(lucideProvider)` to providers array
6. Write tests:
   - `libs/ui/src/components/icon/icon.component.spec.ts` - Test rendering, size classes, provider injection
7. Export from library:
   - Add to `libs/ui/src/index.ts` - Export IconComponent, provideIcons, lucideProvider
8. Document icon system in `.context/patterns.md`:
   - How to use icon component
   - How to add new icon providers (future)
   - Available sizes and customization

**Acceptance Criteria:**
- [ ] Icon component renders Lucide icons correctly
- [ ] Size prop applies correct Tailwind size-* class (size-4, size-5, size-6, size-8)
- [ ] Icon component injectable and configurable
- [ ] Tests pass with >70% coverage
- [ ] Example icons display in landing app (arrow-right, check, menu)

---

### Phase 4: Base Components + Examples

**Goal:** Build foundational components and demonstrate usage in landing app

**Sub-Phase 4.1: Component Library**

**Tasks:**
1. Create Button component:
   - `libs/ui/src/components/button/button.component.ts`
   - Props: `variant?: 'primary' | 'secondary' | 'ghost'`, `size?: 'sm' | 'md' | 'lg'`, `disabled?: boolean`
   - Styles: Use Tailwind utilities + semantic tokens (bg-primary, text-on-primary, rounded-lg, etc.)
   - Test: Click events, disabled state, variants
2. Create Card component:
   - `libs/ui/src/components/card/card.component.ts`
   - Props: `elevated?: boolean` (shadow-md vs shadow-sm)
   - Styles: bg-surface, rounded-xl, p-6, transition-shadow
   - Support content projection (ng-content)
   - Test: Rendering, slots, hover states
3. Create Input component:
   - `libs/ui/src/components/input/input.component.ts`
   - Props: `type?: string`, `placeholder?: string`, `error?: boolean`, `disabled?: boolean`
   - Styles: bg-surface, border-border, focus:border-primary, rounded-md
   - Support Angular Forms (ControlValueAccessor)
   - Test: Value binding, validation states, focus behavior
4. Create Badge component:
   - `libs/ui/src/components/badge/badge.component.ts`
   - Props: `color?: 'primary' | 'success' | 'warning' | 'error'`
   - Styles: bg-primary-container, text-primary, rounded-full, text-xs
   - Test: Color variants, content projection
5. Create Link component:
   - `libs/ui/src/components/link/link.component.ts` (or directive)
   - Styles: text-primary, hover:text-primary-hover, underline-offset-2, hover:underline
   - Support Angular Router integration
   - Test: Navigation, hover states
6. Create layout utilities:
   - Container component (optional): `mx-auto max-w-4xl px-4 md:px-8`
   - Section component (optional): `py-16 md:py-24 lg:py-32`
   - Or document as Tailwind class patterns in `.context/patterns.md`
7. Export all components from `libs/ui/src/index.ts`

**Sub-Phase 4.2: Landing App Examples**

**Tasks:**
8. Create example hero section:
   - File: `apps/landing/src/app/examples/hero-example.component.ts` (temporary, for validation)
   - Use Button, Link, Container components
   - Use Tailwind layout classes (flex, gap, items-center)
   - Responsive design (mobile-first)
9. Create example card grid:
   - File: `apps/landing/src/app/examples/card-grid-example.component.ts`
   - Use Card, Badge components
   - Grid layout (grid, grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-8)
10. Add examples to landing app.component.html temporarily for validation
11. Test examples:
    - E2E test: `apps/landing-e2e/src/design-system-examples.spec.ts` - Verify examples render
12. Document usage patterns in `.context/patterns.md`:
    - Component usage examples
    - Layout patterns
    - Spacing conventions (p-4 to p-8 for components, py-16 to py-32 for sections)

**Acceptance Criteria:**
- [ ] All base components implemented and tested (>70% coverage)
- [ ] Components follow BEM naming and SCSS conventions
- [ ] Components use semantic tokens consistently
- [ ] Example sections render correctly in landing app
- [ ] Responsive design works across breakpoints (sm, md, lg, xl)
- [ ] No accessibility warnings (button roles, aria-labels, color contrast)
- [ ] Bundle size stays within budget (500kb warning threshold)
- [ ] Design system patterns documented in `.context/patterns.md`

---

---

## Risks & Warnings

⚠️ **Tailwind v4 vs. ADR-007 SCSS Standardization**
- **Risk:** ADR-007 (2026-02-02) standardized project on SCSS exclusively, but design system plan requires Tailwind CSS v4
- **Mitigation:** Update ADR-007 or create new ADR documenting hybrid approach (Tailwind for utilities, SCSS for Angular Material mixins)
- **Decision:** User confirmed "Install Tailwind v4 as planned" - requires ADR update

⚠️ **Angular Material Theme Integration**
- **Risk:** Angular Material's M3 theming system may conflict with custom Tailwind tokens
- **Mitigation:** Use `mat.theme-overrides()` to force Material components to respect custom CSS variables
- **Watch for:** Material component styles overriding Tailwind utilities (use !important sparingly if needed)

⚠️ **Bundle Size Impact**
- **Risk:** Adding Tailwind + Angular Material + Lucide icons significantly increases bundle size
- **Current Budget:** 500kb warning, 1mb error for landing app
- **Mitigation:** Tree-shake unused Tailwind classes, import only needed Material components, lazy-load icons
- **Monitor:** Run `pnpm build:landing` after each phase and check bundle report

⚠️ **SCSS → CSS File Rename**
- **Risk:** Renaming `apps/landing/src/styles.scss` to `styles.css` may break imports in components
- **Mitigation:** Update `apps/landing/project.json` line 23 to reference `styles.css` instead of `styles.scss`
- **Verify:** All component styleUrls still resolve correctly

⚠️ **Icon Provider Architecture Complexity**
- **Risk:** Build-time provider pattern adds indirection that may confuse future developers
- **Mitigation:** Document clearly in `.context/patterns.md` with examples of adding new providers
- **Trade-off:** Flexibility vs. simplicity - decided flexibility wins for future icon set changes

⚠️ **Dark Mode Without Toggle (Phases 1-4)**
- **Risk:** Dark mode tokens defined but no UI to toggle them - may cause confusion
- **Mitigation:** Document in patterns.md that manual `.dark` class addition is needed until Phase 5
- **Temporary Test:** Add `.dark` class to `<html>` in browser DevTools to verify dark mode tokens work

⚠️ **Component Library Scope Creep**
- **Risk:** Building too many components beyond the base set delays other features
- **Mitigation:** Strict adherence to base components only (Button, Card, Input, Badge, Link, Container, Section)
- **Defer:** Advanced components (Modals, Dropdowns, Tables, Forms) to future epics

⚠️ **Testing Infrastructure Load**
- **Risk:** Adding tests for 7+ components increases test suite runtime
- **Mitigation:** Focus on critical behavior tests, skip trivial rendering tests
- **Target:** <30s total test time for `pnpm test:ui` library

---

## Alternatives Considered

### Alternative 1: Pure SCSS Without Tailwind
- **Pros:** Aligns with ADR-007, no new dependencies, full control over styling
- **Cons:** Must define all spacing/layout utilities manually, misses Tailwind's battle-tested scale
- **Why not chosen:** User preference for Tailwind utilities, industry standard for rapid development

### Alternative 2: Tailwind Only (No Angular Material)
- **Pros:** Simpler stack, fewer conflicts, smaller bundle
- **Cons:** Must build all interactive components from scratch (modals, dialogs, menus), misses Material's accessibility
- **Why not chosen:** Angular Material provides robust, tested components for future dashboard features

### Alternative 3: All 4 Icon Providers Upfront
- **Pros:** Complete flexibility, demonstrates full provider pattern
- **Cons:** Increases initial implementation time, most projects only use one icon set
- **Why not chosen:** YAGNI principle - implement Lucide first, add others only if needed

### Alternative 4: CSS-in-JS (styled-components, Emotion)
- **Pros:** Component-scoped styles, dynamic styling, no BEM needed
- **Cons:** Not idiomatic in Angular, adds runtime overhead, complicates SSR
- **Why not chosen:** Angular community standard is SCSS + component styles, SSR performance concerns

### Alternative 5: Implement All 5 Phases Now
- **Pros:** Complete design system including theme API and dashboard integration
- **Cons:** Dashboard app doesn't exist yet, backend work unrelated to design system foundation
- **Why not chosen:** User chose "Phases 1-4 only (defer Phase 5)" - dashboard-configurable themes deferred to future epic

---

## Success Criteria

- [ ] **Phase 1:** Tailwind utilities and custom tokens render correctly in landing app
- [ ] **Phase 2:** Angular Material components styled with custom accent color
- [ ] **Phase 3:** Icon component displays Lucide icons with configurable sizes
- [ ] **Phase 4:** Base components built, tested (>70% coverage), and used in example sections
- [ ] **All Phases:** Landing app builds without errors, stays within 500kb bundle budget
- [ ] **Documentation:** Design system patterns documented in `.context/patterns.md`
- [ ] **Testing:** All component tests pass (`pnpm test:ui` succeeds)
- [ ] **E2E:** Example sections render correctly in Playwright tests
- [ ] **Visual QA:** Manual verification of responsive design, color accuracy, typography scaling

**Measurable Outcomes:**
- 7 base components built (Button, Card, Input, Badge, Link, Container, Section)
- 2 example sections in landing app (hero, card grid)
- 1 icon system with provider architecture
- >70% test coverage for UI library
- <30s test suite runtime for UI library
- Bundle size increase <150kb (estimate: Tailwind ~50kb, Material ~80kb, Lucide ~20kb gzipped)

---

## Estimated Complexity

**XL (Extra Large)**

**Reasoning:**
- Foundational infrastructure affecting entire project
- 4 distinct phases each requiring multiple tasks
- New dependency installation and configuration (Tailwind, Material, Lucide)
- 7+ components to build with tests
- Integration with existing Nx/Angular/SCSS setup
- Documentation updates across multiple context files
- Risk of bundle size and compatibility issues requiring troubleshooting
- Estimated effort: 15-25 hours over multiple sessions

**Breakdown by Phase:**
- Phase 1 (Tailwind + Tokens): M (4-6 hours)
- Phase 2 (Angular Material): S (2-3 hours)
- Phase 3 (Icon System): M (3-4 hours)
- Phase 4 (Components + Examples): L (6-10 hours)
- Documentation & Testing: Distributed across phases

---

## Critical Files to Modify

### New Files (Create)
- `libs/ui/src/styles/index.css`
- `libs/ui/src/styles/tokens/colors.css`
- `libs/ui/src/styles/tokens/typography.css`
- `libs/ui/src/styles/themes/dark.css`
- `libs/ui/src/styles/base/typography.css`
- `libs/ui/src/styles/material/overrides.scss`
- `libs/ui/src/components/icon/icon.component.ts` (+ .spec.ts, providers/)
- `libs/ui/src/components/button/button.component.ts` (+ .spec.ts, .scss)
- `libs/ui/src/components/card/card.component.ts` (+ .spec.ts, .scss)
- `libs/ui/src/components/input/input.component.ts` (+ .spec.ts, .scss)
- `libs/ui/src/components/badge/badge.component.ts` (+ .spec.ts, .scss)
- `libs/ui/src/components/link/link.component.ts` (+ .spec.ts, .scss)
- `apps/landing/src/app/examples/hero-example.component.ts` (+ .html)
- `apps/landing/src/app/examples/card-grid-example.component.ts` (+ .html)
- `apps/landing-e2e/src/design-system-examples.spec.ts`

### Existing Files (Modify)
- `package.json` - Add tailwindcss, @angular/material, @fontsource/inter, lucide-angular
- `apps/landing/src/styles.scss` → **Rename to `styles.css`** and change imports
- `apps/landing/project.json` - Update line 23 to reference `styles.css`
- `apps/landing/src/app/app.config.ts` - Add icon provider configuration
- `libs/ui/src/index.ts` - Export all new components and utilities
- `libs/ui/project.json` - Add `inlineStyleLanguage: "scss"` if needed
- `.context/patterns.md` - Add "Design System Patterns" section
- `.context/decisions.md` - Update ADR-007 or add new ADR for Tailwind + SCSS hybrid

### Files to Delete/Replace
- `libs/ui/src/lib/ui/ui.ts` - Current stub component (remove after library setup)
- `libs/ui/src/lib/ui/ui.scss` - Empty stub file (remove)
- `libs/ui/src/lib/ui/ui.html` - Placeholder template (remove)

---

## Verification & Testing

### Unit Tests (Jest)
```bash
# Run UI library tests
pnpm nx test ui

# Run with coverage
pnpm nx test ui --coverage

# Watch mode during development
pnpm nx test ui --watch
```

**Expected Results:**
- All tests pass (icon, button, card, input, badge, link components)
- Coverage >70% for libs/ui
- Test execution time <30s

### E2E Tests (Playwright)
```bash
# Run landing app E2E tests
pnpm test:e2e

# Run in headed mode for debugging
pnpm test:e2e:headed
```

**Expected Results:**
- Design system examples spec passes
- Hero section renders with components
- Card grid displays correctly
- Responsive breakpoints work

### Manual Verification

1. **Tailwind Utilities (Phase 1):**
   - Add test classes to app.component.html: `<div class="bg-accent-500 text-white p-4 rounded-lg">Test</div>`
   - Verify accent-500 renders correct blue hue
   - Check fluid typography scales on window resize

2. **Angular Material (Phase 2):**
   - Add `<button mat-raised-button color="primary">Material Button</button>` to app.component.html
   - Verify button uses custom accent color (not Material's default azure)
   - Toggle `.dark` class on `<html>` in DevTools, verify Material components update colors

3. **Icons (Phase 3):**
   - Add `<lib-icon name="arrow-right" size="md"></lib-icon>` to app.component.html
   - Verify Lucide arrow-right icon renders
   - Test size prop: sm (16px), md (20px), lg (24px), xl (32px)

4. **Components (Phase 4):**
   - View example hero section and card grid in landing app
   - Test button hover states and click events
   - Test input focus states and value binding
   - Verify card hover elevation change (shadow-sm → shadow-md)
   - Test responsive grid collapse on mobile (<768px)

5. **Bundle Size:**
   ```bash
   pnpm build:landing
   # Check dist/apps/landing/browser/*.js file sizes
   # Verify total < 500kb (warning) or 1mb (error)
   ```

6. **Browser Compatibility:**
   - Chrome/Edge (latest)
   - Firefox (latest)
   - Safari (latest, test on macOS if available)
   - Verify no console errors or warnings

### Design System Documentation
- Read `.context/patterns.md` design system section
- Verify token usage examples are clear
- Verify component usage patterns documented
- Check BEM naming conventions explained

---

## Next Steps After Completion

1. **Break down into tasks:** Use `/breakdown` command on this epic file to create granular tasks
2. **Update progress tracking:** Mark epic as "in-progress" in `.context/progress.md`
3. **Phase-by-phase implementation:** Complete Phases 1-4 sequentially
4. **Create ADR:** Document Tailwind + SCSS hybrid decision in `.context/decisions.md`
5. **Future epic for Phase 5:** When dashboard app is built, create new epic for theme API and runtime configuration

---

## References

- [Martin Fowler: Design Token-Based UI Architecture](https://martinfowler.com/articles/design-token-based-ui-architecture.html)
- [Material Design 3 Tokens](https://m3.material.io/foundations/design-tokens)
- [Angular Material Theming](https://material.angular.dev/guide/theming-your-components)
- [Tailwind CSS v4 @theme Directive](https://tailwindcss.com/docs/adding-custom-styles)
- [W3C Design Tokens Community Group](https://uxdesign.cc/design-tokens-with-confidence-862119eb819b)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Nx Workspace Best Practices](https://nx.dev/concepts/more-concepts/applications-and-libraries)
- [BEM Naming Convention](https://getbem.com/naming/)

---

## Changelog

### [2026-02-02] Initial Epic Creation
- Converted high-level design system plan into detailed implementation epic
- Scoped to Phases 1-4 only (Tailwind foundation, Material integration, icons, base components)
- Deferred Phase 5 (dynamic theme API) to future epic when dashboard app exists
- Icon system scoped to Lucide provider only (other providers deferred)
- Included example implementations in landing app for validation
- Documented risks, alternatives, success criteria, and verification steps
