import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * The density switch. Wraps a level-2 child so a heavy record opens at roughly
 * one screen instead of three.
 *
 * ```html
 * <console-record-fold [title]="h.title" [gist]="h.outcome" [(open)]="expanded">
 *   <div class="rv-cao"> … </div>
 * </console-record-fold>
 * ```
 *
 * **This is not a tab, and the difference is the `gist`.** A tab hides the
 * other panels; a fold keeps a one-line summary of what is inside on screen at
 * all times, so the reader can decide without opening. `gist` is therefore
 * required in spirit — a fold with an empty gist has become a tab, and the
 * complaint that started this pattern was that tabs fragment the record.
 *
 * Body content is only instantiated while open, so a collection of heavy RTE
 * blocks costs nothing until asked for.
 */
@Component({
  selector: 'console-record-fold',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rv-fold" [class.rv-fold--open]="open()">
      <button type="button" class="rv-fold__head" [attr.aria-expanded]="open()" (click)="open.set(!open())">
        <mat-icon class="rv-fold__chevron">chevron_right</mat-icon>
        @if (index() !== null) {
          <span class="rv-item__index">{{ index() }}</span>
        }
        <span class="rv-fold__title">{{ title() }}</span>
        @if (!open()) {
          <span class="rv-fold__gist">{{ gist() }}</span>
        }
      </button>
      @if (open()) {
        <div class="rv-fold__body"><ng-content /></div>
      }
    </div>
  `,
})
export class RecordFold {
  readonly title = input.required<string>();
  /** One-line summary shown while collapsed. Without it this is just a tab. */
  readonly gist = input('');
  readonly index = input<number | null>(null);
  readonly open = model(false);
}
