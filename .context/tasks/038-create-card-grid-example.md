# Task: Create Card Grid Example

## Status: pending

## Goal

Build an example card grid section demonstrating Card and Badge components in a responsive layout.

## Context

Phase 4 of Design System epic - Examples. This validates card and grid patterns for project showcases and blog listings.

## Acceptance Criteria

- [ ] CardGridExampleComponent created in landing app
- [ ] Uses Card, Badge, Container, Section components
- [ ] Uses Tailwind grid utilities (grid, grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-8)
- [ ] At least 3 example cards with different content
- [ ] Cards show title, description, and technology badges
- [ ] Responsive grid collapses correctly on mobile
- [ ] Hover states work on cards
- [ ] Component is temporary for validation

## Technical Notes

```typescript
// apps/landing/src/app/examples/card-grid-example.component.ts
@Component({
  selector: 'app-card-grid-example',
  standalone: true,
  imports: [CardComponent, BadgeComponent, ContainerComponent, SectionComponent, IconComponent],
  template: `
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
  `,
})
export class CardGridExampleComponent {
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

Note: May need to add additional icons to Lucide provider (shopping-cart, check-square, bar-chart).

## Files to Touch

- `apps/landing/src/app/examples/card-grid-example.component.ts` (create)
- `apps/landing/src/app/app.component.html` (add example)
- `apps/landing/src/app/app.component.ts` (import example)
- `libs/landing/shared/ui/src/components/icon/providers/lucide.provider.ts` (add icons if needed)

## Dependencies

- 032-create-card-component
- 034-create-badge-component
- 036-create-layout-utilities
- 029-create-icon-component

## Complexity: M

## Progress Log
