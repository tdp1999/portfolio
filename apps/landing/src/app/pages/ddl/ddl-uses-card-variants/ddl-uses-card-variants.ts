import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Container,
  Eyebrow,
  Icon,
  Breadcrumb,
  IconArrow,
  SectionHeader,
  SectionRule,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { SAMPLE_CATEGORIES } from './ddl-uses-card-variants.data';

@Component({
  selector: 'landing-ddl-uses-card-variants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Icon, Breadcrumb, IconArrow, SectionHeader, SectionRule],
  templateUrl: './ddl-uses-card-variants.html',
  styleUrl: './ddl-uses-card-variants.scss',
})
export class DdlUsesCardVariants {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Uses — card variants' }];
  readonly categories = SAMPLE_CATEGORIES;
  readonly sampleEntry = SAMPLE_CATEGORIES[0].entries[0];
}
