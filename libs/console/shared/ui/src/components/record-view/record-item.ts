import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Level 2: a member of a collection (highlight #2, responsibility #3). Carded
 * and numbered so it reads as an *item*, never as a field of the record.
 *
 * ```html
 * <console-record-item [index]="i + 1" [title]="h.title">
 *   <div class="rv-cao"> … </div>
 * </console-record-item>
 * ```
 *
 * Always inside a `console-record-section` — an item with no parent section is
 * the hierarchy bug this family exists to prevent.
 */
@Component({
  selector: 'console-record-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="rv-item">
      <header class="rv-item__head">
        @if (index() !== null) {
          <span class="rv-item__index">{{ index() }}</span>
        }
        <h3 class="rv-item__title">{{ title() }}</h3>
      </header>
      <ng-content />
    </article>
  `,
})
export class RecordItem {
  readonly title = input.required<string>();
  readonly index = input<number | null>(null);
}
