# Project Patterns

> This file contains both architectural decisions and code patterns.

## Architecture

### Overview

Monorepo structure with two applications sharing common packages:

1. **Landing Page** - Public-facing portfolio website (SSG/SSR)
2. **Dashboard** - Internal admin panel for content management

### Backend

- **Style:** Layered architecture
- **Layers:**
  - Controllers (API routes, request handling)
  - Services (business logic)
  - Repositories (data access)
- **Pattern:** Dependency injection, repository pattern
- **Domain Approach:** CRUD with structured data models

### Frontend (Both Apps)

- **Style:** Feature-modules
- **Pattern:**
  - Features own their components, hooks, and utilities
  - Shared components in packages/ui
  - Shared types in packages/types
- **State Management:** React Context + hooks (or Zustand if complexity grows)

### Boundaries

- **API Style:** REST API
- **Data Flow:**
  - Dashboard → API → Database (write)
  - Landing Page → API → Database (read, with caching)
- **Stage 1:** Mock JSON data with simulated API layer

### Monorepo Structure

```
/
├── apps/
│   ├── landing/          # Public portfolio site (Angular SSR)
│   ├── landing-e2e/      # Playwright E2E tests
│   ├── api/              # NestJS backend API
│   └── api-e2e/          # API integration tests
│
├── libs/
│   ├── shared/           # Global shared (FE + BE)
│   │   ├── types/        # @portfolio/shared/types
│   │   ├── utils/        # @portfolio/shared/utils
│   │   └── testing/      # @portfolio/shared/testing
│   │
│   └── landing/          # Landing app scope
│       ├── shared/
│       │   ├── data-access/  # @portfolio/landing/shared/data-access
│       │   ├── ui/           # @portfolio/landing/shared/ui
│       │   └── util/         # @portfolio/landing/shared/util
│       │
│       ├── feature-projects/     # Future feature libs
│       ├── feature-skills/
│       └── feature-experience/
│
└── data/
    └── mock/             # Stage 1: Mock JSON data
```

### Library Scoping & Module Boundaries

Libraries are organized by scope with ESLint `@nx/enforce-module-boundaries` enforcement.

#### Tag System

| Scope           | Tags                                  | Import Path                         |
| --------------- | ------------------------------------- | ----------------------------------- |
| Global shared   | `scope:shared`, `type:{name}`         | `@portfolio/shared/{name}`          |
| Landing shared  | `scope:landing`, `type:shared-{type}` | `@portfolio/landing/shared/{type}`  |
| Landing feature | `scope:landing`, `type:feature`       | `@portfolio/landing/feature-{name}` |

#### Dependency Rules

```
Features → Landing Shared → Global Shared
```

- Features cannot import other features directly
- `scope:shared` cannot import `scope:landing`
- `type:shared-data-access` cannot import `type:shared-ui`

Use `/ng-lib` skill to generate new libraries with correct tags.

### Modules

#### Landing Page Features

| Feature    | Responsibility                          |
| ---------- | --------------------------------------- |
| home       | Hero, about summary, work overview, CTA |
| experience | Professional career history display     |
| projects   | Side projects showcase + detail pages   |
| blog       | Articles listing + individual posts     |
| contact    | Contact form                            |

#### Dashboard Features

| Feature  | Responsibility                              |
| -------- | ------------------------------------------- |
| auth     | Login, session management                   |
| content  | Manage about, experience, skills            |
| projects | CRUD for projects                           |
| blog     | Blog post editor and management             |
| settings | Site settings, resume uploads, theme config |

#### Shared Libraries

| Library                    | Import Path                             | Responsibility                            |
| -------------------------- | --------------------------------------- | ----------------------------------------- |
| shared/types               | `@portfolio/shared/types`               | TypeScript interfaces shared across FE+BE |
| shared/utils               | `@portfolio/shared/utils`               | Utilities shared across FE+BE             |
| shared/testing             | `@portfolio/shared/testing`             | Test factories and mocks                  |
| landing/shared/data-access | `@portfolio/landing/shared/data-access` | API services, state management            |
| landing/shared/ui          | `@portfolio/landing/shared/ui`          | Landing-specific UI components            |
| landing/shared/util        | `@portfolio/landing/shared/util`        | Landing-specific utilities                |

### Domains

#### Content Domain

- **Entities:** Profile, Experience, Skill, Testimonial
- **Boundaries:** Personal information and career data
- **Managed by:** Dashboard content feature

#### Projects Domain

