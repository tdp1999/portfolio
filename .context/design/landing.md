# Landing Page Design

> Components, layout recipes, icon system, and visual rules for the landing page.
> For shared tokens and foundations, see `foundations.md`.

## Component Inventory

All components use the `landing-` prefix and follow Angular standalone component conventions.
Import from `@portfolio/landing/shared/ui`.

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
  imports: [RouterLink, LinkDirective],
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

## Icon System

The icon system uses a provider pattern allowing different icon libraries to be swapped at build time. Currently uses Lucide icons.

### Usage

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
