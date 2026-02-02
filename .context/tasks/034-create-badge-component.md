# Task: Create Badge Component

## Status: pending

## Goal
Build the Badge component for tags, labels, and status indicators.

## Context
Phase 4 of Design System epic - Base Components. Badge is used for technology tags, status indicators, and category labels.

## Acceptance Criteria
- [ ] BadgeComponent created with selector `lib-badge`
- [ ] Color variants: `primary` (default), `success`, `warning`, `error`
- [ ] Uses semantic tokens (bg-primary-container, text-primary, etc.)
- [ ] Small, pill-shaped design (rounded-full, text-xs)
- [ ] Content projection for badge text
- [ ] SCSS file follows BEM naming convention
- [ ] Unit tests with >70% coverage

## Technical Notes
```typescript
// libs/ui/src/components/badge/badge.component.ts
@Component({
  selector: 'lib-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses">
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  @Input() color: 'primary' | 'success' | 'warning' | 'error' = 'primary';

  get badgeClasses(): string {
    return `badge badge--${this.color}`;
  }
}
```

Styles:
```scss
.badge {
  @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;

  &--primary {
    @apply bg-primary-container text-primary;
  }

  &--success {
    @apply bg-green-100 text-green-700;
    .dark & {
      @apply bg-green-900 text-green-300;
    }
  }

  &--warning {
    @apply bg-amber-100 text-amber-700;
    .dark & {
      @apply bg-amber-900 text-amber-300;
    }
  }

  &--error {
    @apply bg-red-100 text-red-700;
    .dark & {
      @apply bg-red-900 text-red-300;
    }
  }
}
```

Usage:
```html
<lib-badge>TypeScript</lib-badge>
<lib-badge color="success">Published</lib-badge>
<lib-badge color="warning">Draft</lib-badge>
<lib-badge color="error">Archived</lib-badge>
```

## Files to Touch
- `libs/ui/src/components/badge/badge.component.ts` (create)
- `libs/ui/src/components/badge/badge.component.scss` (create)
- `libs/ui/src/components/badge/badge.component.spec.ts` (create)
- `libs/ui/src/components/badge/index.ts` (create)
- `libs/ui/src/index.ts` (export)

## Dependencies
- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log
