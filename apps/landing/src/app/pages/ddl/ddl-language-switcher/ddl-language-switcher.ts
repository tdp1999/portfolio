import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Icon, MegaMenu } from '@portfolio/landing/shared/ui';

import { DdlConsidered } from '../ddl-considered/ddl-considered';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { LANGUAGE_SWITCHER_VARIANTS, MEGA_MENU_ITEMS } from './ddl-language-switcher.data';
import type { Lang } from './ddl-language-switcher.types';

@Component({
  selector: 'landing-ddl-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, MegaMenu, DdlDocPage, DdlSection, DdlDecisionRecord, DdlConsidered],
  templateUrl: './ddl-language-switcher.html',
  styleUrl: './ddl-language-switcher.scss',
})
export class DdlLanguageSwitcher {
  // ── Properties ─────────────────────────────────────────────────────
  protected readonly variants = LANGUAGE_SWITCHER_VARIANTS;
  readonly megaMenuItems = MEGA_MENU_ITEMS;

  // ── State ──────────────────────────────────────────────────────────
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
}
