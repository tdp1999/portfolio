import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `landing-textarea` — multi-line text input primitive. Mirrors `landing-input`
 * (Variant B sunken card) but with a min-height + vertical resize affordance.
 *
 * ```html
 * <landing-form-field label="Message" hint="10–5000 characters" [error]="msgError()">
 *   <landing-textarea formControlName="message" rows="6" [maxLength]="5000" />
 * </landing-form-field>
 * ```
 */
@Component({
  selector: 'landing-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Textarea),
      multi: true,
    },
  ],
  template: `
    <textarea
      [placeholder]="placeholder()"
      [rows]="rows()"
      [class]="textareaClasses()"
      [disabled]="disabled()"
      [attr.id]="inputId() || null"
      [attr.maxlength]="maxLength() || null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      [attr.aria-invalid]="hasError() ? 'true' : null"
      (input)="onInput($event)"
      (blur)="onTouched()"
      >{{ value() }}</textarea
    >
  `,
  styleUrl: './textarea.scss',
})
export class Textarea implements ControlValueAccessor {
  // ── Inputs ────────────────────────────────────────────────────────
  readonly placeholder = input<string>('');
  readonly rows = input<number>(4);
  readonly hasError = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly inputId = input<string>('');
  readonly maxLength = input<number | null>(null);
  readonly ariaDescribedBy = input<string>('');

  // ── Writable state ────────────────────────────────────────────────
  protected readonly value = signal<string>('');

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly textareaClasses = computed(() => {
    const classes = ['textarea'];
    if (this.hasError()) classes.push('textarea--error');
    return classes.join(' ');
  });

  // ── CVA callbacks ─────────────────────────────────────────────────
  protected onChange: (value: string) => void = () => {
    /* empty */
  };
  protected onTouched: () => void = () => {
    /* empty */
  };

  // ── Methods ───────────────────────────────────────────────────────
  protected onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.value.set(el.value);
    this.onChange(el.value);
  }

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
    /* no-op — see InputComponent */
  }
}
