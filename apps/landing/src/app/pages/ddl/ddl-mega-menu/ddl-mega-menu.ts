import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Container, Eyebrow, Icon, Breadcrumb, SectionHeader, type BreadcrumbItem } from '@portfolio/landing/shared/ui';
import type { MoreItem } from './ddl-mega-menu.types';
import { ITEMS } from './ddl-mega-menu.data';

@Component({
  selector: 'landing-ddl-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Icon, Breadcrumb, SectionHeader],
  templateUrl: './ddl-mega-menu.html',
  styleUrl: './ddl-mega-menu.scss',
})
export class DdlMegaMenu {
  // ── Properties ─────────────────────────────────────────────────────
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Mega-menu · More dropdown' },
  ];
  readonly items = ITEMS;

  // ── Computed ───────────────────────────────────────────────────────
  readonly nonFeatured = computed(() => this.items.filter((i) => !i.featured));
  readonly featured = computed<MoreItem>(() => this.items.find((i) => i.featured) ?? this.items[0]);
}
