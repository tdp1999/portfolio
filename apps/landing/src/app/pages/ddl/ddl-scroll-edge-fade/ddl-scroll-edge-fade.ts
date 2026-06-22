import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollEdgeFadeDirective } from '@portfolio/landing/shared/ui';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

/**
 * `landingScrollEdgeFade` — reusable overflow affordance for scroll containers.
 *
 * Graduated from the home Selected Work tab strip (responsive review, 2026-06).
 * Demonstrates: fade-only, fade + clickable chevron indicators, and a vertical axis.
 */
@Component({
  selector: 'landing-ddl-scroll-edge-fade',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, ScrollEdgeFadeDirective],
  templateUrl: './ddl-scroll-edge-fade.html',
  styleUrl: './ddl-scroll-edge-fade.scss',
})
export class DdlScrollEdgeFade {
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
