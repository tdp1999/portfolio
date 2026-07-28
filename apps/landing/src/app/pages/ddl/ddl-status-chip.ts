import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { STATUS_META } from './ddl-status-chip.data';
import type { DdlStatus } from './ddl.types';

@Component({
  selector: 'landing-ddl-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-mono-sm uppercase tracking-[0.06em]"
      [class]="meta().ring"
    >
      <span class="h-1.5 w-1.5 rounded-full" [class]="meta().dot"></span>
      {{ meta().label }}
    </span>
  `,
})
export class DdlStatusChip {
  readonly status = input.required<DdlStatus>();

  protected readonly meta = computed(() => STATUS_META[this.status()]);
}
