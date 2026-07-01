import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Gallery } from '../../gallery/gallery';
import type { GalleryImage } from '../../gallery/gallery.types';

/**
 * The `gallery` prose block — a thin, dumb wrapper over the lightbox-enabled
 * `landing-gallery` (epic Phase 4). This is the **second** registered block that
 * demonstrates "add a block = one registry entry"; it is dormant until content can
 * author a gallery (see `GALLERY_TYPE` in `rte-core/portable`).
 *
 * Presentation only — the AST → inputs mapping (resolving `attrs.imageIds` through
 * `RenderContext.media`) lives in `gallery-block.renderer.ts`. Lightbox is always on
 * for in-content galleries; an empty image list renders nothing.
 */
@Component({
  selector: 'landing-gallery-block',
  standalone: true,
  imports: [Gallery],
  template: `
    @if (images().length > 0) {
      <landing-gallery [images]="images()" [numbered]="numbered()" [lightbox]="true" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalleryBlock {
  readonly images = input<readonly GalleryImage[]>([]);
  readonly numbered = input<boolean>(true);
}
