import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';

export interface ChipOption {
  value: string;
  label: string;
}

@Component({
  selector: 'console-chip-toggle-group',
  standalone: true,
  imports: [MatChipsModule],
  templateUrl: './chip-toggle-group.component.html',
  styleUrl: './chip-toggle-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipToggleGroupComponent),
      multi: true,
    },
  ],
})
export class ChipToggleGroupComponent implements ControlValueAccessor {
  options = input.required<ReadonlyArray<ChipOption>>();

  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly disabled = signal(false);

  private onChange: (value: string[]) => void = () => {
    // noop
  };
  private onTouched: () => void = () => {
    // noop
  };

  writeValue(value: string[]): void {
    this.selected.set(new Set(value ?? []));
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  toggle(value: string): void {
    if (this.disabled()) return;
    const next = new Set(this.selected());
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    this.selected.set(next);
    const ordered = this.options()
      .filter((o) => next.has(o.value))
      .map((o) => o.value);
    this.onChange(ordered);
    this.onTouched();
  }
}
