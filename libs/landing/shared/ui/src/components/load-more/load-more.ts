import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';

/**
 * "Load more" CTA + progress indicator. Use at the bottom of paginated feeds when render-all is
 * too heavy but full pagination is overkill. Hides itself when `loaded >= total`.
 *
 * Click does NOT fetch — it just emits `(loadMore)`. Parent owns chunk size + next-fetch logic.
 *
 * ```html
 * <landing-load-more [loaded]="rows.length" [total]="totalCount" (loadMore)="onLoadMore()" />
 * ```
 */
@Component({
  selector: 'landing-load-more',
  standalone: true,
  template: `
    @if (hasMore()) {
      <div class="llm">
        <button type="button" class="llm__btn" [disabled]="busy()" (click)="onClick()">
          <span class="llm__label">{{ busy() ? loadingLabel() : moreLabel() }}</span>
        </button>
        <span class="llm__count" aria-live="polite">{{ countLabel() }}</span>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .llm {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding-block: 32px;
      }
      .llm__btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 24px;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: var(--landing-body-sm-lh);
        font-weight: 500;
        color: var(--landing-text-300);
        background: transparent;
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        cursor: pointer;
        transition:
          color 160ms ease,
          border-color 160ms ease,
          background-color 160ms ease;
      }
      .llm__btn:hover:not(:disabled) {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
      }
      .llm__btn:focus-visible {
        outline: 2px solid var(--landing-accent);
        outline-offset: 2px;
      }
      .llm__btn:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .llm__count {
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
export class LoadMore {
  private readonly locale = inject(LandingLocaleService).locale;

  readonly loaded = input.required<number>();
  readonly total = input.required<number>();
  readonly busy = input<boolean>(false);

  readonly loadMore = output<void>();

  protected readonly hasMore = computed(() => this.loaded() < this.total());

  protected readonly moreLabel = computed(() => resolveCopy('common.loadMore', this.locale()));
  protected readonly loadingLabel = computed(() => resolveCopy('common.loading', this.locale()));
  protected readonly countLabel = computed(() =>
    resolveCopy('common.showing', this.locale(), { loaded: this.loaded(), total: this.total() })
  );

  protected onClick(): void {
    if (!this.busy()) this.loadMore.emit();
  }
}
