import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container, Eyebrow, Icon, Breadcrumb, SectionHeader, type BreadcrumbItem } from '@portfolio/landing/shared/ui';

interface MoreItem {
  readonly label: string;
  readonly description: string;
  readonly hint?: string;
  readonly iconName: string;
  readonly meta?: string;
  readonly featured?: boolean;
}

const ITEMS: readonly MoreItem[] = [
  {
    label: 'Uses',
    description: 'Hardware, editor, services I lean on daily.',
    hint: 'tools',
    iconName: 'briefcase',
    meta: 'page',
  },
  {
    label: 'Contact',
    description: 'Email, social, and the fastest way to reach me.',
    hint: 'reach me',
    iconName: 'mail',
    meta: '/#contact',
  },
  {
    label: 'Colophon',
    description: 'The stack and tooling behind this site.',
    hint: 'behind the build',
    iconName: 'code',
    meta: 'site',
  },
  {
    label: 'DDL',
    description: 'Design sandbox — primitives, prototypes, picks.',
    hint: 'sandbox',
    iconName: 'layout-grid',
    meta: 'specimen',
  },
  {
    label: 'Resume',
    description: 'Download my CV (PDF).',
    hint: 'CV / 120kb',
    iconName: 'download',
    meta: 'download',
    featured: true,
  },
];

@Component({
  selector: 'landing-ddl-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Icon, Breadcrumb, SectionHeader],
  templateUrl: './ddl-mega-menu.html',
  styleUrl: './ddl-mega-menu.scss',
})
export class DdlMegaMenu {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Mega-menu · More dropdown' },
  ];

  readonly items = ITEMS;
  readonly nonFeatured = ITEMS.filter((i) => !i.featured);
  readonly featured: MoreItem = ITEMS.find((i) => i.featured) ?? ITEMS[0];
}
