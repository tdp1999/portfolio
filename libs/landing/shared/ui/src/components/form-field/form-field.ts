import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * `landing-form-field` — wrapper that owns the label / hint / error layout
 * around any landing form primitive (`landing-input`, `landing-textarea`,
 * `landing-select`, `landing-radio-group`). Single source of vertical spacing
 * for the form column on `/contact`, `/newsletter`, etc.
 *
 * ```html
 * <landing-form-field
 *   label="Email"
 *   hint="We won't share it."
 *   [error]="form.controls.email.invalid && form.controls.email.touched ? 'Invalid email' : null"
 *   inputId="contact-email"
 * >
 *   <landing-input
 *     inputId="contact-email"
 *     formControlName="email"
 *     type="email"
 *     [hasError]="!!form.controls.email.errors"
 *     ariaDescribedBy="contact-email-meta"
 *   />
 * </landing-form-field>
 * ```
 *
 * **Hint / error semantics** (locked 2026-05-21):
 * - `hint` renders on the right of the meta row.
 * - `error` renders on the left.
 * - When both are set at the same time, **error wins** and hint is hidden —
 *   never split the user's attention with conflicting guidance.
 * - When neither is set, the meta row collapses (no extra space reserved).
 */
@Component({
  selector: 'landing-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ff">
      @if (label()) {
        <label class="ff__label" [attr.for]="inputId() || null">
          {{ label() }}
          @if (required()) {
            <span class="ff__required" aria-hidden="true">*</span>
          }
        </label>
      }
      <div class="ff__control"><ng-content /></div>
      @if (error() || hint()) {
        <div class="ff__meta" [attr.id]="metaId() || null">
          @if (error()) {
            <p class="ff__error" role="alert">{{ error() }}</p>
          } @else if (hint()) {
            <p class="ff__hint">{{ hint() }}</p>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './form-field.scss',
})
export class FormField {
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string | null>(null);
  readonly required = input<boolean>(false);
  /** `<label for=…>` target. Pass the same string to the inner input's `inputId`. */
  readonly inputId = input<string>('');
  /** Id used on the meta row for `aria-describedby` wiring. */
  readonly metaId = input<string>('');

  /** Convenience for template — useful if a parent wants to mirror state. */
  protected readonly hasError = computed(() => !!this.error());
}
