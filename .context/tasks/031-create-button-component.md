# Task: Create Button Component

## Status: completed

## Goal

Build the Button component with variants (primary, secondary, ghost) and sizes.

## Context

Phase 4 of Design System epic - Base Components. Button is a fundamental component used throughout the application for actions and CTAs.

## Acceptance Criteria

- [x] ButtonComponent created with selector `landing-button`
- [x] Variants: `primary` (default), `secondary`, `ghost`
- [x] Sizes: `sm`, `md` (default), `lg`
- [x] Disabled state supported with visual feedback
- [x] Uses semantic tokens (bg-primary, text-on-primary, etc.)
- [x] Supports content projection for button text/icons
- [x] Click events work correctly
- [x] Hover/focus states styled
- [x] SCSS file follows BEM naming convention
- [x] Unit tests with 100% coverage (exceeds 70% requirement)

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

- [2026-02-09] Started implementation
- [2026-02-09] Created ButtonComponent with Angular Signals architecture
- [2026-02-09] Implemented all variants (primary, secondary, ghost) and sizes (sm, md, lg)
- [2026-02-09] Added SCSS styles with BEM naming and semantic tokens
- [2026-02-09] Fixed disabled property shadowing issue (renamed to `isDisabled`)
- [2026-02-09] Wrote comprehensive unit tests - all 44 tests passing
- [2026-02-09] Achieved 100% code coverage (statements, functions, lines)
- [2026-02-09] Added button showcase to DDL page with all variants and sizes
- [2026-02-09] Exported from library index - component ready for use
- [2026-02-09] **REFACTORED:** Migrated to Angular v21 signal-based inputs (`input()` / `output()`)
- [2026-02-09] **FIXED:** Added `inline-flex` to SCSS for proper icon + text layout (removed wrapper div)
- [2026-02-09] **FIXED:** Updated all tests to use `fixture.componentRef.setInput()` for signal inputs
- [2026-02-09] **VERIFIED:** Playwright validation confirms all styling renders correctly
- [2026-02-09] All 17 tests passing, 100% coverage maintained
- [2026-02-09] Completed
