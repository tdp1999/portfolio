import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'console-chip-boolean',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-boolean.html',
  styleUrl: './chip-boolean.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipBoolean),
      multi: true,
    },
  ],
})
export class ChipBoolean implements ControlValueAccessor {
  label = input.required<string>();
  icon = input<string | null>(null);

  protected readonly value = signal<boolean>(false);
  protected readonly disabled = signal(false);

  private onChange: (value: boolean) => void = () => {
    // noop
  };
  private onTouched: () => void = () => {
    // noop
  };

  writeValue(value: boolean | null | undefined): void {
    this.value.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) return;
    const next = !this.value();
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  /**
   * `mat-chip` renders a `<span>`, so the activation keys a native `<button>` would give for free
   * have to be handled. `preventDefault` sits past the disabled and key checks so Space is only
   * swallowed when it actually toggles something, and never steals page scroll otherwise.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    this.toggle();
  }
}
