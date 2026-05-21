import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `landing-input` — single-line text input primitive (Variant B "sunken card").
 *
 * Bound to Angular Forms via `ControlValueAccessor` — usable with
 * `formControlName` (reactive) or `[(ngModel)]` (template-driven).
 *
 * For label + hint + error wiring use it inside a `landing-form-field`:
 * ```html
 * <landing-form-field label="Email" hint="We won't share it" [error]="emailError()">
 *   <landing-input formControlName="email" type="email" [hasError]="!!emailError()" />
 * </landing-form-field>
 * ```
 */
@Component({
  selector: 'landing-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      [type]="type()"
      [placeholder]="placeholder()"
      [class]="inputClasses()"
      [disabled]="disabled()"
      [value]="value()"
      [attr.id]="inputId() || null"
      [attr.autocomplete]="autocomplete() || null"
      [attr.inputmode]="inputmode() || null"
      [attr.maxlength]="maxLength() || null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      [attr.aria-invalid]="error() || hasError() ? 'true' : null"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  readonly type = input<string>('text');
  readonly placeholder = input<string>('');
  /** Legacy boolean error flag — kept for spec compatibility and standalone use. */
  readonly error = input<boolean>(false);
  /** Preferred when inside a `landing-form-field` that owns the error message. */
  readonly hasError = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  /** Optional id so a parent `<label for=…>` can target the input. */
  readonly inputId = input<string>('');
  readonly autocomplete = input<string>('');
  readonly inputmode = input<string>('');
  readonly maxLength = input<number | null>(null);
  readonly ariaDescribedBy = input<string>('');

  protected readonly value = signal<string>('');
  protected onChange: (value: string) => void = () => {
    /* empty */
  };
  protected onTouched: () => void = () => {
    /* empty */
  };

  protected readonly inputClasses = computed(() => {
    const classes = ['input'];
    if (this.error() || this.hasError()) {
      classes.push('input--error');
    }
    return classes.join(' ');
  });

  protected onInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value;
    this.value.set(newValue);
    this.onChange(newValue);
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // `disabled` is a signal input — this CVA hook is a no-op so the parent
    // form-control disabled state doesn't fight the template binding.
  }
}
