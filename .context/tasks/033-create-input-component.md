# Task: Create Input Component

## Status: pending

## Goal

Build the Input component with validation states and Angular Forms integration.

## Context

Phase 4 of Design System epic - Base Components. Input is essential for forms (contact, search, etc.) and needs to integrate with Angular's reactive forms.

## Acceptance Criteria

- [ ] InputComponent created with selector `lib-input`
- [ ] Props: `type`, `placeholder`, `error?: boolean`, `disabled?: boolean`
- [ ] Implements ControlValueAccessor for Angular Forms integration
- [ ] Uses semantic tokens (bg-surface, border-border, focus:border-primary)
- [ ] Error state shows red border
- [ ] Focus state shows primary color ring
- [ ] SCSS file follows BEM naming convention
- [ ] Unit tests with >70% coverage
- [ ] Works with both template-driven and reactive forms

## Technical Notes

```typescript
// libs/ui/src/components/input/input.component.ts
@Component({
  selector: 'lib-input',
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

- `libs/ui/src/components/input/input.component.ts` (create)
- `libs/ui/src/components/input/input.component.scss` (create)
- `libs/ui/src/components/input/input.component.spec.ts` (create)
- `libs/ui/src/components/input/index.ts` (create)
- `libs/ui/src/index.ts` (export)

## Dependencies

- 030-verify-icon-system (Phase 3 complete)

## Complexity: M

## Progress Log
