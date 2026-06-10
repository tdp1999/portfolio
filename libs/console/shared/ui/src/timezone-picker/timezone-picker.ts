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
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DEFAULT_TIMEZONES, formatGmtOffset, REGION_ORDER, type TimezoneOption } from './timezone-data';

type TimezoneValue = string | string[] | null;

interface RenderedZone extends TimezoneOption {
  label: string;
  offset: string;
}

interface RenderedGroup {
  region: string;
  zones: RenderedZone[];
}

/**
 * Timezone picker — Material `mat-select` (multi by default), grouped by
 * region with inline search. Each option shows "City — GMT±N" computed at
 * render time. Value type follows the `singleMode` input:
 * - default (multi): `string[]` of IANA names
 * - `singleMode`: `string | null`
 *
 * @example
 *   <console-timezone-picker formControlName="timezones" label="Timezones" />
 *   <console-timezone-picker formControlName="zone" label="Timezone" singleMode />
 */
@Component({
  selector: 'console-timezone-picker',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  templateUrl: './timezone-picker.html',
  styleUrl: './timezone-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimezonePicker),
      multi: true,
    },
  ],
})
export class TimezonePicker implements ControlValueAccessor {
  /** Field label. */
  readonly label = input<string>('');
  /** Hint text below the field. */
  readonly hint = input<string>('');
  /** Empty placeholder. */
  readonly placeholder = input<string>('Select timezone');
  /** Single-select mode. Default is multi-select (matches `Profile.timezones`). */
  readonly singleMode = input(false, { transform: booleanAttribute });
  /** Allow clearing the entire selection. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Required flag (drives Material `*` indicator). */
  readonly required = input(false, { transform: booleanAttribute });
  /** Dense density for inline form rows. */
  readonly dense = input(false, { transform: booleanAttribute });
  /** Optional override of the curated zone list. */
  readonly zones = input<readonly TimezoneOption[]>(DEFAULT_TIMEZONES);

  protected readonly disabled = signal(false);
  /** Internal current selection — always an array; collapsed to `string | null` in single mode on emit. */
  protected readonly selection = signal<string[]>([]);
  protected readonly filterText = signal('');

  protected readonly value = computed<string | string[] | null>(() => {
    const sel = this.selection();
    return this.singleMode() ? (sel[0] ?? null) : sel;
  });

  /** Filtered + grouped options. Offsets are computed once per render via `Date.now()` */
  protected readonly groups = computed<RenderedGroup[]>(() => {
    const now = new Date();
    const filter = this.filterText().trim().toLowerCase();
    const byRegion = new Map<string, RenderedZone[]>();
    for (const z of this.zones()) {
      const offset = formatGmtOffset(z.value, now);
      const label = `${z.city} — ${offset}`;
      const haystack = `${z.value} ${z.city} ${offset}`.toLowerCase();
      if (filter && !haystack.includes(filter)) continue;
      const bucket = byRegion.get(z.region) ?? [];
      bucket.push({ ...z, label, offset });
      byRegion.set(z.region, bucket);
    }
    const sortedRegions = [...byRegion.keys()].sort((a, b) => {
      const ai = REGION_ORDER.indexOf(a);
      const bi = REGION_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
    return sortedRegions.map((region) => ({
      region,
      zones: (byRegion.get(region) ?? []).sort((a, b) => a.city.localeCompare(b.city)),
    }));
  });

  /** Display string for the trigger when items are selected. */
  protected readonly triggerLabel = computed(() => {
    const sel = this.selection();
    if (sel.length === 0) return '';
    const zoneByValue = new Map(this.zones().map((z) => [z.value, z]));
    const labels = sel.map((v) => zoneByValue.get(v)?.city ?? v);
    if (this.singleMode()) return labels[0] ?? '';
    if (sel.length === 1) return labels[0];
    return `${labels[0]} +${sel.length - 1}`;
  });

  private onChange: (value: TimezoneValue) => void = () => {
    // noop
  };
  private onTouched: () => void = () => {
    // noop
  };

  writeValue(value: TimezoneValue): void {
    if (Array.isArray(value)) {
      this.selection.set([...value]);
    } else if (typeof value === 'string' && value) {
      this.selection.set([value]);
    } else {
      this.selection.set([]);
    }
  }

  registerOnChange(fn: (value: TimezoneValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onSelectionChange(next: string | string[]): void {
    const arr = Array.isArray(next) ? next : next ? [next] : [];
    this.selection.set(arr);
    this.onChange(this.value());
    this.onTouched();
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.selection.set([]);
    this.onChange(this.value());
    this.onTouched();
  }

  protected onFilter(value: string): void {
    this.filterText.set(value);
  }

  protected clearFilter(): void {
    this.filterText.set('');
  }

  protected onPanelClosed(): void {
    this.filterText.set('');
  }
}
