import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipsModule, type MatChipListboxChange } from '@angular/material/chips';
import type { ChipOption } from './chip-toggle-group.types';

@Component({
  selector: 'console-chip-toggle-group',
  standalone: true,
  imports: [MatChipsModule],
  templateUrl: './chip-toggle-group.html',
  styleUrl: './chip-toggle-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipToggleGroup),
      multi: true,
    },
  ],
})
export class ChipToggleGroup implements ControlValueAccessor {
  options = input.required<ReadonlyArray<ChipOption>>();

  /**
   * The group's accessible name. Required rather than optional: Material's chip guidance puts the
   * name on the container, and every call site of this family had shipped without one, so a screen
   * reader announced a bare "listbox" with no hint of what the chips were for.
   */
  ariaLabel = input.required<string>({ alias: 'aria-label' });

  protected readonly selected = signal<readonly string[]>([]);
  protected readonly disabled = signal(false);

  private onChange: (value: string[]) => void = () => {
    // noop
  };
  private onTouched: () => void = () => {
    // noop
  };

  writeValue(value: string[] | null | undefined): void {
    // No reordering here: `options` may not be bound yet on the first write, and order does not
    // affect which chips the listbox selects. Order is normalised on the way out instead.
    this.selected.set(value ?? []);
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

  /**
   * The listbox drives selection; this maps its change back onto the form control.
   *
   * Unlike `chip-select` there is no null-guard to write: an empty selection is a legitimate value
   * for a multi-select, so `[]` is emitted rather than refused.
   *
   * Re-deriving the array from `options()` rather than trusting the event's order is what keeps the
   * emitted value stable. `MatChipListbox` happens to report its selected chips in DOM order today,
   * but the contract this component publishes is option order, and a value that reshuffles as the
   * user toggles makes the parent form's dirty-checking meaningless.
   */
  protected onListboxChange(event: MatChipListboxChange): void {
    const chosen = new Set((event.value as string[] | undefined) ?? []);
    const next = this.options()
      .filter((o) => chosen.has(o.value))
      .map((o) => o.value);

    this.selected.set(next);
    // A copy, so a parent that mutates the array it was handed cannot silently rewrite our state.
    this.onChange([...next]);
    this.onTouched();
  }
}
