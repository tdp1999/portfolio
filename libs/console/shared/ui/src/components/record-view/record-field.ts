import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RecordFieldState } from '@portfolio/console/shared/util';

/**
 * Level 2: a field of the record. Long-form only — a short scalar belongs in
 * `console-property` inside the rail, never here.
 *
 * ```html
 * <console-record-field label="Motivation" [state]="state" otherLocale="Vietnamese">
 *   <p class="rv-prose">{{ motivation }}</p>
 * </console-record-field>
 * ```
 *
 * **Three states, never two.** Silently falling back to the other locale hides
 * exactly the gap the author needs to see, so `other-locale` is its own state
 * and says so. An `unset` field still renders one muted line rather than being
 * filtered away: inside a section that is already on screen, that line tells
 * the author what to write next. Only a section that is empty *in full* is
 * withheld (see `console-record-empty-sections`).
 */
@Component({
  selector: 'console-record-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rv-field" [class.rv-field--unset]="state() === 'unset'">
      <span class="rv-field__label">{{ label() }}</span>
      @switch (state()) {
        @case ('filled') {
          <ng-content />
        }
        @case ('other-locale') {
          <p class="rv-absent">Not written in {{ otherLocale() }} yet.</p>
        }
        @default {
          <p class="rv-absent">{{ unsetLabel() }}</p>
        }
      }
    </div>
  `,
})
export class RecordField {
  readonly label = input.required<string>();
  readonly state = input<RecordFieldState>('filled');
  /** Language name shown in the `other-locale` message. */
  readonly otherLocale = input('the selected language');
  readonly unsetLabel = input('Not set');
}
