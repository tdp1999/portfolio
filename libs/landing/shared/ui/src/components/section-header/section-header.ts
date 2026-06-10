import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Eyebrow, type EyebrowInput } from '../eyebrow';
import type {
  LandingSectionHeaderAlign,
  LandingSectionHeaderLevel,
  LandingSectionHeaderSize,
} from './section-header.types';

export type {
  LandingSectionHeaderAlign,
  LandingSectionHeaderLevel,
  LandingSectionHeaderSize,
} from './section-header.types';

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
 * **Size scale** (each collapses one step at ≤768px):
 * - `lg` (default) — display-xl, 56/64 → 40/48. Home top-level sections (§03–§07).
 * - `md` — display-lg, 48/56 → 40/48. Sub-page page titles (/projects, /uses, etc.).
 * - `sm` — display-md, 40/48 → 32/40. Nested in-page sub-sections inside long-form pages.
 *
 * Pass `align="left"` for left-aligned variants and `level="1"` when used as a page title hero.
 */
@Component({
  selector: 'landing-section-header',
  standalone: true,
  imports: [Eyebrow, NgTemplateOutlet],
  template: `
    <ng-template #headingContent>
      <ng-content />
    </ng-template>

    <div class="lsh" [class.lsh--left]="align() === 'left'">
      @if (showEyebrow()) {
        <landing-eyebrow [label]="eyebrowLabel()!" [accentFirst]="accentFirst()" />
      }
      @if (level() === 1) {
        <h1
          [attr.id]="id() || null"
          class="lsh__heading"
          [class.lsh__heading--md]="size() === 'md'"
          [class.lsh__heading--sm]="size() === 'sm'"
        >
          <ng-container [ngTemplateOutlet]="headingContent" />
        </h1>
      } @else {
        <h2
          [attr.id]="id() || null"
          class="lsh__heading"
          [class.lsh__heading--md]="size() === 'md'"
          [class.lsh__heading--sm]="size() === 'sm'"
        >
          <ng-container [ngTemplateOutlet]="headingContent" />
        </h2>
      }
    </div>
  `,
  styles: [
    `
      @use 'base/breakpoints' as bp;
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
      .lsh__heading--md {
        font-size: var(--landing-display-lg);
        line-height: var(--landing-display-lg-lh);
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
      @include bp.respond-down('tablet') {
        .lsh__heading {
          font-size: var(--landing-display-md);
          line-height: var(--landing-display-md-lh);
        }
        .lsh__heading--md {
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
export class SectionHeader {
  readonly eyebrowLabel = input<EyebrowInput | null>(null);
  readonly accentFirst = input(true);
  readonly align = input<LandingSectionHeaderAlign>('center');
  readonly size = input<LandingSectionHeaderSize>('lg');
  /** Heading level for the rendered element. Defaults to `2` for in-page section headers;
   * pass `1` when using this primitive as the page-title hero (e.g. /uses, /colophon, /projects, /404). */
  readonly level = input<LandingSectionHeaderLevel>(2);
  readonly id = input<string>('');

  protected readonly showEyebrow = computed(() => {
    const v = this.eyebrowLabel();
    if (v == null) return false;
    if (typeof v === 'string') return v.length > 0;
    return v.length > 0;
  });
}
