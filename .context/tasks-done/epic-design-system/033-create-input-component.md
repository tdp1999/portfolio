# Task: Create Input Component

## Status: completed

## Goal

Build the Input component with validation states and Angular Forms integration.

## Context

Phase 4 of Design System epic - Base Components. Input is essential for forms (contact, search, etc.) and needs to integrate with Angular's reactive forms.

## Acceptance Criteria

- [x] InputComponent created with selector `landing-input`
- [x] Props: `type`, `placeholder`, `error?: boolean`, `disabled?: boolean`
- [x] Implements ControlValueAccessor for Angular Forms integration
- [x] Uses semantic tokens (bg-surface, border-border, focus:border-primary)
- [x] Error state shows red border
- [x] Focus state shows primary color ring
- [x] SCSS file follows BEM naming convention
- [x] Unit tests with 95.83% coverage (exceeds 70% requirement)
- [x] Works with both template-driven and reactive forms

## Technical Notes

```typescript
// libs/landing/shared/ui/src/components/input/input.component.ts
@Component({
  selector: 'landing-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      [type]="type"
      [placeholder]="placeholder"
      [class]="inputClasses"
      [disabled]="disabled"
      [value]="value"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() error = false;
  @Input() disabled = false;

  value = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  // ControlValueAccessor implementation...
}
```

Styles:

```scss
.input {
  @apply w-full bg-surface border border-border rounded-md px-3 py-2;
  @apply text-text placeholder:text-text-muted;
  @apply transition-colors duration-150;
  @apply focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary;

  &--error {
    @apply border-error focus:border-error focus:ring-error;
  }

  &:disabled {
    @apply bg-gray-100 cursor-not-allowed opacity-60;
  }
}
```

## Files to Touch

- `libs/landing/shared/ui/src/components/input/input.component.ts` (create)
- `libs/landing/shared/ui/src/components/input/input.component.scss` (create)
- `libs/landing/shared/ui/src/components/input/input.component.spec.ts` (create)
- `libs/landing/shared/ui/src/components/input/index.ts` (create)
- `libs/landing/shared/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: M

## Progress Log

- [2026-02-10] Started implementation
- [2026-02-10] Created InputComponent with Angular 21 signal-based inputs
- [2026-02-10] Implemented ControlValueAccessor for Angular Forms integration
- [2026-02-10] Added SCSS styles with BEM naming and semantic tokens
- [2026-02-10] Wrote comprehensive unit tests (27 tests)
- [2026-02-10] Fixed NgModel import issue (removed, using standalone component correctly)
- [2026-02-10] Fixed test mocking (migrated from Jasmine to Jest)
- [2026-02-10] All 27 tests passing with 95.83% coverage (95.65% lines, 100% branches)
- [2026-02-10] Added input showcase to DDL page with all states and types
- [2026-02-10] Formatted all files with Prettier
- [2026-02-10] Completed - ready for use in project
