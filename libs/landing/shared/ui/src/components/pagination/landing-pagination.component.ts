import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LandingIconArrowComponent } from '../icon/landing-icon-arrow.component';

/**
 * Pagination control — Prev / page-numbers / Next. Parent owns the source of truth and emits
 * `(pageChange)` on click. Use when render-all is too heavy AND load-more is not appropriate
 * (e.g. ≥100 items, SEO-canonical pages, or browse-by-page navigation pattern).
 *
 * For portfolio-scale lists prefer `<landing-load-more>` instead; this primitive is here for
 * console feeds, search results, and future high-volume archives.
 *
 * ```html
 * <landing-pagination [page]="page()" [total]="totalPages()" (pageChange)="goToPage($event)" />
 * ```
 */
@Component({
  selector: 'landing-pagination',
  standalone: true,
  imports: [LandingIconArrowComponent],
  template: `
    <nav class="lpg" aria-label="Pagination">
      <button type="button" class="lpg__btn" [disabled]="page() <= 1" (click)="goPrev()" aria-label="Previous page">
        <landing-icon-arrow direction="left" [size]="14" />
        <span>Prev</span>
      </button>

      <ul class="lpg__pages" role="list">
        @for (entry of windowed(); track entry.key) {
          @if (entry.kind === 'page') {
            <li>
              <button
                type="button"
                class="lpg__page"
                [class.lpg__page--active]="entry.value === page()"
                [attr.aria-current]="entry.value === page() ? 'page' : null"
                (click)="goTo(entry.value)"
              >
                {{ entry.value }}
              </button>
            </li>
          } @else {
            <li class="lpg__ellipsis" aria-hidden="true">…</li>
          }
        }
      </ul>

      <button type="button" class="lpg__btn" [disabled]="page() >= total()" (click)="goNext()" aria-label="Next page">
        <span>Next</span>
        <landing-icon-arrow direction="right" [size]="14" />
      </button>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lpg {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
        padding-block: 24px;
      }
      .lpg__btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-400);
        background: transparent;
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        cursor: pointer;
        transition:
          color 160ms ease,
          border-color 160ms ease;
      }
      .lpg__btn:hover:not(:disabled) {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
      }
      .lpg__btn:focus-visible {
        outline: 2px solid var(--landing-accent);
        outline-offset: 2px;
      }
      .lpg__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .lpg__pages {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .lpg__page {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        color: var(--landing-text-500);
        background: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition:
          color 160ms ease,
          border-color 160ms ease,
          background-color 160ms ease;
      }
      .lpg__page:hover {
        color: var(--landing-text-300);
        border-color: var(--landing-border);
      }
      .lpg__page--active {
        color: var(--landing-accent);
        border-color: var(--landing-accent);
        background: color-mix(in srgb, var(--landing-accent) 8%, transparent);
      }
      .lpg__ellipsis {
        padding-inline: 4px;
        font-family: var(--landing-font-mono);
        color: var(--landing-text-500);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPaginationComponent {
  readonly page = input.required<number>();
  readonly total = input.required<number>();
  /** Max page-number buttons shown at once. Default `7`; uses ellipses to skip gaps. */
  readonly window = input<number>(7);

  readonly pageChange = output<number>();

  /**
   * Compute the page-number window around the current page. Returns an array of either
   * `{kind: 'page', value: N}` or `{kind: 'ellipsis'}` entries. Keeps boundaries (1 and total)
   * always visible, fills middle around the current page.
   */
  readonly windowed = computed<readonly { key: string; kind: 'page' | 'ellipsis'; value: number }[]>(() => {
    const total = this.total();
    const current = this.page();
    const win = this.window();

    if (total <= win) {
      return Array.from({ length: total }, (_, i) => ({ key: `p${i + 1}`, kind: 'page' as const, value: i + 1 }));
    }

    const half = Math.floor((win - 2) / 2); // -2 reserves slots for first/last
    let start = Math.max(2, current - half);
    let end = Math.min(total - 1, current + half);
    if (current - half < 2) end = Math.min(total - 1, end + (2 - (current - half)));
    if (current + half > total - 1) start = Math.max(2, start - (current + half - (total - 1)));

    const out: { key: string; kind: 'page' | 'ellipsis'; value: number }[] = [];
    out.push({ key: 'p1', kind: 'page', value: 1 });
    if (start > 2) out.push({ key: 'e-l', kind: 'ellipsis', value: -1 });
    for (let i = start; i <= end; i++) out.push({ key: `p${i}`, kind: 'page', value: i });
    if (end < total - 1) out.push({ key: 'e-r', kind: 'ellipsis', value: -2 });
    out.push({ key: `p${total}`, kind: 'page', value: total });
    return out;
  });

  protected goTo(n: number): void {
    if (n < 1 || n > this.total() || n === this.page()) return;
    this.pageChange.emit(n);
  }

  protected goPrev(): void {
    this.goTo(this.page() - 1);
  }
  protected goNext(): void {
    this.goTo(this.page() + 1);
  }
}
