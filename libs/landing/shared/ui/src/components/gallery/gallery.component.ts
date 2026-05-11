import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FigureComponent } from '../figure/figure.component';
import type { GalleryImage } from './gallery.types';

type Cell = {
  readonly img: GalleryImage;
  readonly area: string;
  readonly ratio: string;
};

/**
 * `landing-gallery` — composes `landing-figure` cells into a curated layout
 * picked by image count. Layouts (1–4 images):
 *
 *   1 → single breakout (16:10)
 *   2 → equal split, 1×2 (each 4:3)
 *   3 → hero left (4:3, spans 2 rows) + 2 stacked right (16:9 each)
 *   4 → 2×2 grid (each 4:3)
 *
 * 5+ images: only the first 4 render. Use a dedicated lightbox/route for archives.
 *
 * **Hidden content contract for authors** (compose images in this order so the
 * curated layouts read well — captured here as guidance, not enforced):
 *   • Image 1 — primary "money shot" (wide landscape, the strongest single frame)
 *   • Image 2 — secondary detail (UI close-up, supporting landscape, or detail crop)
 *   • Image 3 — tertiary (a different angle: mobile, dashboard, terminal, before/after)
 *   • Image 4 — supporting / atmosphere (team photo, sketch, system diagram)
 *
 * Reasoning:
 *  - Layout-3 promotes image 1 to a 2-row hero → image 1 should reward the size.
 *  - Layouts-2/4 give equal weight → image-pair pacing matters more than primacy.
 */
@Component({
  selector: 'landing-gallery',
  standalone: true,
  imports: [FigureComponent],
  template: `
    @if (cells().length > 0) {
      <div class="landing-gallery" [class.landing-gallery--fill]="fillContainer()" [attr.data-count]="layoutCount()">
        @for (cell of cells(); track $index; let i = $index) {
          <landing-figure
            class="landing-gallery__cell"
            [style.grid-area]="cell.area"
            [src]="cell.img.url"
            [alt]="cell.img.alt ?? ''"
            [caption]="cell.img.caption ?? ''"
            [figureNumber]="numbered() ? i + 1 : null"
            [aspectRatio]="fillContainer() ? '' : cell.ratio"
            [fill]="fillContainer()"
          />
        }
      </div>
    }
  `,
  styleUrl: './gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingGalleryComponent {
  readonly images = input.required<readonly GalleryImage[]>();
  /** Show `FIG. 0X` numbering on each caption. Default: true. */
  readonly numbered = input<boolean>(true);
  /**
   * Stretch the gallery vertically to fill its parent. Cells lose their fixed
   * per-count aspect-ratio and use flex 1fr rows to consume the available
   * height. Pair with a parent that locks the height (`aspect-ratio` or `height`)
   * so swapping content with different image counts doesn't shift layout.
   */
  readonly fillContainer = input<boolean>(false);

  protected readonly layoutCount = computed<1 | 2 | 3 | 4>(() => {
    const n = Math.min(this.images().length, 4);
    return (n < 1 ? 1 : (n as 1 | 2 | 3 | 4)) as 1 | 2 | 3 | 4;
  });

  protected readonly cells = computed<readonly Cell[]>(() => {
    const imgs = this.images().slice(0, 4);
    const count = this.layoutCount();
    return imgs.map((img, i) => ({
      img,
      area: `cell-${i + 1}`,
      ratio: ratioFor(count, i),
    }));
  });
}

/** Aspect-ratio per cell index, per layout count. See `landing-gallery` doc above. */
function ratioFor(count: 1 | 2 | 3 | 4, index: number): string {
  // 1-image uses 4:3 instead of 16:10 — narrower contexts (e.g. a 60% column)
  // benefit from taller frames so the gallery doesn't read "short" next to the
  // accompanying text column.
  if (count === 1) return '4 / 3';
  if (count === 2) return '4 / 3';
  if (count === 3) return index === 0 ? '4 / 3' : '16 / 9';
  return '4 / 3';
}
