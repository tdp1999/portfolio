import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Container,
  Eyebrow,
  Figure,
  Breadcrumb,
  LightboxDirective,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
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
  imports: [Container, Eyebrow, Figure, Breadcrumb, LightboxDirective],
  templateUrl: './ddl-lightbox.html',
  styleUrl: './ddl-lightbox.scss',
})
export class DdlLightbox {
  // ── Properties ─────────────────────────────────────────────────────
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Lightbox — full-screen viewer + zoom/carousel' },
  ];
  readonly gallery = GALLERY;
  readonly solo = SOLO;
}
