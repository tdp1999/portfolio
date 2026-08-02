import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CloudinaryThumbPipe, IsImagePipe, FileIconPipe } from '@portfolio/shared/ui';
import { QuickLook } from '../quick-look/quick-look';
import type { MediaPreviewItem } from './media-preview.types';
import { mediaThumbTransform, resolveMediaAlt, resolveMediaLabel } from './media-preview.util';

/**
 * The one way the console shows stored pictures.
 *
 * It owns three things that used to be re-decided (and re-got-wrong) at every
 * `<img [src]="url">` in the console:
 *
 *  - **The label.** `caption → filename → altText → Untitled`, via
 *    {@link resolveMediaLabel}. Project detail used to read `altText || 'Untitled'`
 *    and so printed "Untitled" under every asset whose alt text was unset, even
 *    though all of them had a filename.
 *  - **The size actually fetched.** A raw `<img>` downloads the original, so a
 *    3200px screenshot landed in a 230px tile. The tile width drives a Cloudinary
 *    `c_limit` transform instead (see {@link mediaThumbTransform}).
 *  - **The full-size view.** Clicking a tile opens the shared {@link QuickLook}
 *    overlay, and the whole `items` list becomes one navigable group (←/→), the
 *    same affordance the landing lightbox gives a reader.
 *
 * Pass a single-element `items` array for a one-picture slot; the overlay simply
 * has nothing to navigate to.
 */
@Component({
  selector: 'console-media-preview',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatIconModule,
    MatTooltipModule,
    CloudinaryThumbPipe,
    IsImagePipe,
    FileIconPipe,
    QuickLook,
  ],
  templateUrl: './media-preview.html',
  styleUrl: './media-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaPreview {
  readonly items = input.required<readonly MediaPreviewItem[]>();
  /** Rendered tile width in CSS px. Drives both the CSS box and the fetched size. */
  readonly tileSize = input<number>(160);
  /** Tile aspect ratio, e.g. `'4 / 3'`. Empty keeps the image's natural ratio. */
  readonly ratio = input<string>('4 / 3');
  readonly showLabel = input<boolean>(true);
  /** Open the Quick Look overlay on click. Off for decorative list-row thumbnails. */
  readonly lightbox = input<boolean>(true);
  readonly overlayTitle = input<string>('Preview');

  protected readonly openIndex = signal<number | null>(null);

  protected readonly tiles = computed(() =>
    this.items().map((item) => ({
      item,
      label: resolveMediaLabel(item),
      alt: resolveMediaAlt(item),
    }))
  );

  protected readonly thumbTransform = computed(() => mediaThumbTransform(this.tileSize()));
  /** The overlay is a full-viewport surface, so it gets a full-viewport variant. */
  protected readonly fullTransform = mediaThumbTransform(960);

  protected readonly isOpen = computed(() => this.openIndex() !== null);
  protected readonly active = computed(() => {
    const index = this.openIndex();
    return index === null ? null : (this.tiles()[index] ?? null);
  });
  protected readonly hasPrev = computed(() => (this.openIndex() ?? 0) > 0);
  protected readonly hasNext = computed(() => (this.openIndex() ?? 0) < this.tiles().length - 1);

  protected open(index: number): void {
    if (!this.lightbox()) return;
    this.openIndex.set(index);
  }

  // `QuickLook` writes `open` back to false on Esc / backdrop; mirror that into the
  // index so reopening the same tile works instead of being a no-op.
  protected onOpenChange(open: boolean): void {
    if (!open) this.openIndex.set(null);
  }

  protected prev(): void {
    this.openIndex.update((i) => (i === null ? null : Math.max(0, i - 1)));
  }

  protected next(): void {
    this.openIndex.update((i) => (i === null ? null : Math.min(this.tiles().length - 1, i + 1)));
  }
}
