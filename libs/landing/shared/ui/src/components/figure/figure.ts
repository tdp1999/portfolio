import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { buildCloudinarySrcset } from '@portfolio/landing/shared/util';

@Component({
  selector: 'landing-figure',
  standalone: true,
  template: `
    <figure
      class="landing-figure"
      [class.landing-figure--cropped]="!!aspectRatio() || fill()"
      [class.landing-figure--fill]="fill()"
      [class.landing-figure--inline]="inline()"
    >
      <div class="landing-figure__frame" [style.aspect-ratio]="!fill() ? aspectRatio() || null : null">
        <img
          [attr.src]="resolvedSrc()"
          [attr.srcset]="resolvedSrcset() || null"
          [attr.alt]="alt()"
          [attr.loading]="preload() ? null : 'lazy'"
          [attr.fetchpriority]="preload() ? 'high' : null"
          [attr.decoding]="preload() ? 'sync' : 'async'"
          draggable="false"
        />
      </div>
      @if (caption()) {
        <figcaption class="landing-figure__caption">
          @if (figureNumber(); as n) {
            <span class="landing-figure__number">FIG. {{ formatNumber(n) }}</span>
            <span class="landing-figure__sep" aria-hidden="true">·</span>
          }
          <span class="landing-figure__text">{{ caption() }}</span>
        </figcaption>
      }
    </figure>
  `,
  styleUrl: './figure.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Figure {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly caption = input<string>('');
  readonly figureNumber = input<number | null>(null);
  readonly srcset = input<string>('');
  readonly preload = input<boolean>(false);
  /**
   * Optional CSS aspect-ratio for the frame (e.g. `'4 / 3'`, `'16 / 9'`).
   * When set, the image fills the frame via `object-fit: cover` (used by gallery
   * layouts that need uniform cells). Default: unset → natural image ratio.
   */
  readonly aspectRatio = input<string>('');
  /**
   * Fill the parent container vertically (image uses `object-fit: cover`, frame
   * stretches via flex). Use when the parent locks the height/aspect — e.g.
   * Selected Work tab keeps a fixed 4:3 container so swapping projects doesn't
   * shift layout. Aspect-ratio input is ignored when `fill` is true.
   */
  readonly fill = input<boolean>(false);
  /**
   * Rendered CSS width of the image in px. When set AND `srcset` is empty AND the
   * `src` is a Cloudinary URL, emit a 1×/2× `srcset` (via Cloudinary's `w_`
   * transform). Explicit `srcset` input wins; non-Cloudinary URLs fall back to
   * plain `src`. Default `0` (auto = no srcset).
   */
  readonly cloudinaryWidth = input<number>(0);
  /**
   * In-prose reading variant. The image is capped at its real pixel size (never
   * upscaled) AND at `--figure-inline-max-h` (default 72vh) so a tall portrait
   * can't force endless scrolling; the framed image is centred in the column.
   * Landscape images wide enough still fill the column. Used by `image-ref` blocks.
   */
  readonly inline = input(false, { transform: booleanAttribute });

  protected readonly hasCaption = computed(() => this.caption().length > 0);

  private readonly autoSet = computed(() => {
    const explicit = this.srcset();
    if (explicit) return null;
    const w = this.cloudinaryWidth();
    if (!w) return null;
    const s = this.src();
    if (!s) return null;
    return buildCloudinarySrcset(s, w);
  });

  protected readonly resolvedSrc = computed(() => this.autoSet()?.src || this.src());
  protected readonly resolvedSrcset = computed(() => this.srcset() || this.autoSet()?.srcset || '');

  protected formatNumber(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }
}
