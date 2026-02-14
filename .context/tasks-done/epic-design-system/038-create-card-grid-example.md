# Task: Create Card Grid Example

## Status: completed

## Goal

Build an example card grid section in feature-home demonstrating Card and Badge components in a responsive layout.

## Context

Phase 4 of Design System epic - Examples. This validates card and grid patterns for project showcases on the home page.

## Acceptance Criteria

- [x] Card grid section added to feature-home.html (below hero)
- [x] Uses Card, Badge, Container, Section components
- [x] Uses Tailwind grid utilities (grid, grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-8)
- [x] At least 3 example cards with different content
- [x] Cards show title, description, and technology badges
- [x] Responsive grid collapses correctly on mobile
- [x] Hover states work on cards
- [x] Projects data defined in feature-home.ts

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
  IconComponent,
  CardComponent,
  BadgeComponent,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-feature-home',
  imports: [
    RouterLink,
    ButtonComponent,
    LinkDirective,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    CardComponent,
    BadgeComponent,
  ],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {
  projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with real-time inventory.',
      icon: 'shopping-cart',
      technologies: ['Angular', 'NestJS', 'PostgreSQL'],
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'Collaborative task management with real-time updates.',
      icon: 'check-square',
      technologies: ['React', 'Node.js', 'MongoDB'],
    },
    {
      id: 3,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard with interactive charts.',
      icon: 'bar-chart',
      technologies: ['Vue', 'D3.js', 'Firebase'],
    },
  ];
}
```

Add to template (after hero section):

```html
<landing-section>
  <landing-container [wide]="true">
    <h2 class="text-3xl font-semibold text-center mb-12">Featured Projects</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      @for (project of projects; track project.id) {
      <landing-card>
        <div class="flex items-center gap-2 mb-3">
          <landing-icon [name]="project.icon" size="md" class="text-primary" />
          <h3 class="text-xl font-medium">{{ project.title }}</h3>
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

Note: May need to add additional icons to Lucide provider (shopping-cart, check-square, bar-chart).

## Files to Touch

- `libs/landing/feature-home/src/lib/feature-home/feature-home.ts` (update imports and add projects data)
- `libs/landing/feature-home/src/lib/feature-home/feature-home.html` (add card grid section)
- `libs/landing/shared/ui/src/components/icon/providers/lucide.provider.ts` (add icons if needed)

## Dependencies

- 032-create-card-component
- 034-create-badge-component
- 036-create-layout-utilities
- 029-create-icon-component

## Complexity: M

## Progress Log

- Added missing icons to Lucide provider (shopping-cart, check-square, bar-chart)
- Updated feature-home.ts with Card and Badge component imports
- Added projects data array with 3 example projects
- Added card grid section to feature-home.html below hero
- Implemented responsive 3-column grid (collapses to 1 column on mobile)
- Each card displays icon, title, description, and technology badges
- All 129 tests passing (ui: 108, feature-home: 8, landing: 13)
- Landing app builds successfully
