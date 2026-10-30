import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Chip } from '@portfolio/landing/shared/ui';

import type { LookupRow } from '../medicine-lookup.util';

/** Display name of one item ('DT-1 Tên hiển thị'): main name, "Vật tư" badge, then the sub-line. */
@Component({
  selector: 'landing-medicine-lookup-item-name',
  imports: [Chip],
  template: `
    <span class="item-name__main">
      <span class="item-name__primary" data-testid="item-primary">{{ row().primary }}</span>
      @if (row().isSupply) {
        <landing-chip data-testid="item-supply-badge" size="sm" [label]="supplyBadge()" />
      }
    </span>
    @if (row().secondary) {
      <span class="item-name__secondary" data-testid="item-secondary">{{ row().secondary }}</span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .item-name__main {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .item-name__primary {
      color: var(--landing-text);
      font-size: var(--landing-body-md);
      line-height: var(--landing-body-md-lh);
      font-weight: 600;
    }
    .item-name__secondary {
      color: var(--landing-text-500);
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineLookupItemName {
  readonly row = input.required<LookupRow>();
  readonly supplyBadge = input.required<string>();
}
