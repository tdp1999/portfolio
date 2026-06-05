import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingLinkComponent } from '@portfolio/landing/shared/ui';
import type { NowEntry } from '../now-mock';

/**
 * Currently shipping · V1 — Status strip.
 *
 * Four labeled rows (`Building` / `Writing` / `Learning` / `Last shipped`),
 * value next to label, mono "Last updated" footer + `See /now →` link. Most
 * scannable — looks like a status board, no surprises. Best when the values
 * are short ish (≤ 2 lines each).
 */
@Component({
  selector: 'landing-currently-shipping-v1',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LandingLinkComponent],
  template: `
    @if (entry(); as e) {
      <dl class="csv1">
        <div class="csv1__row">
          <dt class="csv1__label">Building</dt>
          <dd class="csv1__value">{{ e.building }}</dd>
        </div>
        <div class="csv1__row">
          <dt class="csv1__label">Writing</dt>
          <dd class="csv1__value">{{ e.writing }}</dd>
        </div>
        <div class="csv1__row">
          <dt class="csv1__label">Learning</dt>
          <dd class="csv1__value">{{ e.learning }}</dd>
        </div>
        <div class="csv1__row">
          <dt class="csv1__label">Last shipped</dt>
          <dd class="csv1__value">{{ e.lastShipped }}</dd>
        </div>
      </dl>

      <footer class="csv1__foot">
        <span class="csv1__updated">
          Last updated <time [attr.datetime]="e.lastUpdatedIso">{{ e.lastUpdatedIso }}</time>
        </span>
        <landing-link href="/now" [arrow]="true">See /now</landing-link>
      </footer>
    } @else {
      <p class="csv1__empty">Nothing to share yet. <a routerLink="/now">See /now →</a></p>
    }
  `,
  styles: `
    @use 'base/breakpoints' as bp;

    :host {
      display: block;
    }

    .csv1 {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0;
      border-block: 1px solid var(--landing-border);
    }

    .csv1__row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 16px;
      padding: 12px 0;
    }

    .csv1__row + .csv1__row {
      border-top: 1px solid var(--landing-border);
    }

    .csv1__label {
      margin: 0;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .csv1__value {
      margin: 0;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      line-height: var(--landing-body-md-lh);
      color: var(--landing-text-300);
    }

    @include bp.respond-down('tablet') {
      .csv1__row {
        grid-template-columns: 1fr;
        gap: 4px;
      }
    }

    .csv1__foot {
      margin-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .csv1__updated {
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .csv1__updated time {
      color: var(--landing-text-400);
    }

    .csv1__empty {
      margin: 0;
      color: var(--landing-text-500);
    }
  `,
})
export class CurrentlyShippingV1Component {
  readonly entry = input<NowEntry | null>(null);
}
