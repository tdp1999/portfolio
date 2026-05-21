import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { LandingSectionHeaderComponent } from '../section-header';
import type { EyebrowInput } from '../eyebrow';

/**
 * Canonical child-page hero — eyebrow + display heading + lede in a single
 * composition. Pages like `/contact`, `/uses`, `/colophon` should all reach
 * for this instead of re-rolling their own `__hero-inner` block.
 *
 * ```html
 * <landing-page-hero [eyebrowLabel]="['00', 'Contact']" align="left">
 *   Let's <em>talk</em>.
 *   <p hero-lede>Full-time, freelance, collab, podcast — or just saying hi.</p>
 * </landing-page-hero>
 * ```
 *
 * **Slots**:
 * - Default — heading content (wrap accent words in `<em>` for italic-serif).
 * - `[hero-lede]` — the lede paragraph sitting below the heading. Pass a `<p>`.
 *
 * **Inputs** mirror `landing-section-header`: `eyebrowLabel`, `accentFirst`,
 * `align`, `size` (defaults to `md` since this is a sub-page title, not a
 * home `lg` headline).
 */
@Component({
  selector: 'landing-page-hero',
  standalone: true,
  imports: [LandingSectionHeaderComponent],
  template: `
    <header class="lph" [class.lph--left]="align() === 'left'">
      <landing-section-header
        [eyebrowLabel]="eyebrowLabel()"
        [accentFirst]="accentFirst()"
        [align]="align()"
        [size]="size()"
        [level]="1"
      >
        <ng-content />
      </landing-section-header>
      <div class="lph__lede">
        <ng-content select="[hero-lede]" />
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lph {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }
      .lph--left {
        align-items: flex-start;
      }
      .lph__lede {
        max-width: 56ch;
      }
      .lph--left .lph__lede {
        text-align: left;
      }
      .lph:not(.lph--left) .lph__lede {
        text-align: center;
      }
      /* The lede slot accepts any block, but by convention pages pass a <p>. The
         styling lands here so each page doesn't redeclare it. Italic editorial
         serif matches the established lede voice on /contact. */
      .lph__lede > p {
        margin: 0;
        font-family: var(--landing-font-display);
        font-style: italic;
        font-weight: 400;
        font-size: var(--landing-body-xl);
        line-height: var(--landing-body-xl-lh);
        color: var(--landing-text-400);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ViewEncapsulation.None: the projected `<p hero-lede>` lives outside Angular's
  // scoped styles. BEM-prefixed (.lph*) classes prevent collisions.
  encapsulation: ViewEncapsulation.None,
})
export class LandingPageHeroComponent {
  readonly eyebrowLabel = input<EyebrowInput | null>(null);
  readonly accentFirst = input(true);
  readonly align = input<'left' | 'center'>('left');
  readonly size = input<'lg' | 'md' | 'sm'>('md');
}
