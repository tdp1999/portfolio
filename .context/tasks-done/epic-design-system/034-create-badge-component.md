# Task: Create Badge Component

## Status: completed

## Goal

Build the Badge component for tags, labels, and status indicators.

## Context

Phase 4 of Design System epic - Base Components. Badge is used for technology tags, status indicators, and category labels.

## Acceptance Criteria

- [x] BadgeComponent created with selector `landing-badge`
- [x] Color variants: `primary` (default), `success`, `warning`, `error`
- [x] Uses semantic tokens (bg-primary-container, text-primary, etc.)
- [x] Small, pill-shaped design (rounded-full, text-xs)
- [x] Content projection for badge text
- [x] SCSS file follows BEM naming convention
- [x] Unit tests with >70% coverage (achieved 100%)

## Technical Notes

```typescript
// libs/landing/shared/ui/src/components/badge/badge.component.ts
@Component({
  selector: 'landing-badge',
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
<landing-badge>TypeScript</landing-badge>
<landing-badge color="success">Published</landing-badge>
<landing-badge color="warning">Draft</landing-badge>
<landing-badge color="error">Archived</landing-badge>
```

## Files to Touch

- `libs/landing/shared/ui/src/components/badge/badge.component.ts` (create)
- `libs/landing/shared/ui/src/components/badge/badge.component.scss` (create)
- `libs/landing/shared/ui/src/components/badge/badge.component.spec.ts` (create)
- `libs/landing/shared/ui/src/components/badge/index.ts` (create)
- `libs/landing/shared/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: S

## Progress Log

- [2026-02-10] Started implementation
- [2026-02-10] Created BadgeComponent with TypeScript, SCSS, and unit tests
- [2026-02-10] Achieved 100% test coverage (exceeds 70% requirement)
- [2026-02-10] Added badge examples to DDL page with all color variants
- [2026-02-10] Completed - All acceptance criteria met
