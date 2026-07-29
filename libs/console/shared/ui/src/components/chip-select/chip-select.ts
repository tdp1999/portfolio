import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipListbox, MatChipsModule, type MatChipListboxChange } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import type { ChipSelectOption } from './chip-select.types';

@Component({
  selector: 'console-chip-select',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './chip-select.html',
  styleUrl: './chip-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipSelect),
      multi: true,
    },
  ],
})
export class ChipSelect implements ControlValueAccessor {
  options = input.required<ReadonlyArray<ChipSelectOption>>();
  iconOnly = input(false, { transform: booleanAttribute });

  /**
   * The group's accessible name. Required rather than optional: Material's chip guidance puts the
   * name on the container, and every call site of this family had shipped without one, so a screen
   * reader announced a bare "listbox" with no hint of what the chips were for.
   */
  ariaLabel = input.required<string>({ alias: 'aria-label' });

  private readonly listbox = viewChild.required(MatChipListbox);

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

  /**
   * The listbox drives selection; this maps its change back onto the form control.
   *
   * `MatChipOption._handlePrimaryActionInteraction` calls `toggleSelected(true)`, so Material's
   * behaviour for a click on the already-selected chip is to **deselect** it and propagate
   * `undefined`. A single-select toggle has no "nothing selected" state — a view switch or a status
   * picker must always read as one of its options — so that is refused rather than emitted.
   *
   * Refused by assigning `listbox.value` rather than by re-writing the `[value]` binding: the signal
   * has not changed, so Angular would skip that write. `MatChipListbox`'s setter re-runs
   * `_setSelectionByValue` with `isUserInput: false`, and it propagates only user input, so this
   * cannot feed itself another `change`.
   */
  protected onListboxChange(event: MatChipListboxChange): void {
    const next = event.value as string | undefined;

    if (next == null) {
      this.listbox().value = this.value();
      return;
    }

    if (next === this.value()) return;

    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
