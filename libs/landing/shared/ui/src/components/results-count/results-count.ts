import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';

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
  private readonly locale = inject(LandingLocaleService).locale;

  readonly visible = input.required<number>();
  readonly total = input.required<number>();
  /**
   * Unit noun, **already localized** by the caller. Two forms because English
   * inflects for number and Vietnamese does not — a Vietnamese caller passes the
   * same word twice. Previously this was one input pluralized as `${unit}s`,
   * which was English morphology hardcoded into a shared component.
   */
  readonly unit = input<string>('');
  readonly unitPlural = input<string>('');

  protected readonly message = computed(() => {
    const locale = this.locale();
    const v = this.visible();
    const t = this.total();
    const one = this.unit() || resolveCopy('common.results.unit.one', locale);
    const many = this.unitPlural() || this.unit() || resolveCopy('common.results.unit.other', locale);
    const unit = v === 1 ? one : many;
    if (v === t) return `${t} ${unit}`;
    return resolveCopy('common.results.filtered', locale, { v, t, unit });
  });
}
