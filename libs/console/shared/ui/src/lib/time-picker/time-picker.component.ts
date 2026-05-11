import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export type TimePickerFormat = '12h' | '24h';
export type TimePickerSize = 'default' | 'dense';

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function fromMinutes(total: number): string {
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function format12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${period}`;
}

/**
 * Time picker — wraps `mat-select` with generated options at a configurable
 * minute interval. Stores `HH:mm` (24h); displays in 12h or 24h independently.
 * Panel has a sticky type-ahead filter — type "23" to jump straight to 23:00.
 *
 * @example
 *   <console-time-picker formControlName="startTime" label="Start" [step]="30" format="12h" />
 */
@Component({
  selector: 'console-time-picker',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePickerComponent),
      multi: true,
    },
  ],
})
export class TimePickerComponent implements ControlValueAccessor {
  /** Field label (Material floating label). */
  readonly label = input<string>('');
  /** Hint text below the field. */
  readonly hint = input<string>('');
  /** Empty placeholder. */
  readonly placeholder = input<string>('--:--');
  /** Minute interval between generated options. */
  readonly step = input<number>(15);
  /** Display format. Stored value is always `HH:mm` (24h). */
  readonly format = input<TimePickerFormat>('24h');
  /** Minimum time, inclusive. `HH:mm`. */
  readonly min = input<string>('00:00');
  /** Maximum time, inclusive. `HH:mm`. */
  readonly max = input<string>('23:59');
  /** Show a clear (×) button when a value is set. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Required flag (drives Material `*` indicator). */
  readonly required = input(false, { transform: booleanAttribute });
  /** Density hint — applies tighter spacing for inline form rows. */
  readonly size = input<TimePickerSize>('default');

  protected readonly value = signal<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly filterText = signal('');

  /** All options at the configured step / format / bounds. */
  private readonly allOptions = computed(() => {
    const step = Math.max(1, this.step());
    const fmt = this.format();
    const minMin = toMinutes(this.min());
    const maxMin = toMinutes(this.max());
    const out: Array<{ value: string; label: string }> = [];
    for (let m = minMin; m <= maxMin; m += step) {
      const v = fromMinutes(m);
      out.push({ value: v, label: fmt === '12h' ? format12h(v) : v });
    }
    return out;
  });

  /**
   * Options after the type-ahead filter is applied. Matching strategy:
   * - Plain digits (e.g. "23") match the start of the value OR the start of either side of the ":"
   *   so "7" surfaces both 07:* and *:7* hour slots, "23" narrows to 23:*.
   * - Anything containing ":" or a space matches the formatted label substring (case-insensitive),
   *   so "23:3" → 23:30 and "11 p" → 11:* PM.
   */
  protected readonly filteredOptions = computed(() => {
    const raw = this.filterText().trim().toLowerCase();
    if (!raw) return this.allOptions();
    const digitsOnly = /^\d+$/.test(raw);
    return this.allOptions().filter((opt) => {
      const hay = opt.label.toLowerCase();
      if (digitsOnly) {
        const [hh, mm] = opt.value.split(':');
        return hh.startsWith(raw) || mm.startsWith(raw) || opt.value.startsWith(raw);
      }
      return hay.includes(raw) || opt.value.toLowerCase().includes(raw);
    });
  });

  /** Display string for the trigger when a value is set (matches the option label). */
  protected readonly triggerLabel = computed(() => {
    const v = this.value();
    if (!v) return '';
    return this.format() === '12h' ? format12h(v) : v;
  });

  private onChange: (value: string | null) => void = () => {
    // noop
  };
  private onTouched: () => void = () => {
    // noop
  };

  writeValue(value: string | null): void {
    this.value.set(value && HHMM.test(value) ? value : null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onSelect(value: string | null): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.onSelect(null);
  }

  protected onFilter(value: string): void {
    this.filterText.set(value);
  }

  protected onPanelClosed(): void {
    this.filterText.set('');
  }
}
