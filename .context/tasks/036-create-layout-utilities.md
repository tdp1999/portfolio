# Task: Create Container and Section Layout Components

## Status: pending

## Goal
Build layout utility components for consistent page structure (Container for max-width, Section for vertical spacing).

## Context
Phase 4 of Design System epic - Base Components. Layout utilities ensure consistent spacing and responsive behavior across pages.

## Acceptance Criteria
- [ ] ContainerComponent created with selector `lib-container`
- [ ] Container has max-width constraint and horizontal padding
- [ ] Optional `wide` prop for wider content (max-w-6xl vs max-w-4xl)
- [ ] SectionComponent created with selector `lib-section`
- [ ] Section has vertical padding that scales with breakpoints
- [ ] Both components support content projection
- [ ] Both work correctly with responsive design
- [ ] SCSS files follow BEM naming convention
- [ ] Unit tests for both components

## Technical Notes
```typescript
// libs/ui/src/components/container/container.component.ts
@Component({
  selector: 'lib-container',
  standalone: true,
  template: `
    <div [class]="containerClasses">
      <ng-content />
    </div>
  `,
  styleUrl: './container.component.scss',
})
export class ContainerComponent {
  @Input() wide = false;

  get containerClasses(): string {
    return `container ${this.wide ? 'container--wide' : ''}`;
  }
}

// libs/ui/src/components/section/section.component.ts
@Component({
  selector: 'lib-section',
  standalone: true,
  template: `
    <section class="section">
      <ng-content />
    </section>
  `,
  styleUrl: './section.component.scss',
})
export class SectionComponent {}
```

Styles:
```scss
// container.component.scss
.container {
  @apply mx-auto max-w-4xl px-4 md:px-8;

  &--wide {
    @apply max-w-6xl;
  }
}

// section.component.scss
.section {
  @apply py-16 md:py-24 lg:py-32;
}
```

Usage:
```html
<lib-section>
  <lib-container>
    <h2>Section Title</h2>
    <p>Section content...</p>
  </lib-container>
</lib-section>

<lib-section>
  <lib-container [wide]="true">
    <!-- Wide content like card grids -->
  </lib-container>
</lib-section>
```

## Files to Touch
- `libs/ui/src/components/container/container.component.ts` (create)
- `libs/ui/src/components/container/container.component.scss` (create)
- `libs/ui/src/components/container/container.component.spec.ts` (create)
- `libs/ui/src/components/container/index.ts` (create)
- `libs/ui/src/components/section/section.component.ts` (create)
- `libs/ui/src/components/section/section.component.scss` (create)
- `libs/ui/src/components/section/section.component.spec.ts` (create)
- `libs/ui/src/components/section/index.ts` (create)
- `libs/ui/src/index.ts` (export both)

## Dependencies
- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log
