import { booleanAttribute, ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

export interface ChipSelectOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'console-chip-select',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-select.component.html',
  styleUrl: './chip-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipSelectComponent),
      multi: true,
    },
  ],
})
export class ChipSelectComponent implements ControlValueAccessor {
  options = input.required<ReadonlyArray<ChipSelectOption>>();
  iconOnly = input(false, { transform: booleanAttribute });

  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {
    // noop
  };
  private onTouched: () => void = () => {
    // noop
  };

  writeValue(value: string | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  select(value: string): void {
    if (this.disabled()) return;
    if (this.value() === value) return;
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
