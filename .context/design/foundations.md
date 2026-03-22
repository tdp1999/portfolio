# Design Foundations

> Cross-cutting design tokens, spacing, typography, and styling patterns shared by all apps.
> For app-specific design rules, see `landing.md`, `console.md`, or `shared.md`.

## Token Architecture

Three-layer system following industry best practices (inspired by Material Design 3 tokens):

1. **Primitive Tokens (Layer 1):** Raw color values - Tailwind defaults + custom HSL palette
2. **Semantic Tokens (Layer 2):** Contextual mappings - CSS custom properties like `--color-primary`, `--color-surface`
3. **Component Tokens (Layer 3):** Component-specific styles - defined in component SCSS files

**Token Files:**

- `libs/landing/shared/ui/src/styles/tokens/colors.scss` - Semantic color tokens
- `libs/landing/shared/ui/src/styles/themes/dark.scss` - Dark mode overrides
- `libs/landing/shared/ui/src/styles/tokens/typography.scss` - Typography tokens

## Color Usage

### Semantic Color Tokens

Use semantic tokens in components for automatic dark mode support:

```html
<!-- Background and surfaces -->
<div class="bg-background">Page background</div>
<div class="bg-surface border border-border">Card surface</div>
<div class="bg-surface-elevated">Elevated surface (header, modal)</div>

<!-- Text hierarchy -->
<h1 class="text-text">Primary heading</h1>
<p class="text-text-secondary">Secondary text</p>
<span class="text-text-muted">Muted hint text</span>

<!-- Primary/Accent colors -->
<span class="text-primary">Brand color text</span>
<div class="bg-primary text-text-on-primary">Primary button</div>
<div class="bg-primary-container">Primary container (light bg)</div>

<!-- Feedback colors -->
<div class="text-success">Success message</div>
<div class="bg-error-container">Error banner</div>
```

### Direct Tailwind Colors

For decorative elements or when semantic tokens don't fit:

```html
<!-- Tailwind gray scale -->
<div class="bg-gray-100 text-gray-700">Light gray container</div>

<!-- Accent palette (via Tailwind config) -->
<div class="bg-accent-100 text-accent-700">Light accent container</div>
<div class="bg-accent-500 text-white">Strong accent</div>
```

### Available Semantic Tokens

| Token                       | Light Mode            | Dark Mode             | Usage                        |
| --------------------------- | --------------------- | --------------------- | ---------------------------- |
| `--color-background`        | `#f9fafb` (gray-50)   | `#0f1117`             | Page background              |
| `--color-surface`           | `#ffffff`             | `#1a1d27`             | Card, panel backgrounds      |
| `--color-surface-elevated`  | `#f1f5f9` (slate-100) | `#22263a`             | Headers, modals, elevated UI |
| `--color-primary`           | HSL accent 50%        | HSL accent 58%        | Brand color, CTAs            |
| `--color-primary-hover`     | HSL accent 42%        | HSL accent 68%        | Hover state                  |
| `--color-primary-container` | HSL accent 94%        | HSL accent 22%        | Light primary backgrounds    |
| `--color-text`              | `#111827` (gray-900)  | `#e2e8f0` (slate-200) | Primary text                 |
| `--color-text-secondary`    | `#4b5563` (gray-600)  | `#94a3b8` (slate-400) | Secondary text               |
| `--color-text-muted`        | `#9ca3af` (gray-400)  | `#64748b` (slate-500) | Placeholder, hints           |
| `--color-text-on-primary`   | `#ffffff`             | `#ffffff`             | Text on primary backgrounds  |
| `--color-border`            | `#e5e7eb` (gray-200)  | `#2d3148`             | Default borders              |
| `--color-border-strong`     | `#d1d5db` (gray-300)  | `#3d4266`             | Emphasized borders           |

**Feedback colors:** `--color-success`, `--color-warning`, `--color-error`, `--color-info` (each with `-container` variant)

## Typography Usage

### Tailwind Text Utilities

Use Tailwind's responsive typography scale:

```html
<!-- Headings -->
<h1 class="text-4xl md:text-5xl font-semibold">Hero heading</h1>
<h2 class="text-3xl font-semibold">Section heading</h2>
<h3 class="text-xl font-medium">Card title</h3>

<!-- Body text -->
<p class="text-base text-text-secondary">Body paragraph</p>
<p class="text-lg">Large body text</p>
<p class="text-sm text-text-muted">Small helper text</p>

<!-- Code and monospace -->
<code class="font-mono text-sm bg-surface-elevated px-2 py-1 rounded">inline code</code>
```

