import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * `landing-radio-group` — parent for one or more `landing-radio`s. Owns the
 * selected value and the form-control binding so individual radios just
 * declare their `value` and label.
 *
 * ```html
 * <landing-form-field label="Audience">
 *   <landing-radio-group formControlName="audience" name="audience">
 *     <landing-radio value="recruiter" label="Recruiter" />
 *     <landing-radio value="client" label="Client" />
 *     <landing-radio value="press" label="Press" />
 *   </landing-radio-group>
 * </landing-form-field>
 * ```
 *
 * Pass a unique `name` so multiple groups on the same page don't fight for
 * native-radio selection state (the underlying `<input type="radio">` uses
 * `name=` to dedupe).
 */
@Component({
  selector: 'landing-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroup),
      multi: true,
    },
  ],
  template: `
    <div
      class="rgrp"
      role="radiogroup"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
    >
      <ng-content />
    </div>
  `,
  styleUrl: './radio-group.scss',
})
export class RadioGroup implements ControlValueAccessor {
  readonly name = input<string>('radio-group');
  readonly ariaLabel = input<string>('');
  /** Id of an element describing the group — typically the form-field's
   *  `metaId` so screen readers announce hint / error alongside the label.
   *  Mirrors the same input on `landing-input`, `landing-textarea`, and
   *  `landing-checkbox` so all primitives wire a11y the same way. */
  readonly ariaDescribedBy = input<string>('');
  readonly disabled = input<boolean>(false);

  /** Active value — child `landing-radio`s read this to render their checked
   *  state. Exposed as a `model()` so callsites can two-way-bind via
   *  `[(value)]` outside of reactive-form usage. */
  readonly value = model<string | null>(null);

  /** Disabled state derived from the input + CVA. Children inject the group
   *  and consume this so each radio doesn't need its own disabled wiring. */
  protected readonly cvaDisabled = signal<boolean>(false);
  readonly isDisabled = computed(() => this.disabled() || this.cvaDisabled());

  private onChange: (value: string | null) => void = () => {
    /* empty */
  };
  private onTouched: () => void = () => {
    /* empty */
  };

  /** Called by child radios when the user picks one. */
  select(next: string): void {
    if (this.isDisabled()) return;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  writeValue(v: string | null): void {
    this.value.set(v ?? null);
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }
}
