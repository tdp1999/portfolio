# Task: Create Card Component

## Status: pending

## Goal

Build the Card component for content containers with optional elevation.

## Context

Phase 4 of Design System epic - Base Components. Card is used for grouping related content like project showcases, blog post previews, and feature highlights.

## Acceptance Criteria

- [ ] CardComponent created with selector `lib-card`
- [ ] Props: `elevated?: boolean` (adds stronger shadow)
- [ ] Uses semantic tokens (bg-surface, rounded-xl, shadow-sm)
- [ ] Content projection for flexible content
- [ ] Hover state with shadow transition
- [ ] SCSS file follows BEM naming convention
- [ ] Unit tests with >70% coverage
- [ ] Optional: CardHeader, CardContent, CardFooter sub-components

## Technical Notes

```typescript
// libs/ui/src/components/card/card.component.ts
@Component({
  selector: 'lib-card',
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
  @apply bg-surface rounded-xl p-6 shadow-sm transition-shadow duration-150;

  &:hover {
    @apply shadow-md;
  }

  &--elevated {
    @apply shadow-md;

    &:hover {
      @apply shadow-lg;
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
<lib-card>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</lib-card>

<lib-card [elevated]="true">
  <div class="card__header">Header</div>
  <div class="card__content">Content</div>
</lib-card>
```

## Files to Touch

- `libs/ui/src/components/card/card.component.ts` (create)
- `libs/ui/src/components/card/card.component.scss` (create)
- `libs/ui/src/components/card/card.component.spec.ts` (create)
- `libs/ui/src/components/card/index.ts` (create)
- `libs/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log