### Typography Tokens (CSS Custom Properties)

Defined in `libs/landing/shared/ui/src/styles/tokens/typography.scss`, mapped in `tailwind.config.js`.

**Font Families:**

- `--font-sans`: `'Inter', ui-sans-serif, system-ui, sans-serif`
- `--font-mono`: `'JetBrains Mono', ui-monospace, monospace`

**Fluid Type Scale (responsive via `clamp()`):**

| Token | Min (320px) | Max (1280px) | Line Height | Usage |
|-------|-------------|--------------|-------------|-------|
| `--text-xs` | 0.7rem (11px) | 0.8rem (13px) | normal (1.5) | Badges, captions |
| `--text-sm` | 0.8rem (13px) | 0.925rem (15px) | normal (1.5) | Helper text, labels |
| `--text-base` | 0.925rem (15px) | 1rem (16px) | normal (1.5) | Body text |
| `--text-lg` | 1rem (16px) | 1.25rem (20px) | snug (1.375) | Large body, subtitles |
| `--text-xl` | 1.125rem (18px) | 1.5rem (24px) | snug (1.375) | Card titles |
| `--text-2xl` | 1.25rem (20px) | 1.875rem (30px) | tight (1.25) | Section subheadings |
| `--text-3xl` | 1.5rem (24px) | 2.25rem (36px) | tight (1.25) | Section headings |
| `--text-4xl` | 1.875rem (30px) | 3rem (48px) | tight (1.25) | Page titles, hero |
| `--text-5xl` | 2.25rem (36px) | 3.75rem (60px) | tight (1.25) | Hero display |

**Line Heights:**

| Token | Value | Usage |
|-------|-------|-------|
| `--leading-none` | 1 | Display text, single-line headings |
| `--leading-tight` | 1.25 | Headings (2xl+) |
| `--leading-snug` | 1.375 | Large body (lg, xl) |
| `--leading-normal` | 1.5 | Body text, default |
| `--leading-relaxed` | 1.625 | Long-form reading |
| `--leading-loose` | 2 | Widely spaced text |

**Letter Spacing:**

| Token | Value | Usage |
|-------|-------|-------|
| `--tracking-tighter` | -0.05em | Display headings (4xl+) |
| `--tracking-tight` | -0.025em | Section headings |
| `--tracking-normal` | 0 | Body text (default) |
| `--tracking-wide` | 0.025em | Uppercase labels |
| `--tracking-wider` | 0.05em | Uppercase section titles |
| `--tracking-widest` | 0.1em | Uppercase small caps |

## Spacing System

Uses Tailwind's default 4px base unit. All spacing should be multiples of 4px, following an **8px grid** for layout-level spacing.

### Spacing Scale

| Class | Value | Usage |
|-------|-------|-------|
| `1` | 4px (0.25rem) | Tight inline spacing |
| `2` | 8px (0.5rem) | Icon-to-text gap, compact padding |
| `3` | 12px (0.75rem) | Form field gap, small padding |
| `4` | 16px (1rem) | Standard gap, card padding (console) |
| `6` | 24px (1.5rem) | Section padding, content area padding |
| `8` | 32px (2rem) | Card grid gap, section spacing |
| `12` | 48px (3rem) | Large section gap |
| `16` | 64px (4rem) | Page section vertical spacing (mobile) |
| `24` | 96px (6rem) | Page section vertical spacing (desktop) |

### Spacing Conventions

| Context | Pattern | Example |
|---------|---------|---------|
| **Component internal padding** | `p-4` (console), `p-6` (landing) | Card content area |
| **Gap between sibling elements** | `gap-2` to `gap-4` | Icon + text, filter inputs |
| **Grid gap** | `gap-8` | Card grids, project showcases |
| **Section vertical spacing** | `py-16 md:py-24` (landing) | Between page sections |
| **Content area padding** | `p-6` | Console main content |
| **Form field spacing** | `gap-3` or `gap-4` | Between form fields |

## Border Radius Scale

| Class | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px (0.25rem) | Inline code, small badges |
| `rounded-md` | 6px (0.375rem) | Buttons (console), small inputs |
| `rounded-lg` | 8px (0.5rem) | Buttons (landing), inputs, dropdowns |
| `rounded-xl` | 12px (0.75rem) | Cards, table containers, media cards |
| `rounded-2xl` | 16px (1rem) | Auth card, large modals |
| `rounded-full` | 50% | Avatars, circle icons |

### Radius Conventions

