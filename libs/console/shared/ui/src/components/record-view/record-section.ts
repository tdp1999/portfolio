import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Level 1 of the record hierarchy: a group the record owns (Story, Technical
 * highlights, Media). Its children — `console-record-field` for a field,
 * `console-record-item` for a member of a collection — are level 2 and are
 * indented behind a rule so the parent/child relation is unambiguous.
 *
 * ```html
 * <console-record-section title="Technical highlights" [count]="3" [gaps]="1">
 *   <button action class="rv-linkbtn" (click)="expandAll()">Expand all</button>
 *   <console-record-item …/>
 * </console-record-section>
 * ```
 *
 * `gaps` is the partial-data signal: the number of children that are present
 * but incomplete. It renders in this section's own header so a half-written
 * record is legible from the top of the page rather than discovered by
 * scrolling. Leave it `0` when nothing is missing.
 *
 * A section with NO content at all should not be rendered — pass its name to
 * `console-record-empty-sections` instead.
 */
@Component({
  selector: 'console-record-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rv-section">
      <div class="rv-section__head">
        <h2 class="rv-section__title">{{ title() }}</h2>
        @if (count() !== null) {
          <span class="rv-count">{{ count() }}</span>
        }
        @if (gaps()) {
          <span class="rv-gap">{{ gaps() }} {{ gapLabel() }}</span>
        }
        <span class="rv-section__action"><ng-content select="[action]" /></span>
      </div>
      <div class="rv-section__body"><ng-content /></div>
    </section>
  `,
})
export class RecordSection {
  readonly title = input.required<string>();
  readonly count = input<number | null>(null);
  /** Children that exist but are incomplete. `0` renders nothing. */
  readonly gaps = input(0);
  /** Wording after the gap count — "1 to write", "2 incomplete". */
  readonly gapLabel = input('incomplete');
}
