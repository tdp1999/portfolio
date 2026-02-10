# Design System Patterns

> Component usage, token architecture, styling patterns, and layout recipes.
> For architecture and code patterns, see `patterns-architecture.md`.

## Icon System

The icon system uses a provider pattern allowing different icon libraries to be swapped at build time. Currently uses Lucide icons.

### Usage

```html
<!-- Basic usage -->
<landing-icon name="arrow-right" />

<!-- Custom size (px) -->
<landing-icon name="check" [size]="32" />

<!-- Colored via Tailwind -->
<landing-icon name="github" class="text-accent-500" />
<landing-icon name="mail" class="text-primary" />
```

### Architecture

- **`IconProvider` interface** — `getSvg(name, size)` returns SVG string or `null`
- **`ICON_PROVIDER` token** — DI token for the active provider
- **`provideIcons(provider)`** — registers provider in `app.config.ts`
- **`IconComponent`** (`<landing-icon>`) — renders SVG via `innerHTML` with `DomSanitizer`

### Available Icons (32 mapped)

`arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `check`, `close`/`x`, `menu`, `search`, `home`, `user`, `settings`, `mail`, `github`, `linkedin`, `external-link`, `download`, `sun`, `moon`, `chevron-right`, `chevron-left`, `chevron-up`, `chevron-down`, `plus`, `minus`, `eye`, `eye-off`, `heart`, `star`, `briefcase`, `code`, `globe`, `phone`

### Adding New Icons

Add entries to `ICON_MAP` in `libs/landing/shared/ui/src/components/icon/providers/lucide.provider.ts`:

```typescript
import { NewIcon } from 'lucide-angular';
// Add to ICON_MAP:
'new-icon': NewIcon,
```

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

Available but not required for most use cases:

- `--font-sans`: `'Inter', system-ui, sans-serif`
- `--font-mono`: `'Fira Code', 'Consolas', monospace`

## Component Usage

All components use the `landing-` prefix and follow Angular standalone component conventions.

### Button

```html
<!-- Primary button (default) -->
<landing-button>Click me</landing-button>

<!-- Variants -->
<landing-button variant="primary">Primary action</landing-button>
<landing-button variant="secondary">Secondary action</landing-button>
<landing-button variant="ghost">Tertiary action</landing-button>

<!-- Sizes -->
<landing-button size="sm">Small</landing-button>
<landing-button size="md">Medium (default)</landing-button>
<landing-button size="lg">Large</landing-button>

<!-- With icon -->
<landing-button variant="primary" size="lg">
  View Projects
  <landing-icon name="arrow-right" [size]="20" class="ml-2" />
</landing-button>

<!-- Disabled -->
<landing-button [disabled]="true">Disabled</landing-button>

<!-- Click event -->
<landing-button (buttonClick)="handleClick($event)">Click handler</landing-button>
```

**TypeScript:**

```typescript
import { ButtonComponent } from '@portfolio/landing/shared/ui';

@Component({
  // ...
  imports: [ButtonComponent]
})
```

### Card

```html
<!-- Basic card -->
<landing-card>
  <h3 class="text-xl font-medium mb-2">Card Title</h3>
  <p class="text-text-secondary">Card content goes here</p>
</landing-card>

<!-- Card with icon and badges (project showcase pattern) -->
<landing-card>
  <div class="flex items-center gap-2 mb-3">
    <landing-icon name="shopping-cart" [size]="24" class="text-primary" />
    <h3 class="text-xl font-medium">E-Commerce Platform</h3>
  </div>
  <p class="text-text-secondary mb-4">A full-stack e-commerce solution with real-time inventory.</p>
  <div class="flex flex-wrap gap-2">
    <landing-badge>Angular</landing-badge>
    <landing-badge>NestJS</landing-badge>
    <landing-badge>PostgreSQL</landing-badge>
  </div>
</landing-card>
```

**TypeScript:**

```typescript
import { CardComponent } from '@portfolio/landing/shared/ui';
```

### Input

```html
<!-- Basic input -->
<landing-input label="Email" placeholder="you@example.com" />

<!-- With value binding -->
<landing-input label="Username" [value]="username" (valueChange)="username = $event" />

<!-- Input types -->
<landing-input type="email" label="Email" />
<landing-input type="password" label="Password" />
<landing-input type="number" label="Age" />

<!-- Required field -->
<landing-input label="Name" [required]="true" />

<!-- Disabled -->
<landing-input label="Readonly" [disabled]="true" value="Cannot edit" />
```

**TypeScript:**

```typescript
import { InputComponent } from '@portfolio/landing/shared/ui';
```

### Badge

```html
<!-- Default badge -->
<landing-badge>Angular</landing-badge>