| Component | Radius | Notes |
|-----------|--------|-------|
| **Buttons** | `rounded-lg` | All variants |
| **Inputs / Selects** | `rounded-lg` | Consistent with buttons |
| **Cards** | `rounded-xl` | Landing cards, dashboard stat cards, media cards |
| **Table container** | `rounded-xl` | CRUD page data tables |
| **Auth card** | `rounded-2xl` | Login/reset password centered card |
| **Avatars** | `rounded-full` | User avatars, logo circle |
| **Badges** | `rounded` or `rounded-full` | Small tags, status pills |

## Component Sizing

### Heights

| Component | Height | Notes |
|-----------|--------|-------|
| **Topbar** | 48px | Console top navigation bar |
| **Sidebar width** | 240px (expanded), 48px (collapsed rail) | `ui-sidebar-provider` |
| **Button (sm)** | 32px | Compact actions |
| **Button (md)** | 40px | Default buttons |
| **Button (lg)** | 48px | Primary CTAs, auth page submit |
| **Input field** | 40px | Standard form inputs |
| **Input field (compact)** | 36px | Console with Material density -2 |
| **Table row** | 48px | CRUD data table rows |
| **Pagination bar** | 48px | Fixed bottom bar |
| **Footer** | 40px | Copyright + ToS + version |

### Icon Sizes

| Size | Value | Usage |
|------|-------|-------|
| **sm** | 16px | Inline icons, badges, helper text |
| **md** | 20px | Button icons, menu items |
| **default** | 24px | Standalone icons, sidebar menu |
| **lg** | 32px | Feature icons, stat card icons |
| **xl** | 48-80px | Empty states, hero illustrations |

### Max Widths

| Token | Value | Usage |
|-------|-------|-------|
| `max-w-4xl` | 896px | Standard content container (landing) |
| `max-w-6xl` | 1152px | Wide container for grids (landing) |
| `max-w-md` | 448px | Auth card, narrow forms |
| No max-width | fluid | Console content area (fills sidebar inset) |

## Dark Mode

Dark mode is activated by adding the `.dark` class to the `<html>` element. All semantic color tokens automatically adjust.

### Manual Toggle (DevTools)

```javascript
// Activate dark mode
document.documentElement.classList.add('dark');

// Deactivate dark mode
document.documentElement.classList.remove('dark');
```

### TypeScript Toggle Implementation

```typescript
import { Component, signal } from '@angular/core';

@Component({
  // ...
})
export class AppComponent {
  isDark = signal(false);

  toggleDarkMode() {
    this.isDark.update((dark) => !dark);
    if (this.isDark()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
```

```html
<button (click)="toggleDarkMode()">
  <landing-icon [name]="isDark() ? 'sun' : 'moon'" />
  Toggle {{ isDark() ? 'Light' : 'Dark' }} Mode
</button>
```

## Tailwind + SCSS Hybrid Approach

| Use Case                      | Tool     | Example                                       |
| ----------------------------- | -------- | --------------------------------------------- |
| **Layout & spacing**          | Tailwind | `flex`, `gap-4`, `p-8`, `mt-4`                |
| **Responsive design**         | Tailwind | `md:flex-row`, `lg:grid-cols-3`               |
| **Colors**                    | Tailwind | `bg-surface`, `text-primary`, `border-border` |
| **Typography**                | Tailwind | `text-xl`, `font-semibold`, `tracking-tight`  |
| **Effects**                   | Tailwind | `rounded-lg`, `shadow-md`, `hover:shadow-lg`  |
| **Component internal styles** | SCSS     | Button states, card elevation, transitions    |
| **Angular Material mixins**   | SCSS     | `mat.theme()`, `mat.theme-overrides()`        |
| **Complex hover states**      | SCSS     | Multi-property transitions with `@apply`      |

### SCSS Component Pattern

```scss
// button.component.scss
.btn {
  @apply inline-flex items-center justify-center rounded-lg transition-all;

  &--primary {
    @apply bg-primary text-text-on-primary hover:bg-primary-hover;
  }

  &--md {
    @apply px-6 py-3 text-base;
  }
}
```

### BEM Naming for Custom CSS

Use BEM (Block Element Modifier) for component-specific classes not covered by Tailwind:

```scss
// card.component.scss
.landing-card {
  // Block
  @apply bg-surface border border-border rounded-xl p-6;

  &__header {
    // Element
    @apply flex items-center gap-2 mb-4;
  }

  &--elevated {
    // Modifier
    @apply shadow-lg;
  }

  &:hover {
    @apply shadow-xl border-border-strong;
  }
}
```

## Responsive Design

