# Task: Create Button Component

## Status: pending

## Goal

Build the Button component with variants (primary, secondary, ghost) and sizes.

## Context

Phase 4 of Design System epic - Base Components. Button is a fundamental component used throughout the application for actions and CTAs.

## Acceptance Criteria

- [ ] ButtonComponent created with selector `lib-button`
- [ ] Variants: `primary` (default), `secondary`, `ghost`
- [ ] Sizes: `sm`, `md` (default), `lg`
- [ ] Disabled state supported with visual feedback
- [ ] Uses semantic tokens (bg-primary, text-on-primary, etc.)
- [ ] Supports content projection for button text/icons
- [ ] Click events work correctly
- [ ] Hover/focus states styled
- [ ] SCSS file follows BEM naming convention
- [ ] Unit tests with >70% coverage

## Technical Notes

```typescript
// libs/ui/src/components/button/button.component.ts
@Component({
  selector: 'lib-button',
  standalone: true,
  template: `
    <button [class]="buttonClasses" [disabled]="disabled" (click)="onClick($event)">
      <ng-content />
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Output() buttonClick = new EventEmitter<MouseEvent>();
}
```

Styles (Tailwind + semantic tokens):

```scss
.btn {
  @apply rounded-lg font-medium transition-colors duration-150;

  &--primary {
    @apply bg-primary text-on-primary hover:bg-primary-hover;
  }

  &--secondary {
    @apply bg-surface border border-border text-text hover:bg-gray-50;
  }

  &--ghost {
    @apply bg-transparent text-primary hover:bg-primary-container;
  }

  &--sm {
    @apply px-3 py-1.5 text-sm;
  }
  &--md {
    @apply px-4 py-2 text-base;
  }
  &--lg {
    @apply px-6 py-3 text-lg;
  }

  &:disabled {
    @apply opacity-50 cursor-not-allowed;
  }
}
```

## Files to Touch

- `libs/ui/src/components/button/button.component.ts` (create)
- `libs/ui/src/components/button/button.component.scss` (create)
- `libs/ui/src/components/button/button.component.spec.ts` (create)
- `libs/ui/src/components/button/index.ts` (create)
- `libs/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: M

## Progress Log
