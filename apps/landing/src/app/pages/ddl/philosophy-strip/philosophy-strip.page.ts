import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

/**
 * §6b Philosophy strip — direction variants.
 *
 * Current production strip ([philosophy] = bioShort) is a centered text block
 * that visually merges with §6 Story above and re-says credo content already
 * carried by §3 Bio Card OUTLOOK and §6 Story's italic closing line.
 *
 * Variants below reframe the slot from "third credo restatement" to a structural
 * beat: pause / sign-off / coda. Each variant is rendered inside a
 * Story-tail → variant → CTA-preview sandwich so the transition reads in
 * context, not in isolation.
 */
@Component({
  selector: 'landing-philosophy-strip-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingBreadcrumbComponent],
  templateUrl: './philosophy-strip.page.html',
  styleUrl: './philosophy-strip.page.scss',
})
export class PhilosophyStripPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: '§06b · Philosophy strip — direction variants' },
  ];
}