Follow mobile-first approach with Tailwind breakpoints:

| Breakpoint | Size    | Usage                                  |
| ---------- | ------- | -------------------------------------- |
| (default)  | < 640px | Mobile styles (base, no prefix)        |
| `sm:`      | 640px+  | Large phones, small tablets            |
| `md:`      | 768px+  | Tablets, switch to multi-column layout |
| `lg:`      | 1024px+ | Desktop, 3-column grids                |
| `xl:`      | 1280px+ | Wide desktop (rarely needed)           |

**Example:**

```html
<!-- Mobile: stack vertically, Desktop: side-by-side -->
<div class="flex flex-col md:flex-row gap-4">
  <!-- Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
</div>
```

## Accessibility

All components follow accessibility best practices:

- **Buttons:** Implicit `role="button"`, accessible names via text content
- **Links:** Use `routerLink` or `href` with descriptive text, external links include visual indicator
- **Icons:** Decorative icons use `aria-hidden="true"` (implemented in IconComponent)
- **Color contrast:** All text meets WCAG AA standards in both light and dark modes
- **Focus states:** Visible focus rings on interactive elements
- **Semantic HTML:** Proper heading hierarchy, native form controls

## Design Rationale & References

Values in this system are validated against human factors research, accessibility standards, and cognitive science. This section serves as a reusable reference for any future project.

### Standards & Compliance

| Standard | Version | Scope | Key Sections Used |
|----------|---------|-------|-------------------|
| **WCAG 2.2** | 2023 | Web accessibility | SC 1.4.3 (contrast AA 4.5:1), SC 1.4.6 (contrast AAA 7:1), SC 1.4.11 (non-text contrast 3:1), SC 1.4.12 (text spacing), SC 2.5.5 (target size AAA 44px), SC 2.5.8 (target size AA 24px) |
| **Apple HIG** | 2025 | iOS/macOS design | Touch targets (44pt min), typography scale, sidebar width |
| **Material Design 3** | 2024 | Android/cross-platform | 8dp grid, 48dp touch targets, density levels, color roles, type scale |
| **ISO 9241-411** | 2012 | Ergonomics of human-system interaction | Fitts's Law throughput testing for pointing devices |

### Research & Cognitive Science

| Research | Author(s) | Year | Key Finding | Applied To |
|----------|-----------|------|-------------|------------|
| **Fitts's Law** | Paul Fitts | 1954 | Target acquisition time = f(distance/width). Larger targets = faster, fewer errors | Button height 40px+, touch targets 44-48px |
| **Miller's Law** | George Miller | 1956 | Working memory capacity ~7±2 chunks (revised to 4±1 by Cowan 2001) | Dashboard card count (4-6 hero KPIs), NOT a nav item limit |
| **Hick's Law** | W.E. Hick / R. Hyman | 1952/53 | Decision time increases logarithmically with choices | Menu items, filter options — grouping mitigates |
| **Gestalt Laws** | Max Wertheimer | 1923 | Proximity, similarity, common region, closure | Spacing ratios (inner < outer, 1:2+ ratio for grouping) |
| **Weber's Law** | Ernst Weber | 1834 | Perceived difference is proportional to base magnitude | 8px grid — jumps naturally feel proportional at different scales |
| **Optimal line length** | Bringhurst, Rayner & Pollatsek, Dyson & Kipping | 1992/1989/1998 | 45-75 chars/line ideal (66 optimal). Too long → return-sweep errors | `max-width: 65ch` for prose text blocks |
| **Line spacing & reading** | Ling & van Schaik | 2006 | 1.5x line-height optimal reading speed vs 1.0 or 2.0 | `line-height: 1.5` for body text |
| **Screen font readability** | Boyarski et al. (CMU) | 1998 | Screen fonts need larger sizes than print equivalents | 16px minimum body text |
| **Display polarity** | Piepenbrock, Mayr, Mund & Buchner | 2013 | Light mode better for visual acuity; dark mode acceptable when contrast equalized | Support both modes; don't assume dark is better |
| **Halation on dark bg** | Legge & Rubin | 1986 | High contrast white-on-black causes halation (text bleed) in ~30-50% of users (astigmatism) | Use #e2e8f0 (87% white) not pure #fff on dark surfaces |
| **Information density** | Edward Tufte | 1990 | High density is good when well-designed; "clutter is a failure of design, not of information" | Dense tables/dashboards OK for expert users |
| **Dashboard design** | Stephen Few | 2006/2013 | All key metrics on single screen; 6-12 metric cards max; top-left gets most attention | 4 stat cards in dashboard, F-pattern scanning |
| **Proximity Compatibility** | Wickens & Carswell | 1995 | Related info should be proximate; comparable info should use consistent layout | Card grouping, consistent CRUD template |
| **Cognitive load** | NNGroup (Harley) | 2014 | Less density + clear hierarchy for casual users; more density for expert users | Console (dense, expert) vs Landing (spacious, casual) |

