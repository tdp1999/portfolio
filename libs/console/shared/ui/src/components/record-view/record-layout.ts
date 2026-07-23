import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Chassis for every read-only record page (ADR-026).
 *
 * ```html
 * <console-record-layout>
 *   <p class="rv-lead">{{ record.oneLiner }}</p>
 *   <console-record-section title="Story"> … </console-record-section>
 *
 *   <ng-container aside>
 *     <console-record-panel title="Properties" flush> … </console-record-panel>
 *   </ng-container>
 * </console-record-layout>
 * ```
 *
 * **Degradation is automatic.** The two-column grid only engages when BOTH
 * slots carry content (CSS `:has`). A record with no content blocks — tag,
 * category, skill — projects nothing into the default slot and renders as a
 * single properties panel, with no special case at the call site.
 *
 * Slots: default = content column · `[aside]` = sticky rail.
 */
@Component({
  selector: 'console-record-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rv-layout">
      <div class="rv-layout__main"><ng-content /></div>
      <aside class="rv-layout__aside"><ng-content select="[aside]" /></aside>
    </div>
  `,
})
export class RecordLayout {}
