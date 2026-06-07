import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Container,
  Breadcrumb,
  Heading,
  SectionHeader,
  Section,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-ddl-prose-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Section, Breadcrumb, Heading, SectionHeader],
  templateUrl: './ddl-prose-flow.html',
  styleUrl: './ddl-prose-flow.scss',
})
export class DdlProseFlow {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'DDL', href: '/ddl' },
    { label: 'Prose flow' },
  ];
}
