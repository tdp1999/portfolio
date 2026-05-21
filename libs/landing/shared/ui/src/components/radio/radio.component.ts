import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RadioGroupComponent } from './radio-group.component';

/**
 * `landing-radio` — single radio option. MUST sit inside a
 * `landing-radio-group`; the group owns the selected value + form-control
 * binding via `ControlValueAccessor`.
 */
@Component({
  selector: 'landing-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="rad" [class.rad--disabled]="group.isDisabled()">
      <input
        type="radio"
        class="rad__native"
        [name]="group.name()"
        [value]="value()"
        [checked]="checked()"
        [disabled]="group.isDisabled()"
        [attr.id]="inputId() || null"
        (change)="onChange()"
      />
      <span class="rad__dot" aria-hidden="true">
        <span class="rad__dot-fill"></span>
      </span>
      <span class="rad__label">
        @if (label()) {
          {{ label() }}
        } @else {
          <ng-content />
        }
      </span>
    </label>
  `,
  styleUrl: './radio.component.scss',
})
export class RadioComponent {
  readonly value = input.required<string>();
  readonly label = input<string>('');
  readonly inputId = input<string>('');

  protected readonly group = inject(RadioGroupComponent);
  protected readonly checked = computed(() => this.group.value() === this.value());

  protected onChange(): void {
    this.group.select(this.value());
  }
}
