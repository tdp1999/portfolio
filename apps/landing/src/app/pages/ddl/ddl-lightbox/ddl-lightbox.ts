import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Container,
  Eyebrow,
  Figure,
  Breadcrumb,
  LightboxDirective,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import type { Shot } from './ddl-lightbox.types';

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
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Lightbox — full-screen viewer + zoom/carousel' },
  ];

  readonly gallery: readonly Shot[] = [
    {
      url: 'https://placehold.co/1200x900/1a2030/e2e8f0.png?text=01',
      alt: 'Permissions console overview',
      caption: 'Permissions console — role × resource matrix with inherited scopes.',
    },
    {
      url: 'https://placehold.co/1200x900/11151c/cbd5e1.png?text=02',
      alt: 'Loan document engine editor',
      caption: 'Document engine — block editor composing a loan contract template.',
    },
    {
      url: 'https://placehold.co/1200x900/1a2030/94a3b8.png?text=03',
      alt: 'Loan ops dashboard',
      caption: 'Ops dashboard — pipeline health and approval queue at a glance.',
    },
    {
      url: 'https://placehold.co/1200x900/11151c/64748b.png?text=04',
      alt: 'Mobile approval flow',
      caption: 'Mobile approval — one-tap sign-off on the go, audit trail attached.',
    },
  ];

  readonly solo: Shot = {
    url: 'https://placehold.co/1600x1000/0b0e14/cbd5e1.png?text=Solo',
    alt: 'Standalone diagram',
    caption: 'A standalone figure — opens on its own with no prev/next.',
  };
}
