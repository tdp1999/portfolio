import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  ScrollEdgeFadeDirective,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

/**
 * `landingScrollEdgeFade` — reusable overflow affordance for scroll containers.
 *
 * Graduated from the home Selected Work tab strip (responsive review, 2026-06).
 * Demonstrates: fade-only, fade + clickable chevron indicators, and a vertical axis.
 */
@Component({
  selector: 'landing-scroll-edge-fade-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingBreadcrumbComponent, ScrollEdgeFadeDirective],
  templateUrl: './scroll-edge-fade.page.html',
  styleUrl: './scroll-edge-fade.page.scss',
})
export class ScrollEdgeFadePage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Scroll edge fade — overflow affordance' },
  ];

  /** Long, wide labels so the strips overflow at any viewport width. */
  readonly tabs: readonly string[] = [
    'Permissions Console',
    'Loan Document Engine',
    'Block Editor',
    'Loan Ops Dashboard',
    'Design Bank',
    'Contract Compare',
    'TDP Plugins',
    'Portfolio Monorepo',
  ];

  readonly rows: readonly string[] = Array.from({ length: 14 }, (_, i) => `Row ${i + 1}`);
}