- **Entities:** Project, ProjectDetail, Technology
- **Boundaries:** Side projects and their metadata
- **Managed by:** Dashboard projects feature

#### Blog Domain

- **Entities:** Post, Category, Tag
- **Boundaries:** Articles and blog content
- **Managed by:** Dashboard blog feature

#### Settings Domain

- **Entities:** SiteConfig, Resume, Language
- **Boundaries:** Site-wide configuration
- **Managed by:** Dashboard settings feature

### Angular Material Integration

#### When to Use Material vs Custom Components

- **Use Material** for: form controls (inputs, selects, checkboxes), data tables, dialogs/overlays, date pickers, progress indicators, snackbars
- **Use custom components** for: hero sections, project cards, navigation, marketing layouts — anything highly design-specific

#### Theme Token Override Pattern

Material M3 tokens are overridden in `libs/landing/shared/ui/src/styles/material/overrides.scss` via `mat.theme-overrides()`:

```scss
@use '@angular/material' as mat;

html {
  color-scheme: light dark;

  @include mat.theme(
    (
      color: mat.$azure-palette,
      typography: 'Inter',
      density: 0,
    )
  );

  @include mat.theme-overrides(
    (
      primary: var(--color-primary),
      on-primary: var(--color-text-on-primary),
      surface: var(--color-surface),
      on-surface: var(--color-text),
    )
  );
}
```

#### Dark Mode Behavior

- Buttons respond correctly to `.dark` class on `<html>` — primary color shifts to lighter shade
- `mat-card` uses its own M3 surface elevation token (not fully overridden) — card stays light in dark mode
- To fully dark-theme cards, add explicit dark override: `.dark { @include mat.theme-overrides((surface: var(--color-surface))) }`

#### Avoiding Tailwind/Material Conflicts

- Material components use `::ng-deep` encapsulation — Tailwind utilities applied **inside** Material components may be overridden
- Prefer `mat.theme-overrides()` for styling Material internals rather than utility classes
- No z-index conflicts observed — CDK overlay container sits above content correctly
- Tailwind `rounded-*`, `shadow-*` etc. should NOT be applied directly to `mat-button` or `mat-card` — use wrapping divs instead

### Icon System

The icon system uses a provider pattern allowing different icon libraries to be swapped at build time. Currently uses Lucide icons.

#### Usage

```html
<!-- Basic usage -->
<landing-icon name="arrow-right" />

<!-- Custom size (px) -->
<landing-icon name="check" [size]="32" />

<!-- Colored via Tailwind -->
<landing-icon name="github" class="text-accent-500" />
<landing-icon name="mail" class="text-primary" />
```

#### Architecture

- **`IconProvider` interface** — `getSvg(name, size)` returns SVG string or `null`
- **`ICON_PROVIDER` token** — DI token for the active provider
- **`provideIcons(provider)`** — registers provider in `app.config.ts`
- **`IconComponent`** (`<landing-icon>`) — renders SVG via `innerHTML` with `DomSanitizer`

#### Available Icons (32 mapped)

`arrow-right`, `arrow-left`, `arrow-up`, `arrow-down`, `check`, `close`/`x`, `menu`, `search`, `home`, `user`, `settings`, `mail`, `github`, `linkedin`, `external-link`, `download`, `sun`, `moon`, `chevron-right`, `chevron-left`, `chevron-up`, `chevron-down`, `plus`, `minus`, `eye`, `eye-off`, `heart`, `star`, `briefcase`, `code`, `globe`, `phone`

#### Adding New Icons

Add entries to `ICON_MAP` in `libs/landing/shared/ui/src/components/icon/providers/lucide.provider.ts`:

```typescript
import { NewIcon } from 'lucide-angular';
// Add to ICON_MAP:
'new-icon': NewIcon,
```

## Design System

The landing page uses a custom design system built with a three-layer token architecture, combining Tailwind utilities with SCSS for component styling.

### Token Architecture

Three-layer system following industry best practices (inspired by Material Design 3 tokens):

1. **Primitive Tokens (Layer 1):** Raw color values - Tailwind defaults + custom HSL palette
2. **Semantic Tokens (Layer 2):** Contextual mappings - CSS custom properties like `--color-primary`, `--color-surface`
3. **Component Tokens (Layer 3):** Component-specific styles - defined in component SCSS files

**Token Files:**

- `libs/landing/shared/ui/src/styles/tokens/colors.scss` - Semantic color tokens
- `libs/landing/shared/ui/src/styles/themes/dark.scss` - Dark mode overrides
- `libs/landing/shared/ui/src/styles/tokens/typography.scss` - Typography tokens

