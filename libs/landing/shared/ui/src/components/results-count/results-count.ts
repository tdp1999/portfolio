import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * A11y-friendly status text for a filtered feed: "Showing 4 of 12 projects".
 * Use above or beside the result list. Live-region announces filter changes to AT users.
 *
 * ```html
 * <landing-results-count [visible]="filtered.length" [total]="all.length" unit="projects" />
 * ```
 */
@Component({
  selector: 'landing-results-count',
  standalone: true,
  template: `
    <span class="lrc" role="status" aria-live="polite">
      <span class="lrc__text">{{ message() }}</span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .lrc {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: 16px;
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsCount {
  readonly visible = input.required<number>();
  readonly total = input.required<number>();
  /** Singular unit name — pluralized as `${unit}s` automatically when count ≠ 1. */
  readonly unit = input<string>('item');

  protected readonly message = computed(() => {
    const v = this.visible();
    const t = this.total();
    const unit = v === 1 ? this.unit() : `${this.unit()}s`;
    if (v === t) return `${t} ${unit}`;
    return `Showing ${v} of ${t} ${unit}`;
  });
}
