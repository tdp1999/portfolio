import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingLinkComponent } from '@portfolio/landing/shared/ui';
import type { NowEntry } from '../now-mock';

/**
 * Currently shipping · V2 — Card with prose.
 *
 * Single bordered card; the four fields flow as labeled prose paragraphs
 * ("Right now I'm building X. I'm writing Y. I'm learning Z. Last shipped:
 * W."). Narrative voice over status-board scan. Reads warmer, slightly more
 * authored. Trade-off: less scannable when the prose is long.
 */
@Component({
  selector: 'landing-currently-shipping-v2',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LandingLinkComponent],
  template: `
    @if (entry(); as e) {
      <article class="csv2">
        <p class="csv2__para">
          <span class="csv2__lead">Right now I'm building</span>
          {{ e.building }}
        </p>
        <p class="csv2__para">
          <span class="csv2__lead">Writing</span>
          {{ e.writing }}
        </p>
        <p class="csv2__para">
          <span class="csv2__lead">Learning</span>
          {{ e.learning }}
        </p>
        <p class="csv2__para csv2__para--shipped">
          <span class="csv2__lead">Last shipped</span>
          {{ e.lastShipped }}
        </p>

        <footer class="csv2__foot">
          <span class="csv2__updated">
            Last updated <time [attr.datetime]="e.lastUpdatedIso">{{ e.lastUpdatedIso }}</time>
          </span>
          <landing-link href="/now" [arrow]="true">See /now</landing-link>
        </footer>
      </article>
    } @else {
      <p class="csv2__empty">Nothing to share yet. <a routerLink="/now">See /now →</a></p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .csv2 {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 24px;
      border: 1px solid var(--landing-border);
      border-radius: 12px;
      background: var(--landing-bg);
    }

    .csv2__para {
      margin: 0;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-md);
      line-height: var(--landing-body-md-lh);
      color: var(--landing-text-300);
    }

    .csv2__lead {
      display: inline;
      margin-right: 6px;
      font-family: var(--landing-font-display);
      font-style: italic;
      font-weight: 400;
      color: var(--landing-accent);
    }

    .csv2__para--shipped {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--landing-border);
      color: var(--landing-text-400);
    }

    .csv2__foot {
      margin-top: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .csv2__updated {
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .csv2__updated time {
      color: var(--landing-text-400);
    }

    .csv2__empty {
      margin: 0;
      color: var(--landing-text-500);
    }
  `,
})
export class CurrentlyShippingV2Component {
  readonly entry = input<NowEntry | null>(null);
}
