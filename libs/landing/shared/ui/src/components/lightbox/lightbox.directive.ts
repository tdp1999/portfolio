import { Directive, ElementRef, booleanAttribute, effect, inject, input } from '@angular/core';
import { FigureComponent } from '../figure/figure.component';
import { LightboxService } from './lightbox.service';
import type { LightboxEntry, LightboxItem } from './lightbox.types';

/**
 * Opt-in lightbox trigger. Add `[lightbox]` to a `<landing-figure>` (or any
 * element with `lightboxSrc`) to make it clickable into the full-screen viewer.
 * Figures sharing a `lightboxGroup` navigate together as a carousel.
 *
 * ```html
 * <landing-figure src="…" alt="…" caption="…" lightbox lightboxGroup="case-study" />
 * <img [src]="thumb" lightbox lightboxGroup="case-study" lightboxSrc="…" lightboxAlt="…" />
 * ```
 *
 * Pulls `src/alt/caption/figureNumber` from a host `<landing-figure>` when present;
 * explicit `lightbox*` inputs override and also enable use on a bare element.
 */
@Directive({
  selector: '[lightbox]',
  standalone: true,
  host: {
    role: 'button',
    tabindex: '0',
    '[style.cursor]': "enabled() ? 'pointer' : null",
    '(click)': 'activate($event)',
    '(keydown.enter)': 'activate($event)',
    '(keydown.space)': 'activate($event)',
  },
})
export class LightboxDirective {
  /** Enable flag. Bare `lightbox` → true; `[lightbox]="false"` disables. */
  readonly enabled = input(true, { alias: 'lightbox', transform: booleanAttribute });
  /** Group key — figures sharing a key navigate together. */
  readonly group = input<string>('default', { alias: 'lightboxGroup' });
  readonly fullSrc = input<string>('', { alias: 'lightboxFullSrc' });
  readonly srcsetInput = input<string>('', { alias: 'lightboxSrcset' });
  readonly downloadUrl = input<string>('', { alias: 'lightboxDownload' });
  /** Show the download action in the overlay toolbar (hidden by default). */
  readonly showDownload = input(false, { alias: 'lightboxShowDownload', transform: booleanAttribute });
  /** Explicit data for non-figure hosts (override figure values when set). */
  readonly src = input<string>('', { alias: 'lightboxSrc' });
  readonly alt = input<string>('', { alias: 'lightboxAlt' });
  readonly caption = input<string>('', { alias: 'lightboxCaption' });

  private readonly figure = inject(FigureComponent, { optional: true, self: true });
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly service = inject(LightboxService);
  private entry: LightboxEntry | null = null;

  constructor() {
    // (Re)register whenever the group or enabled flag changes; clean up the prior.
    effect((onCleanup) => {
      const group = this.group();
      if (!this.enabled()) {
        this.entry = null;
        return;
      }
      const entry: LightboxEntry = {
        group,
        element: this.hostRef.nativeElement,
        item: () => this.buildItem(),
        getRect: () => this.imageRect(),
      };
      this.entry = entry;
      const off = this.service.register(entry);
      onCleanup(() => {
        off();
        if (this.entry === entry) this.entry = null;
      });
    });
  }

  protected activate(event: Event): void {
    if (!this.entry) return;
    event.preventDefault();
    this.service.open(this.group(), this.entry);
  }

  private buildItem(): LightboxItem {
    const fig = this.figure;
    return {
      url: this.src() || fig?.src() || '',
      fullSrc: this.fullSrc() || undefined,
      srcset: this.srcsetInput() || fig?.srcset() || undefined,
      alt: this.alt() || fig?.alt() || undefined,
      caption: this.caption() || fig?.caption() || undefined,
      figureNumber: fig?.figureNumber() ?? null,
      downloadUrl: this.downloadUrl() || undefined,
      showDownload: this.showDownload(),
    };
  }

  /** Rect of the rendered image inside the host (for the FLIP animation). */
  private imageRect(): DOMRect | null {
    const host = this.hostRef.nativeElement;
    const img = host.querySelector('img') ?? host;
    return img.getBoundingClientRect();
  }
}
