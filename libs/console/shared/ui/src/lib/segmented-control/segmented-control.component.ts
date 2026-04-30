import { booleanAttribute, ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'console-segmented-control',
  standalone: true,
  imports: [MatButtonToggleModule, MatIconModule],
  templateUrl: './segmented-control.component.html',
  styleUrl: './segmented-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentedControlComponent),
      multi: true,
    },
  ],
})
export class SegmentedControlComponent implements ControlValueAccessor {
  options = input.required<ReadonlyArray<SegmentedControlOption>>();
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

  protected onSelection(event: MatButtonToggleChange): void {
    const next = event.value as string | null;
    if (next == null) return;
    if (next === this.value()) return;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
