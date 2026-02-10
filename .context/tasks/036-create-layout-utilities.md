# Task: Create Container and Section Layout Components

## Status: completed

## Goal

Build layout utility components for consistent page structure (Container for max-width, Section for vertical spacing).

## Context

Phase 4 of Design System epic - Base Components. Layout utilities ensure consistent spacing and responsive behavior across pages.

## Acceptance Criteria

- [x] ContainerComponent created with selector `landing-container`
- [x] Container has max-width constraint and horizontal padding
- [x] Optional `wide` signal input for wider content (max-w-6xl vs max-w-4xl)
- [x] SectionComponent created with selector `landing-section`
- [x] Section has vertical padding that scales with breakpoints
- [x] Both components support content projection
- [x] Both work correctly with responsive design
- [x] SCSS files follow BEM naming convention
- [x] Unit tests for both components

## Technical Notes

```typescript
// libs/landing/shared/ui/src/components/container/container.component.ts
@Component({
  selector: 'landing-container',
  standalone: true,
  template: `
    <div [class]="containerClasses()">
      <ng-content />
    </div>
  `,
  styleUrl: './container.component.scss',
})
export class ContainerComponent {
  wide = input(false);

  containerClasses = computed(() =>
    `container ${this.wide() ? 'container--wide' : ''}`
  );
}

// libs/landing/shared/ui/src/components/section/section.component.ts
@Component({
  selector: 'landing-section',
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
<landing-section>
  <landing-container>
    <h2>Section Title</h2>
    <p>Section content...</p>
  </landing-container>
</landing-section>

<landing-section>
  <landing-container [wide]="true">
    <!-- Wide content like card grids -->
  </landing-container>
</landing-section>
```

## Files to Touch

- `libs/landing/shared/ui/src/components/container/container.component.ts` (create)
- `libs/landing/shared/ui/src/components/container/container.component.scss` (create)
- `libs/landing/shared/ui/src/components/container/container.component.spec.ts` (create)
- `libs/landing/shared/ui/src/components/container/index.ts` (create)
- `libs/landing/shared/ui/src/components/section/section.component.ts` (create)
- `libs/landing/shared/ui/src/components/section/section.component.scss` (create)
- `libs/landing/shared/ui/src/components/section/section.component.spec.ts` (create)
- `libs/landing/shared/ui/src/components/section/index.ts` (create)
- `libs/landing/shared/ui/src/index.ts` (export both)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log

- Created ContainerComponent with signal input and computed classes
- Created SectionComponent with responsive vertical padding
- Implemented unit tests for both components (9 tests total)
- Fixed test issue with stale DOM references
- All tests passing (121/121)
- Components exported from main index
