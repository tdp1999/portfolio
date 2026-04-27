import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { formatAbsolute, formatRelative, formatRelativeFull, isFresh } from './relative-time.util';

/**
 * Renders a date/time as compact relative text ("3 hours ago"), with a tooltip
 * showing the absolute date and full relative breakdown.
 *
 * Auto-refreshes every 60s while the value is fresh (< 1 hour old).
 */
@Component({
  selector: 'console-relative-time',
  standalone: true,
  imports: [MatTooltipModule],
  template: `
    <span [matTooltip]="tooltip()" matTooltipPosition="above" class="whitespace-nowrap text-text-muted">
      {{ relative() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelativeTimeComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tick = signal(0);

  readonly value = input.required<Date | string | number | null | undefined>();

  protected readonly relative = computed(() => {
    this.tick();
    const v = this.value();
    return v ? formatRelative(v) : '—';
  });

  protected readonly tooltip = computed(() => {
    this.tick();
    const v = this.value();
    if (!v) return '';
    return `${formatAbsolute(v)}\n${formatRelativeFull(v)}`;
  });

  constructor() {
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId)) return;
      const v = this.value();
      if (!v || !isFresh(v)) return;
      const id = setInterval(() => this.tick.update((n) => n + 1), 60_000);
      onCleanup(() => clearInterval(id));
    });
  }
}
