# Task: Create Hero Section Example

## Status: completed

## Goal

Build an example hero section in feature-home lib demonstrating design system usage.

## Context

Phase 4 of Design System epic - Examples. This validates that components work together and provides a reference implementation for the home page.

## Acceptance Criteria

- [x] Hero section added to feature-home.html template
- [x] Uses Button, Container, Section components
- [x] Uses Icon component for decorative elements
- [x] Uses Tailwind layout utilities (flex, gap, items-center)
- [x] Responsive design (mobile-first)
- [x] Typography uses custom fluid scale (text-5xl for heading)
- [x] All components imported in feature-home.ts
- [x] Home route displays correctly

## Technical Notes

```typescript
// libs/landing/feature-home/src/lib/feature-home/feature-home.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ButtonComponent,
  LinkDirective,
  ContainerComponent,
  SectionComponent,
  IconComponent
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-feature-home',
  imports: [
    RouterLink,
    ButtonComponent,
    LinkDirective,
    ContainerComponent,
    SectionComponent,
    IconComponent
  ],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {}
```

Template:

```html
<!-- libs/landing/feature-home/src/lib/feature-home/feature-home.html -->
<landing-section>
  <landing-container>
    <div class="flex flex-col md:flex-row items-center gap-8 md:gap-16">
      <div class="flex-1 text-center md:text-left">
        <h1 class="text-4xl md:text-5xl font-semibold tracking-tight text-text">
          Hi, I'm <span class="text-primary">Phuong</span>
        </h1>
        <p class="mt-4 text-lg text-text-secondary">
          Full-stack developer passionate about building great user experiences.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
          <landing-button variant="primary" size="lg">
            View Projects
            <landing-icon name="arrow-right" size="md" class="ml-2" />
          </landing-button>
          <landing-button variant="secondary" size="lg">Contact Me</landing-button>
        </div>
      </div>
      <div class="flex-shrink-0">
        <!-- Placeholder for profile image or illustration -->
        <div class="w-64 h-64 rounded-full bg-primary-container flex items-center justify-center">
          <landing-icon name="user" size="xl" class="text-primary" />
        </div>
      </div>
    </div>
  </landing-container>
</landing-section>
```

## Files to Touch

- `libs/landing/feature-home/src/lib/feature-home/feature-home.ts` (update imports)
- `libs/landing/feature-home/src/lib/feature-home/feature-home.html` (replace content)

## Dependencies

- 031-create-button-component
- 035-create-link-component
- 036-create-layout-utilities
- 029-create-icon-component

## Complexity: M

## Progress Log

- Updated feature-home.ts with Button, Container, Section, and Icon component imports
- Replaced feature-home.html with hero section implementation
- Hero includes responsive flex layout (mobile-first)
- Primary button with arrow-right icon, secondary button for contact
- Profile placeholder with user icon (80px)
- All 8 tests passing
- Landing app builds successfully