### Color Usage

#### Semantic Color Tokens

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

#### Direct Tailwind Colors

For decorative elements or when semantic tokens don't fit:

```html
<!-- Tailwind gray scale -->
<div class="bg-gray-100 text-gray-700">Light gray container</div>

<!-- Accent palette (via Tailwind config) -->
<div class="bg-accent-100 text-accent-700">Light accent container</div>
<div class="bg-accent-500 text-white">Strong accent</div>
```

#### Available Semantic Tokens

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

### Typography Usage

#### Tailwind Text Utilities

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

#### Typography Tokens (CSS Custom Properties)

Available but not required for most use cases:

- `--font-sans`: `'Inter', system-ui, sans-serif`
- `--font-mono`: `'Fira Code', 'Consolas', monospace`

### Component Usage

All components use the `landing-` prefix and follow Angular standalone component conventions.

#### Button

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

#### Card

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

#### Input

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

#### Badge

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

#### Link

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

#### Container

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

#### Section

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

#### Icon

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

### Layout Patterns

#### Hero Section

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

#### Card Grid (Projects Showcase)

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

**Component TypeScript:**

```typescript
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SectionComponent, ContainerComponent, CardComponent, IconComponent, BadgeComponent],
  // ...
})
export class HomeComponent {
  projects = [
    {
      id: '1',
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with real-time inventory.',
      icon: 'shopping-cart',
      technologies: ['Angular', 'NestJS', 'PostgreSQL'],
    },
    // ...
  ];
}
```

### Dark Mode

Dark mode is activated by adding the `.dark` class to the `<html>` element. All semantic color tokens automatically adjust.

#### Manual Toggle (DevTools)

```javascript
// Activate dark mode
document.documentElement.classList.add('dark');

// Deactivate dark mode
document.documentElement.classList.remove('dark');
```

#### TypeScript Toggle Implementation

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

### Tailwind + SCSS Hybrid Approach

The design system uses a hybrid styling approach:

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

#### SCSS Component Pattern

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

#### BEM Naming for Custom CSS

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

### Responsive Design

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

### Accessibility

All components follow accessibility best practices:

- **Buttons:** Implicit `role="button"`, accessible names via text content
- **Links:** Use `routerLink` or `href` with descriptive text, external links include visual indicator
- **Icons:** Decorative icons use `aria-hidden="true"` (implemented in IconComponent)
- **Color contrast:** All text meets WCAG AA standards in both light and dark modes
- **Focus states:** Visible focus rings on interactive elements
- **Semantic HTML:** Proper heading hierarchy, native form controls

### Architecture Changelog

#### [2026-02-02] Standardize Styling to SCSS

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

## Code Patterns

### Styling Patterns

#### SCSS Organization

- **Style Language:** SCSS (Sass) for all components and global styles
- **File Extensions:** `.scss` exclusively (no `.css` files in source)
- **Naming:** Component styles follow component name (e.g., `button.component.scss`)

#### SCSS Structure

```scss
// Component styles use SCSS features
.component-name {
  // Variables
  $component-spacing: 1rem;

  // Nesting
  &__element {
    padding: $component-spacing;

    &--modifier {
      color: blue;
    }
  }

  // Media queries
  @media (min-width: 768px) {
    padding: 2rem;
  }
}
```

#### Future SCSS Architecture (To be implemented)

- **Variables:** Global design tokens (colors, spacing, typography)
- **Mixins:** Reusable style patterns (breakpoints, flexbox utilities)
- **Themes:** SCSS variable-based theming system
- **Organization:** To be defined when implementing design system

### API Layer Pattern (Stage 1)

```typescript
// Abstracted API client that works with mock data initially
interface ApiClient {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: unknown): Promise<T>;
  // ...
}

// Mock implementation for Stage 1
class MockApiClient implements ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    // Load from /data/mock/*.json
  }
}

// Real implementation for Stage 2+
class HttpApiClient implements ApiClient {
  // Actual HTTP calls
}
```

### Feature Module Pattern

```
feature/
├── components/       # Feature-specific components
├── hooks/           # Feature-specific hooks
├── api/             # Feature API calls
├── types.ts         # Feature types
└── index.ts         # Public exports
```

### i18n Pattern

- Translations stored in `/locales/{lang}/*.json`
- Language detection: URL param > cookie > browser preference > default
- Resume download matches current language selection

## Naming Conventions

### Files

