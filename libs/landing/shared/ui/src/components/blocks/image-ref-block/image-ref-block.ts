import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Figure } from '../../figure/figure';
import { LightboxDirective } from '../../lightbox';

/**
 * The `image-ref` prose block — a thin, dumb wrapper that composes `landing-figure`
 * with the opt-in `[lightbox]` trigger so an in-content figure gains the full-screen
 * viewer the plain `[innerHTML]` read-path could never attach (epic Phase 4; see
 * `lightbox.md §6`).
 *
 * It is **presentation only**: the AST → inputs mapping (resolving `attrs.imageId`
 * through `RenderContext.media`) lives in `image-ref-block.renderer.ts`, keeping this
 * file free of the canonical-contract dependency and trivially testable with plain
 * inputs. All prose figures share the `"prose"` lightbox group so they navigate
 * together as one carousel. An empty `src` (media id that didn't resolve) renders
 * nothing rather than a broken `<img>`.
 */
@Component({
  selector: 'landing-image-ref-block',
  standalone: true,
  imports: [Figure, LightboxDirective],
  template: `
    @if (src()) {
      <landing-figure
        [src]="src()"
        [alt]="alt()"
        [caption]="caption()"
        [cloudinaryWidth]="960"
        lightbox
        lightboxGroup="prose"
        [lightboxFullSrc]="fullSrc()"
        [lightboxSrcset]="srcset()"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageRefBlock {
  readonly src = input<string>('');
  readonly alt = input<string>('');
  readonly caption = input<string>('');
  readonly fullSrc = input<string>('');
  readonly srcset = input<string>('');
}
