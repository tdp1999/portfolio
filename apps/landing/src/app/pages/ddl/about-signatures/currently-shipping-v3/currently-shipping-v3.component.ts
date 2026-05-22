import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingLinkComponent } from '@portfolio/landing/shared/ui';
import type { NowEntry } from '../now-mock';

/**
 * Currently shipping · V3 — Terminal-styled.
 *
 * Monospace pseudo-terminal block. Field name as `$ now --field=building`
 * prompt, value indented below as `→ <text>`. Craft signal — reads as a tool
 * output, not a status card. Polarizing: HR-persona may bounce off the
 * affectation. No real interactivity (no cursor blink, no typing animation).
 */
@Component({
  selector: 'landing-currently-shipping-v3',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LandingLinkComponent],
  template: `
    @if (entry(); as e) {
      <div class="csv3" role="presentation">
        <pre class="csv3__shell"><span class="csv3__prompt">$</span> now</pre>

        <div class="csv3__row">
          <p class="csv3__cmd"><span class="csv3__prompt">·</span> building</p>
          <p class="csv3__out"><span class="csv3__arrow" aria-hidden="true">→</span>{{ e.building }}</p>
        </div>

        <div class="csv3__row">
          <p class="csv3__cmd"><span class="csv3__prompt">·</span> writing</p>
          <p class="csv3__out"><span class="csv3__arrow" aria-hidden="true">→</span>{{ e.writing }}</p>
        </div>

        <div class="csv3__row">
          <p class="csv3__cmd"><span class="csv3__prompt">·</span> learning</p>
          <p class="csv3__out"><span class="csv3__arrow" aria-hidden="true">→</span>{{ e.learning }}</p>
        </div>

        <div class="csv3__row">
          <p class="csv3__cmd"><span class="csv3__prompt">·</span> last_shipped</p>
          <p class="csv3__out"><span class="csv3__arrow" aria-hidden="true">→</span>{{ e.lastShipped }}</p>
        </div>

        <footer class="csv3__foot">
          <span class="csv3__updated">
            # last updated <time [attr.datetime]="e.lastUpdatedIso">{{ e.lastUpdatedIso }}</time>
          </span>
          <landing-link href="/now" [arrow]="true">See /now</landing-link>
        </footer>
      </div>
    } @else {
      <p class="csv3__empty">Nothing to share yet. <a routerLink="/now">See /now →</a></p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .csv3 {
      padding: 20px 20px 16px;
      border: 1px solid var(--landing-border);
      border-radius: 12px;
      background: var(--landing-bg);
      font-family: var(--landing-font-mono);
    }

    .csv3__shell {
      margin: 0 0 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--landing-border);
      font-size: var(--landing-mono-md);
      color: var(--landing-text-300);
    }

    .csv3__row {
      padding: 8px 0;
    }

    .csv3__row + .csv3__row {
      border-top: 1px dashed var(--landing-border);
    }

    .csv3__cmd {
      margin: 0 0 4px;
      font-size: var(--landing-mono-md);
      letter-spacing: var(--landing-tracking-mono);
      color: var(--landing-accent);
    }

    .csv3__out {
      margin: 0;
      padding-left: 20px;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
      color: var(--landing-text-400);
    }

    .csv3__arrow {
      display: inline-block;
      width: 12px;
      margin-left: -16px;
      color: var(--landing-text-600);
    }

    .csv3__prompt {
      display: inline-block;
      width: 14px;
      color: var(--landing-text-600);
    }

    .csv3__foot {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--landing-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .csv3__updated {
      font-size: var(--landing-mono-sm);
      letter-spacing: var(--landing-tracking-mono);
      color: var(--landing-text-500);
    }

    .csv3__updated time {
      color: var(--landing-text-400);
    }

    .csv3__empty {
      margin: 0;
      color: var(--landing-text-500);
    }
  `,
})
export class CurrentlyShippingV3Component {
  readonly entry = input<NowEntry | null>(null);
}
