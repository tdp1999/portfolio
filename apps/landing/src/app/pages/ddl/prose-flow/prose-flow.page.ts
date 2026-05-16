import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  LandingBreadcrumbComponent,
  LandingHeadingComponent,
  LandingSectionHeaderComponent,
  SectionComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-prose-flow-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    SectionComponent,
    LandingBreadcrumbComponent,
    LandingHeadingComponent,
    LandingSectionHeaderComponent,
  ],
  templateUrl: './prose-flow.page.html',
  styleUrl: './prose-flow.page.scss',
})
export class ProseFlowPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'DDL', href: '/ddl' },
    { label: 'Prose flow' },
  ];
}
