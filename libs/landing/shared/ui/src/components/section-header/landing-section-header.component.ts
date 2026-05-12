import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { EyebrowComponent, type EyebrowInput } from '../eyebrow';

export type LandingSectionHeaderAlign = 'center' | 'left';
export type LandingSectionHeaderSize = 'md' | 'sm';

/**
 * Canonical section header: eyebrow + display heading with optional italic accent word.
 *
 * Heading content is projected — wrap the accent word in `<em>` for the italic-serif accent:
 *
 * ```html
 * <landing-section-header [eyebrowLabel]="['04', 'The Stack']">
 *   The <em>toolkit</em>.
 * </landing-section-header>
 * ```
 *
 * Defaults to centered alignment + md size (56/64 desktop, 40/48 mobile). Pass `align="left"`
 * for left-aligned variants and `size="sm"` for compact sections.
 */
@Component({
  selector: 'landing-section-header',
  standalone: true,
  imports: [EyebrowComponent],
  template: `
    <div class="lsh" [class.lsh--left]="align() === 'left'">
      @if (showEyebrow()) {
        <landing-eyebrow [label]="eyebrowLabel()!" [accentFirst]="accentFirst()" />
      }
      <h2 [attr.id]="id() || null" class="lsh__heading" [class.lsh__heading--sm]="size() === 'sm'">
        <ng-content />
      </h2>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lsh {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
      }
      .lsh--left {
        align-items: flex-start;
        text-align: left;
      }
      .lsh__heading {
        margin: 0;
        font-family: var(--landing-font-body);
        font-weight: 600;
        font-size: var(--landing-display-xl);
        line-height: var(--landing-display-xl-lh);
        letter-spacing: var(--landing-tracking-tight);
        color: var(--landing-text-300);
      }
      .lsh__heading[id] {
        scroll-margin-top: 80px;
      }
      .lsh__heading--sm {
        font-size: var(--landing-display-md);
        line-height: var(--landing-display-md-lh);
      }
      /* Newsreader has a smaller x-height than Inter, so an italic em at the same
         nominal font-size reads visibly smaller. Bump by 1.12× to bring optical
         size back in line with the surrounding Inter run. */
      .lsh__heading :is(em, i) {
        font-family: var(--landing-font-display);
        font-style: italic;
        font-weight: 400;
        font-size: 1.12em;
        color: var(--landing-accent);
      }
      @media (max-width: 768px) {
        .lsh__heading {
          font-size: var(--landing-display-md);
          line-height: var(--landing-display-md-lh);
        }
        .lsh__heading--sm {
          font-size: var(--landing-display-sm);
          line-height: var(--landing-display-sm-lh);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ViewEncapsulation.None — projected <em> needs the accent rule and Angular's default
  // Emulated scoping won't apply host styles to ng-content. BEM-namespaced classes (.lsh*)
  // keep this safe from global collisions.
  encapsulation: ViewEncapsulation.None,
})
export class LandingSectionHeaderComponent {
  readonly eyebrowLabel = input<EyebrowInput | null>(null);
  readonly accentFirst = input(true);
  readonly align = input<LandingSectionHeaderAlign>('center');
  readonly size = input<LandingSectionHeaderSize>('md');
  readonly id = input<string>('');

  protected readonly showEyebrow = computed(() => {
    const v = this.eyebrowLabel();
    if (v == null) return false;
    if (typeof v === 'string') return v.length > 0;
    return v.length > 0;
  });
}