- Components: `PascalCase.ts` (e.g., `ProjectCard.component.ts`)
- Component Styles: `PascalCase.scss` matching component (e.g., `ProjectCard.component.scss`)
- Global Styles: `kebab-case.scss` (e.g., `styles.scss`, `theme-variables.scss`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useProjects.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` or `types.ts`
- API routes: `kebab-case` (e.g., `/api/blog-posts`)

### Code

- Interfaces: `PascalCase` with `I` prefix optional (prefer without)
- Types: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- CSS classes: `kebab-case` with BEM for components (`.component-name__element--modifier`)
- SCSS variables: `$kebab-case` (e.g., `$primary-color`, `$base-spacing`)

## File Organization

### Imports Order

1. External packages
2. Internal packages (@packages/\*)
3. App-level imports (@/\*)
4. Relative imports (./)

### Export Pattern

- Named exports preferred over default exports
- Re-export from feature index.ts for clean imports

## Testing Patterns

> For TDD workflow, coverage targets, and subagent usage, see `testing-guide.md`

### Test Structure (AAA Pattern)

```typescript
describe('ProjectService', () => {
  describe('getProject', () => {
    it('should return project when found', async () => {
      // Arrange
      const mockProject = { id: '1', title: 'Test Project' };
      mockRepository.findById.mockResolvedValue(mockProject);

      // Act
      const result = await service.getProject('1');

      // Assert
      expect(result).toEqual(mockProject);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });
  });
});
```

### API Endpoint Testing Pattern

```typescript
// NestJS Controller Test
describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  describe('GET /api/projects', () => {
    it('should return array of projects', async () => {
      const projects = [{ id: '1', title: 'Project 1' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(projects);

      expect(await controller.findAll()).toBe(projects);
    });
  });
});
```

### Component Testing Pattern

```typescript
// Angular Component Test
describe('ProjectCardComponent', () => {
  let component: ProjectCardComponent;
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    component = fixture.componentInstance;
  });

  it('should display project title', () => {
    component.project = { id: '1', title: 'Test Project', description: 'Desc' };
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('h3');
    expect(title.textContent).toContain('Test Project');
  });

  it('should emit click event when clicked', () => {
    const project = { id: '1', title: 'Test', description: 'Desc' };
    component.project = project;

    jest.spyOn(component.projectClick, 'emit');

    const card = fixture.nativeElement.querySelector('.project-card');
    card.click();

    expect(component.projectClick.emit).toHaveBeenCalledWith(project);
  });
});
```

### E2E Testing Pattern (Playwright)

```typescript
// tests/landing/projects.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Projects Page', () => {
  test('should display list of projects', async ({ page }) => {
    await page.goto('/projects');

    // Wait for projects to load
    await page.waitForSelector('[data-testid="project-card"]');

    // Verify projects are displayed
    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards).toHaveCount(3);
  });

  test('should navigate to project detail', async ({ page }) => {
    await page.goto('/projects');

    // Click first project
    await page.click('[data-testid="project-card"]:first-child');

    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/projects\/.+/);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Test Data Factories

```typescript
// tests/factories/project.factory.ts
export const createMockProject = (overrides = {}) => ({
  id: '1',
  title: 'Mock Project',
  description: 'A test project',
  technologies: ['TypeScript', 'React'],
  startDate: '2024-01-01',
  endDate: '2024-06-01',
  url: 'https://example.com',
  ...overrides,
});

// Usage in tests
const project = createMockProject({ title: 'Custom Title' });
```

### Mock Service Pattern

```typescript
// tests/mocks/api-client.mock.ts
export const createMockApiClient = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});

// Usage
const mockApiClient = createMockApiClient();
mockApiClient.get.mockResolvedValue({ data: [...] });
```

### Test Coverage Requirements

- **Business Logic (Services):** 80-90% line coverage
- **API Controllers:** 90%+ line coverage
- **Complex Components:** 70-80% line coverage
- **Utilities/Helpers:** 90%+ line coverage
- **Simple UI Components:** Optional (focus on integration/E2E instead)

### Testing Best Practices

1. **Co-locate tests:** Place `.spec.ts` files next to source files
2. **Test behavior, not implementation:** Focus on what the code does, not how
3. **One assertion per test:** Keep tests focused and clear
4. **Use descriptive test names:** `it('should return 404 when project not found')`
5. **Avoid test interdependence:** Each test should be independent
6. **Mock external dependencies:** API calls, databases, third-party services
7. **Use data-testid attributes:** For reliable E2E selectors
8. **Test error cases:** Don't just test happy paths
