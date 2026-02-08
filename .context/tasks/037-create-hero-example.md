# Task: Create Hero Section Example

## Status: pending

## Goal

Build an example hero section in the landing app demonstrating design system usage.

## Context

Phase 4 of Design System epic - Examples. This validates that components work together and provides a reference implementation for future features.

## Acceptance Criteria

- [ ] HeroExampleComponent created in landing app
- [ ] Uses Button, Link, Container, Section components
- [ ] Uses Icon component for decorative elements
- [ ] Uses Tailwind layout utilities (flex, gap, items-center)
- [ ] Responsive design (mobile-first)
- [ ] Typography uses custom fluid scale (text-5xl for heading)
- [ ] Component is temporary for validation (can be removed or repurposed later)

## Technical Notes

```typescript
// apps/landing/src/app/examples/hero-example.component.ts
@Component({
  selector: 'app-hero-example',
  standalone: true,
  imports: [ButtonComponent, LinkDirective, ContainerComponent, SectionComponent, IconComponent],
  template: `
    <lib-section>
      <lib-container>
        <div class="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div class="flex-1 text-center md:text-left">
            <h1 class="text-4xl md:text-5xl font-semibold tracking-tight text-text">
              Hi, I'm <span class="text-primary">John Doe</span>
            </h1>
            <p class="mt-4 text-lg text-text-secondary">
              Full-stack developer passionate about building great user experiences.
            </p>
            <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <lib-button variant="primary" size="lg">
                View Projects
                <lib-icon name="arrow-right" size="md" class="ml-2" />
              </lib-button>
              <lib-button variant="secondary" size="lg"> Contact Me </lib-button>
            </div>
          </div>
          <div class="flex-shrink-0">
            <!-- Placeholder for profile image or illustration -->
            <div
              class="w-64 h-64 rounded-full bg-primary-container flex items-center justify-center"
            >
              <lib-icon name="user" size="xl" class="text-primary" />
            </div>
          </div>
        </div>
      </lib-container>
    </lib-section>
  `,
})
export class HeroExampleComponent {}
```

Location: `apps/landing/src/app/examples/hero-example.component.ts`

Include in app.component.html for testing:

```html
<app-hero-example />
```

## Files to Touch

- `apps/landing/src/app/examples/hero-example.component.ts` (create)
- `apps/landing/src/app/app.component.html` (add example)
- `apps/landing/src/app/app.component.ts` (import example)

## Dependencies

- 031-create-button-component
- 035-create-link-component
- 036-create-layout-utilities
- 029-create-icon-component

## Complexity: M

## Progress Log
