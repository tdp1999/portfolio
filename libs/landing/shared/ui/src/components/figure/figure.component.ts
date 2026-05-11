import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'landing-figure',
  standalone: true,
  template: `
    <figure
      class="landing-figure"
      [class.landing-figure--cropped]="!!aspectRatio() || fill()"
      [class.landing-figure--fill]="fill()"
    >
      <div class="landing-figure__frame" [style.aspect-ratio]="!fill() ? aspectRatio() || null : null">
        <img
          [attr.src]="src()"
          [attr.srcset]="srcset() || null"
          [attr.alt]="alt()"
          [attr.loading]="preload() ? null : 'lazy'"
          [attr.fetchpriority]="preload() ? 'high' : null"
          [attr.decoding]="preload() ? 'sync' : 'async'"
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
  styleUrl: './figure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FigureComponent {
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

  protected readonly hasCaption = computed(() => this.caption().length > 0);

  protected formatNumber(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }
}
