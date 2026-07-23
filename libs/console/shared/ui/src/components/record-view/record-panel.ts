import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * A titled panel in the record rail. One panel per concern, stacked in the
 * `aside` slot of `console-record-layout`: Properties, Content language, and
 * later Activity or Related.
 *
 * ```html
 * <console-record-panel title="Content language">
 *   <console-segmented-control … />
 *   <p class="rv-panel__note">3 of 4 fields written in English.</p>
 * </console-record-panel>
 *
 * <console-record-panel title="Properties" flush>
 *   <console-property-list> … </console-property-list>
 * </console-record-panel>
 * ```
 *
 * Order matters: panels that change what the content column *says* (content
 * language) sit above panels that describe the record itself (properties).
 *
 * `flush` drops the body padding for content that supplies its own — a
 * property list needs its rows to meet the panel edge.
 */
@Component({
  selector: 'console-record-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rv-panel">
      <h2 class="rv-panel__title">{{ title() }}</h2>
      <div class="rv-panel__body" [class.rv-panel__body--flush]="flush()"><ng-content /></div>
    </div>
  `,
})
export class RecordPanel {
  readonly title = input.required<string>();
  readonly flush = input(false, { transform: booleanAttribute });
}
