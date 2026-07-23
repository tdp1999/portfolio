import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The scalar half of a record: status, slug, dates, order, counts, tags, links.
 *
 * These are the fields that make a record scannable, which is exactly why they
 * must not sit in the serial scroll between prose blocks — on the page this
 * replaces, `displayOrder` was three screens below the fold. `rail` (default)
 * stacks them in the sticky aside; `grid` reflows them into columns for a
 * single-column page.
 *
 * ```html
 * <console-property-list>
 *   <console-property label="Slug" mono>{{ record.slug }}</console-property>
 * </console-property-list>
 * ```
 */
@Component({
  selector: 'console-property-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <div class="rv-props" [class.rv-props--grid]="layout() === 'grid'"><ng-content /></div> `,
})
export class PropertyList {
  readonly layout = input<'rail' | 'grid'>('rail');
}
