import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Carousel, CarouselSlide, type GalleryImage } from '@portfolio/landing/shared/ui';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';
import type { DemoCard } from './ddl-carousel.types';

/**
 * `landing-carousel` — one full-feature, breakpoint-agnostic slider.
 *
 * NOT three layout variants: a single reusable component, configured via inputs
 * (peek / thumbnails / loop / dots / arrows). Responsiveness is the *consumer's*
 * job — swap components by breakpoint (Selected Work keeps the curated
 * `landing-gallery` grid on laptop+ and swaps to this carousel below).
 */
@Component({
  selector: 'landing-ddl-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, DdlStage, Carousel, CarouselSlide],
  templateUrl: './ddl-carousel.html',
  styleUrl: './ddl-carousel.scss',
})
export class DdlCarousel {
  readonly slides: readonly GalleryImage[] = [
    {
      url: 'https://placehold.co/960x720/1a2030/e2e8f0.png?text=01',
      alt: 'Permissions console overview',
      caption: 'Permissions console — role × resource matrix with inherited scopes.',
    },
    {
      url: 'https://placehold.co/960x720/11151c/cbd5e1.png?text=02',
      alt: 'Loan document engine editor',
      caption: 'Document engine — block editor composing a loan contract template.',
    },
    {
      url: 'https://placehold.co/960x720/1a2030/94a3b8.png?text=03',
      alt: 'Loan ops dashboard',
      caption: 'Ops dashboard — pipeline health and approval queue at a glance.',
    },
    {
      url: 'https://placehold.co/960x720/11151c/64748b.png?text=04',
      alt: 'Mobile approval flow',
      caption: 'Mobile approval — one-tap sign-off on the go, audit trail attached.',
    },
  ];

  /** Content-mode demo data — arbitrary cards (here: links), not images. */
  readonly cards: readonly DemoCard[] = [
    {
      href: '/ddl/carousel',
      image: 'https://placehold.co/640x360/1a2030/e2e8f0.png?text=01',
      meta: '8 MIN · ARCHITECTURE',
      title: 'Designing the permissions matrix',
      excerpt: 'Role × resource, inherited scopes, and the audit trail that ties them together.',
    },
    {
      href: '/ddl/carousel',
      image: 'https://placehold.co/640x360/11151c/cbd5e1.png?text=02',
      meta: '12 MIN · ENGINEERING',
      title: 'A block editor for loan contracts',
      excerpt: 'Composable blocks that render to a signed PDF without losing the template.',
    },
    {
      href: '/ddl/carousel',
      image: 'https://placehold.co/640x360/1a2030/94a3b8.png?text=03',
      meta: '6 MIN · INFRA',
      title: 'Shipping SSR on Railway',
      excerpt: 'A short note.',
    },
    {
      href: '/ddl/carousel',
      image: 'https://placehold.co/640x360/11151c/64748b.png?text=04',
      meta: '5 MIN · DESIGN SYSTEM',
      title: 'The carousel that grew up',
      excerpt: 'From image-only slider to a content-projection carousel — same mechanics, new slides.',
    },
  ];
}
