import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ButtonComponent,
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingGlobeComponent,
  LandingHeadingComponent,
  LandingLinkComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

/**
 * §07 Get in Touch — direction variants.
 *
 * Current production §7 has an empty right column and channel-row redundancy
 * with both the footer and the §3 bio card. Variants explore:
 *
 *   V1  Static globe constellation (HCMC · SGN · SYD) — pulsing nodes
 *   V2  Drag-rotate globe — interactive proxy for production globe.gl
 *   V3  Info panel — no globe, status + served-from chips + response window
 *
 * Globe logic + land grid lives in <landing-globe> (shared UI). The DDL page
 * is now just composition: layout grid + variant labels + globe vs panel.
 */
@Component({
  selector: 'landing-get-in-touch-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    ContainerComponent,
    EyebrowComponent,
    LandingBreadcrumbComponent,
    LandingGlobeComponent,
    LandingHeadingComponent,
    LandingLinkComponent,
  ],
  templateUrl: './get-in-touch.page.html',
  styleUrl: './get-in-touch.page.scss',
})
export class GetInTouchPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: '§07 · Get in Touch — direction variants' },
  ];
}
