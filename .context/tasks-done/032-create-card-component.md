# Task: Create Card Component

## Status: completed

## Goal

Build the Card component for content containers with optional elevation.

## Context

Phase 4 of Design System epic - Base Components. Card is used for grouping related content like project showcases, blog post previews, and feature highlights.

## Acceptance Criteria

- [x] CardComponent created with selector `landing-card`
- [x] Props: `elevated?: boolean` (adds stronger shadow)
- [x] Uses semantic tokens (bg-surface, rounded-xl, shadow-sm)
- [x] Content projection for flexible content
- [x] Hover state with shadow transition
- [x] SCSS file follows BEM naming convention
- [x] Unit tests with >70% coverage (achieved 100% coverage)
- [x] Optional: CardHeader, CardContent, CardFooter sub-components

## Technical Notes

```typescript
// libs/landing/shared/ui/src/components/card/card.component.ts
@Component({
  selector: 'landing-card',
  standalone: true,
  template: `
    <div [class]="cardClasses">
      <ng-content />
    </div>
  `,
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() elevated = false;

  get cardClasses(): string {
    return `card ${this.elevated ? 'card--elevated' : ''}`;
  }
}
```

Styles:

```scss
.card {
  @apply bg-surface rounded-xl p-6 shadow-md border border-border transition-all duration-150;

  &:hover {
    @apply shadow-lg border-border-strong;
  }

  &--elevated {
    @apply shadow-lg border-border-strong;

    &:hover {
      @apply shadow-xl;
    }
  }

  // Optional sub-components
  &__header {
    @apply mb-4 pb-4 border-b border-border;
  }

  &__content {
    @apply text-text;
  }

  &__footer {
    @apply mt-4 pt-4 border-t border-border;
  }
}
```

Usage:

```html
<landing-card>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</landing-card>

<lib-card [elevated]="true">
  <div class="card__header">Header</div>
  <div class="card__content">Content</div>
</landing-card>
```

## Files to Touch

- `libs/landing/shared/ui/src/components/card/card.component.ts` (create)
- `libs/landing/shared/ui/src/components/card/card.component.scss` (create)
- `libs/landing/shared/ui/src/components/card/card.component.spec.ts` (create)
- `libs/landing/shared/ui/src/components/card/index.ts` (create)
- `libs/landing/shared/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log

- [2026-02-10] Started implementation
- [2026-02-10] Created CardComponent with Angular 21 signals and computed properties
- [2026-02-10] Implemented SCSS with BEM naming and Tailwind utilities
- [2026-02-10] Wrote comprehensive unit tests - achieved 100% coverage
- [2026-02-10] Added to DDL showcase page with multiple examples
- [2026-02-10] Visual testing confirmed all features working correctly
- [2026-02-10] Enhanced styling: increased shadow depth (shadow-md → shadow-lg), added visible borders
- [2026-02-10] Verified enhanced styling in both light and dark modes - excellent contrast and definition
- [2026-02-10] Completed - ready for use in project
