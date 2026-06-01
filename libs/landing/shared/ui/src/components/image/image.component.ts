import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Map a file extension to its `<source type>` MIME string. */
const MIME: Record<string, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
};

interface SourceEntry {
  type: string;
  srcset: string;
}

/**
 * Responsive `<picture>` primitive. See `.context/design/responsive-contract.md` §13.
 *
 * Two srcset modes:
 *  (a) **Manual N-width** — `src` is a base path WITHOUT extension (e.g.
 *      `/img/hero`). For each `format`, emits `…-{w}.{fmt} {w}w`. Modern formats
 *      render as `<source>`; the LAST format is the `<img>` fallback.
 *  (b) **Explicit srcset** — pass a full `srcset` string (e.g. Cloudinary URL
 *      transforms). `widths`/`formats` are then ignored and no `<source>` tags
 *      are emitted; `src` is used verbatim as the `<img>` fallback.
 *
 * Always reserves space (no CLS): pass `width`+`height` OR `aspectRatio`.
 */
@Component({
  selector: 'landing-image',
  standalone: true,
  template: `
    <picture class="landing-image" [class.landing-image--fill]="fill()">
      @for (s of sources(); track s.type) {
        <source [attr.type]="s.type" [attr.srcset]="s.srcset" [attr.sizes]="sizes() || null" />
      }
      <img
        class="landing-image__img"
        [attr.src]="fallbackSrc()"
        [attr.srcset]="fallbackSrcset() || null"
        [attr.sizes]="sizes() || null"
        [attr.alt]="alt()"
        [attr.width]="width() ?? null"
        [attr.height]="height() ?? null"
        [style.aspect-ratio]="aspectRatio() || null"
        [attr.loading]="preload() ? 'eager' : loading()"
        [attr.fetchpriority]="preload() ? 'high' : null"
        [attr.decoding]="preload() ? 'sync' : 'async'"
      />
    </picture>
  `,
  styleUrl: './image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent {
  /** Base path WITHOUT extension (mode a) or a full URL (mode b). */
  readonly src = input.required<string>();
  readonly alt = input.required<string>();

  readonly widths = input<number[]>([480, 960, 1920]);
  /** Modern → fallback order. The last entry is the `<img>` fallback format. */
  readonly formats = input<string[]>(['webp', 'jpg']);
  /** Explicit srcset (mode b). When set, `widths`/`formats` are ignored. */
  readonly srcset = input<string>('');
  readonly sizes = input<string>('');

  /** CSS aspect-ratio (e.g. `'16 / 9'`) — reserves space when width/height absent. */
  readonly aspectRatio = input<string>('');
  /** Fill the parent (object-fit: cover). */
  readonly fill = input<boolean>(false);

  readonly width = input<number | null>(null);
  readonly height = input<number | null>(null);

  readonly loading = input<'lazy' | 'eager'>('lazy');
  /** Above-the-fold shortcut: eager load + sync decode + high fetchpriority. */
  readonly preload = input<boolean>(false);

  private readonly explicit = computed(() => this.srcset().trim());

  /** Build `"<base>-<w>.<fmt> <w>w, …"` for one format. */
  private srcsetFor(fmt: string): string {
    const base = this.src();
    return this.widths()
      .map((w) => `${base}-${w}.${fmt} ${w}w`)
      .join(', ');
  }

  /** `<source>` entries — every format except the last (mode a only). */
  protected readonly sources = computed<SourceEntry[]>(() => {
    if (this.explicit()) return [];
    const fmts = this.formats();
    return fmts.slice(0, -1).map((fmt) => ({
      type: MIME[fmt] ?? `image/${fmt}`,
      srcset: this.srcsetFor(fmt),
    }));
  });

  /** `<img>` fallback src — largest width of the last format, or the raw src in mode b. */
  protected readonly fallbackSrc = computed(() => {
    if (this.explicit()) return this.src();
    const fmts = this.formats();
    const last = fmts[fmts.length - 1] ?? 'jpg';
    const widths = this.widths();
    const largest = widths.length ? Math.max(...widths) : '';
    return `${this.src()}-${largest}.${last}`;
  });

  /** `<img>` srcset — last format's widths (mode a) or the explicit string (mode b). */
  protected readonly fallbackSrcset = computed(() => {
    if (this.explicit()) return this.explicit();
    const fmts = this.formats();
    return this.srcsetFor(fmts[fmts.length - 1] ?? 'jpg');
  });
}
