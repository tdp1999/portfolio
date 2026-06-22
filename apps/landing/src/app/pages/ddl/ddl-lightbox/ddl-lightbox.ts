import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Figure, LightboxDirective } from '@portfolio/landing/shared/ui';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { GALLERY, SOLO } from './ddl-lightbox.data';

/**
 * `landing-lightbox` — opt-in full-screen viewer with carousel + zoom/pan.
 *
 * Add `[lightbox]` to any `<landing-figure>`; figures sharing a `lightboxGroup`
 * navigate together. The overlay loads the largest available candidate (srcset
 * always-best), supports double-tap / pinch / ctrl-wheel zoom, pan-when-zoomed,
 * FLIP open/close from the thumbnail, a filmstrip, and download.
 */
@Component({
  selector: 'landing-ddl-lightbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, Figure, LightboxDirective],
  templateUrl: './ddl-lightbox.html',
  styleUrl: './ddl-lightbox.scss',
})
export class DdlLightbox {
  // ── Properties ─────────────────────────────────────────────────────
  readonly gallery = GALLERY;
  readonly solo = SOLO;
}
