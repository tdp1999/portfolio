import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FigureComponent } from '../figure/figure.component';
import { LightboxDirective } from '../lightbox';
import type { GalleryImage } from './gallery.types';

/** Per-instance fallback group id (SSR-safe: deterministic instantiation order). */
let gallerySeq = 0;

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
  imports: [FigureComponent, LightboxDirective],
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
            [cloudinaryWidth]="cellWidth()"
            [lightbox]="lightbox()"
            [lightboxGroup]="effectiveGroup()"
            [lightboxFullSrc]="cell.img.fullSrc ?? ''"
            [lightboxSrcset]="cell.img.srcset ?? ''"
          />
        }
      </div>
      <!-- The grid caps at 4 cells; register any extra images as hidden lightbox
           entries so the (desktop) lightbox can navigate the FULL set, matching the
           mobile carousel. Hidden from layout + a11y; they only feed the group. -->
      @if (lightbox()) {
        @for (extra of extraImages(); track extra.url; let j = $index) {
          <landing-figure
            hidden
            [src]="extra.url"
            [alt]="extra.alt ?? ''"
            [caption]="extra.caption ?? ''"
            [figureNumber]="numbered() ? 4 + j + 1 : null"
            lightbox
            [lightboxGroup]="effectiveGroup()"
            [lightboxFullSrc]="extra.fullSrc ?? ''"
            [lightboxSrcset]="extra.srcset ?? ''"
          />
        }
      }
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
  /** Make each cell open the shared lightbox on click. Default: off (opt-in). */
  readonly lightbox = input<boolean>(false);
  /** Lightbox group key. Defaults to a per-instance id so galleries don't merge. */
  readonly lightboxGroup = input<string>('');

  private readonly autoGroup = `lb-gallery-${gallerySeq++}`;
  protected readonly effectiveGroup = computed(() => this.lightboxGroup() || this.autoGroup);
  /** Images beyond the 4-cell grid cap — fed to the lightbox group only. */
  protected readonly extraImages = computed<readonly GalleryImage[]>(() => this.images().slice(4));

  protected readonly layoutCount = computed<1 | 2 | 3 | 4>(() => {
    const n = Math.min(this.images().length, 4);
    if (n < 1) return 1;
    return n as 1 | 2 | 3 | 4;
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

  /** Approximate rendered cell width. The gallery sits in a wide container (max
   * ~960px); for layout-1 a cell fills the row, for layout-2/3/4 a cell takes
   * roughly half. 720 is a safe upper bound that still gives a useful 2× variant
   * without serving full-resolution screenshots to every visitor. */
  protected readonly cellWidth = computed<number>(() => (this.layoutCount() === 1 ? 960 : 720));
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