### Typography References

| Source | Key Contribution | Applied To |
|--------|-----------------|------------|
| **Robert Bringhurst** — "The Elements of Typographic Style" | Modular scales, 66 chars/line ideal, 1.4-1.6 leading | Type scale ratio, line-height, measure |
| **Tim Brown** — "More Meaningful Typography" (A List Apart, 2011) | Popularized modular scales for web (modularscale.com) | Minor Third 1.2 ratio for apps |
| **Material Design 3 type scale** | Hand-tuned Major Second→Minor Third: 11-57px | Reference for our fluid clamp() scale |
| **British Dyslexia Association** | Min 12pt (16px) for accessible reading | 16px body text floor |

### Modular Scale Ratios

| Ratio | Name | Character | Best For |
|-------|------|-----------|----------|
| 1.067 | Minor Second | Almost no contrast | Avoid — steps too subtle |
| 1.125 | Major Second | Subtle, controlled | Dense apps, dashboards, data tables |
| **1.200** | **Minor Third** | **Balanced** | **General-purpose apps (our system)** |
| 1.250 | Major Third | Clear hierarchy | Content-heavy, editorial, blogs |
| 1.333 | Perfect Fourth | Bold contrast | Landing pages, marketing |
| 1.618 | Golden Ratio | Very dramatic | Impractical for apps — too few usable sizes |

### Value Validation Summary

| Property | Our Value | Research Basis | Status |
|----------|-----------|---------------|--------|
| Body font size | 16px | NNGroup, WCAG, Material, Boyarski 1998 | Aligned |
| Line height (body) | 1.5 | WCAG SC 1.4.12, Bringhurst, Ling & van Schaik 2006 | Aligned |
| Grid unit | 8px | Material Design, Weber's Law, sub-pixel rendering | Aligned |
| Button height | 40px | Fitts's Law, Material 40dp default | Aligned |
| Input height | 40px | NNGroup forms usability, Material | Aligned |
| Table row height | 48px | Few 2012, Material 52dp/40dp compact | Aligned |
| Sidebar width | 240px | Industry mode (VS Code, Notion, Figma, Jira) | Aligned |
| Type scale ratio | ~1.2 | Minor Third — IBM Carbon, Tailwind, Bootstrap | Aligned |
| Touch target (mobile) | 44-48px | WCAG 2.5.5 (44px AAA), Apple HIG (44pt), Material (48dp) | Aligned |
| Contrast (AA) | 4.5:1 text, 3:1 UI | WCAG SC 1.4.3, SC 1.4.11 | Aligned |
| Primary text on dark | #e2e8f0 (~87% white) | Material dark theme spec, Legge & Rubin halation | Aligned |
| Dashboard KPI cards | 4 | Few 2006 (3-5 hero), Miller/Cowan (4±1 working memory) | Aligned |
| Content max-width | 896px (layout) | Fine as container; prose needs `max-width: 65ch` (Bringhurst) | Needs `65ch` for prose |
| Spacing ratio (grouping) | Inner < Outer | Gestalt proximity, Lidwell 2003 (1:2+ ratio) | Aligned |

### How To Use This Reference

1. **For this project**: values above are already implemented. Use this section to validate future changes.
2. **For new projects**: start with these values as defaults. Adjust type scale ratio based on context (1.125 for dense tools, 1.25-1.333 for marketing/editorial).
3. **For audits**: compare implementation against the Value Validation Summary table. Any mismatch = potential UX issue.
4. **For stakeholder justification**: cite specific research when defending design decisions.

## Architecture Changelog

### [2026-02-02] Standardize Styling to SCSS

- **Changed:** Styling approach for shared libraries
- **From:** Mixed CSS and SCSS files across project
- **To:** SCSS exclusively for all styling
- **Reason:** Consistency across project - Angular landing app already uses SCSS, extending to all libraries
- **Impact:**
  - `libs/ui/` - Convert `.css` to `.scss`
  - `libs/api-client/` - Convert `.css` to `.scss`
  - Library project configurations may need `inlineStyleLanguage: "scss"`
  - Future component styles will use `.scss` extension
- **Decision:** See decisions.md [2026-02-02]
