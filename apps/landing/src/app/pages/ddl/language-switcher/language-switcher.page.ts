import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  IconComponent,
  LandingBreadcrumbComponent,
  LandingSectionHeaderComponent,
  MegaMenuComponent,
  type BreadcrumbItem,
  type MegaMenuItem,
} from '@portfolio/landing/shared/ui';

type Lang = 'en' | 'vi';

@Component({
  selector: 'landing-language-switcher-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    EyebrowComponent,
    IconComponent,
    LandingBreadcrumbComponent,
    LandingSectionHeaderComponent,
    MegaMenuComponent,
  ],
  templateUrl: './language-switcher.page.html',
  styleUrl: './language-switcher.page.scss',
})
export class LanguageSwitcherPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Language switcher' }];

  // Independent state per variant so each demo behaves on its own.
  readonly v1Lang = signal<Lang>('en');
  readonly v2Lang = signal<Lang>('en');
  readonly v2Open = signal(false);
  readonly v3Lang = signal<Lang>('en');
  readonly v4Lang = signal<Lang>('en');
  readonly v4Open = signal(false);
  readonly v5Lang = signal<Lang>('en');
  readonly v6Lang = signal<Lang>('en');

  toggleV1(): void {
    this.v1Lang.update((l) => (l === 'en' ? 'vi' : 'en'));
  }
  setV1(lang: Lang): void {
    this.v1Lang.set(lang);
  }

  toggleV2Menu(event: MouseEvent): void {
    event.stopPropagation();
    this.v2Open.update((v) => !v);
  }
  setV2(lang: Lang): void {
    this.v2Lang.set(lang);
    this.v2Open.set(false);
  }
  closeV2(): void {
    this.v2Open.set(false);
  }

  toggleV3(): void {
    this.v3Lang.update((l) => (l === 'en' ? 'vi' : 'en'));
  }

  toggleV4Menu(event: MouseEvent): void {
    event.stopPropagation();
    this.v4Open.update((v) => !v);
  }
  setV4(lang: Lang): void {
    this.v4Lang.set(lang);
    this.v4Open.set(false);
  }
  closeV4(): void {
    this.v4Open.set(false);
  }

  toggleV5(): void {
    this.v5Lang.update((l) => (l === 'en' ? 'vi' : 'en'));
  }

  toggleV6(): void {
    this.v6Lang.update((l) => (l === 'en' ? 'vi' : 'en'));
  }

  /** Mock items for mega-menu variant to demonstrate "shared dropdown shell". */
  readonly megaMenuItems: readonly MegaMenuItem[] = [
    {
      label: 'English',
      description: 'Default — site copy in English.',
      href: '#en',
      iconName: 'globe',
    },
    {
      label: 'Tiếng Việt',
      description: 'Bản tiếng Việt — same content, localized.',
      href: '#vi',
      iconName: 'globe',
    },
  ];
}
