import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { DdlStatus } from './ddl.types';

// Standardized lifecycle marker — the headline of the docs convention. One chip,
// one meaning, everywhere: sidebar badge, page header, decision records.
const STATUS_META: Record<DdlStatus, { label: string; ring: string; dot: string }> = {
  shipped: { label: 'Shipped', ring: 'border-landing-border text-landing-text-400', dot: 'bg-landing-text-400' },
  decided: { label: 'Decided', ring: 'border-landing-accent text-landing-accent', dot: 'bg-landing-accent' },
  exploring: { label: 'Exploring', ring: 'border-landing-border text-landing-text-500', dot: 'bg-landing-text-500' },
  deprecated: {
    label: 'Deprecated',
    ring: 'border-dashed border-landing-border text-landing-text-400',
    dot: 'bg-landing-text-400',
  },
};

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
