import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'console-chip-boolean',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-boolean.component.html',
  styleUrl: './chip-boolean.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipBooleanComponent),
      multi: true,
    },
  ],
})
export class ChipBooleanComponent implements ControlValueAccessor {
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
}
