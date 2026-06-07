import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `landing-checkbox` — single boolean checkbox primitive. Native `<input
 * type="checkbox">` is visually hidden; a styled `<span class="cbx__box">`
 * sits in its place and inherits all native semantics (focus ring, label
 * activation, screen-reader behavior).
 *
 * Label content is projected via `<ng-content>` so callsites can render
 * mixed inline content (text + links) freely:
 *
 * ```html
 * <landing-checkbox formControlName="consent" inputId="contact-consent">
 *   I agree to the
 *   <landing-link href="/privacy" inline>Privacy Policy</landing-link>.
 * </landing-checkbox>
 * ```
 */
@Component({
  selector: 'landing-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Checkbox),
      multi: true,
    },
  ],
  template: `
    <label class="cbx" [class.cbx--disabled]="disabled()">
      <input
        type="checkbox"
        class="cbx__native"
        [attr.id]="inputId() || null"
        [checked]="checked()"
        [disabled]="disabled()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-describedby]="ariaDescribedBy() || null"
        (change)="onChangeEvent($event)"
        (blur)="onTouched()"
      />
      <span class="cbx__box" [class.cbx__box--error]="hasError()" aria-hidden="true">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="cbx__check"
        >
          <polyline points="3 8 7 12 13 4" />
        </svg>
      </span>
      <span class="cbx__label">
        <ng-content />
      </span>
    </label>
  `,
  styleUrl: './checkbox.scss',
})
export class Checkbox implements ControlValueAccessor {
  readonly disabled = input<boolean>(false);
  readonly hasError = input<boolean>(false);
  readonly inputId = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  protected readonly checked = signal<boolean>(false);
  protected onChange: (value: boolean) => void = () => {
    /* empty */
  };
  protected onTouched: () => void = () => {
    /* empty */
  };

  protected onChangeEvent(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.checked.set(el.checked);
    this.onChange(el.checked);
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    /* no-op */
  }
}