<!-- Technology badges in card -->
<div class="flex flex-wrap gap-2">
  <landing-badge>React</landing-badge>
  <landing-badge>Node.js</landing-badge>
  <landing-badge>MongoDB</landing-badge>
</div>
```

**TypeScript:**

```typescript
import { BadgeComponent } from '@portfolio/landing/shared/ui';
```

### Link

```html
<!-- Router link (internal navigation) -->
<a routerLink="/projects" landingLink>View Projects</a>

<!-- External link -->
<a href="https://github.com/username" landingLink target="_blank">
  GitHub
  <landing-icon name="external-link" [size]="16" class="ml-1" />
</a>

<!-- Link variants (via CSS classes) -->
<a routerLink="/about" landingLink class="text-primary">Primary link</a>
<a href="#" landingLink class="text-text-secondary">Secondary link</a>
```

**TypeScript:**

```typescript
import { LinkDirective } from '@portfolio/landing/shared/ui';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink, LinkDirective]
})
```

### Container

Layout wrapper for consistent max-width and horizontal padding.

```html
<!-- Standard container (max-w-4xl) -->
<landing-container>
  <h1>Content centered with max width</h1>
</landing-container>

<!-- Wide container (max-w-6xl for grids) -->
<landing-container [wide]="true">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- Project cards -->
  </div>
</landing-container>
```

**TypeScript:**

```typescript
import { ContainerComponent } from '@portfolio/landing/shared/ui';
```

### Section

Vertical spacing wrapper for page sections.

```html
<!-- Standard section spacing (py-16 md:py-24) -->
<landing-section>
  <landing-container>
    <h2>Section Title</h2>
  </landing-container>
</landing-section>
```

**TypeScript:**

```typescript
import { SectionComponent } from '@portfolio/landing/shared/ui';
```

### Icon

```html
<!-- Basic icon -->
<landing-icon name="arrow-right" />

<!-- Custom size (default: 24px) -->
<landing-icon name="check" [size]="32" />
<landing-icon name="user" [size]="16" />

<!-- Colored via Tailwind -->
<landing-icon name="github" class="text-primary" />
<landing-icon name="mail" class="text-accent-500" />

<!-- In button -->
<landing-button>
  Download
  <landing-icon name="download" [size]="20" class="ml-2" />
</landing-button>
```

**Available icons (32 total):**
`arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `check`, `close`/`x`, `menu`, `search`, `home`, `user`, `settings`, `mail`, `github`, `linkedin`, `external-link`, `download`, `sun`, `moon`, `chevron-right`, `chevron-left`, `chevron-up`, `chevron-down`, `plus`, `minus`, `eye`, `eye-off`, `heart`, `star`, `briefcase`, `code`, `globe`, `phone`

**Adding new icons:**
Edit `libs/landing/shared/ui/src/components/icon/providers/lucide.provider.ts` and add to `ICON_MAP`.

**TypeScript:**

```typescript
import { IconComponent } from '@portfolio/landing/shared/ui';
```

## Layout Patterns

### Hero Section

```html
<landing-section>
  <landing-container>
    <div class="flex flex-col md:flex-row items-center gap-8 md:gap-16">
      <!-- Text content -->
      <div class="flex-1 text-center md:text-left">
        <h1 class="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          Hi, I'm <span class="text-primary">Your Name</span>
        </h1>
        <p class="mt-4 text-lg text-text-secondary">
          Full-stack developer passionate about building great user experiences.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <landing-button variant="primary" size="lg">
            View Projects
            <landing-icon name="arrow-right" [size]="20" class="ml-2" />
          </landing-button>
          <landing-button variant="secondary" size="lg">Contact Me</landing-button>
        </div>
      </div>

      <!-- Image/illustration -->
      <div class="flex-shrink-0">
        <div class="w-64 h-64 rounded-full bg-primary-container flex items-center justify-center">
          <landing-icon name="user" [size]="80" class="text-primary" />
        </div>
      </div>
    </div>
  </landing-container>
</landing-section>
```

### Card Grid (Projects Showcase)

```html
<landing-section>
  <landing-container [wide]="true">
    <h2 class="text-3xl font-semibold text-center mb-12 text-text">Featured Projects</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      @for (project of projects; track project.id) {
      <landing-card>
        <div class="flex items-center gap-2 mb-3">
          <landing-icon [name]="project.icon" [size]="24" class="text-primary" />
          <h3 class="text-xl font-medium text-text">{{ project.title }}</h3>
        </div>
        <p class="text-text-secondary mb-4">{{ project.description }}</p>
        <div class="flex flex-wrap gap-2">
          @for (tech of project.technologies; track tech) {
          <landing-badge>{{ tech }}</landing-badge>
          }
        </div>
      </landing-card>
      }
    </div>
  </landing-container>
</landing-section>
```

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
