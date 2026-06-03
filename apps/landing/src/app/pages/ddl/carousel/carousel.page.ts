import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingCarouselComponent,
  type BreadcrumbItem,
  type GalleryImage,
} from '@portfolio/landing/shared/ui';

/**
 * `landing-carousel` — one full-feature, breakpoint-agnostic slider.
 *
 * NOT three layout variants: a single reusable component, configured via inputs
 * (peek / thumbnails / loop / dots / arrows). Responsiveness is the *consumer's*
 * job — swap components by breakpoint (Selected Work keeps the curated
 * `landing-gallery` grid on laptop+ and swaps to this carousel below).
 */
@Component({
  selector: 'landing-carousel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingBreadcrumbComponent, LandingCarouselComponent],
  templateUrl: './carousel.page.html',
  styleUrl: './carousel.page.scss',
})
export class CarouselPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Carousel — full-feature slider' },
  ];

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
}
