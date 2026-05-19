import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingThemeToggleComponent } from '../theme';
import { ContainerComponent } from '../components/container';
import { MegaMenuComponent, type MegaMenuItem } from '../components/mega-menu';
import { LandingSelectComponent, type SelectOption } from '../components/select';
import { CommandPaletteService } from '../command-palette/command-palette.service';
import { KeyboardShortcutService } from '../keyboard/keyboard-shortcut.service';
import { LandingLocaleService } from '../locale/landing-locale.service';
import { HydrationSafeActiveDirective } from './hydration-safe-active.directive';
import type { Locale } from '@portfolio/shared/types';

const LANGUAGES: readonly SelectOption<Locale>[] = [
  { value: 'en', label: 'English', sublabel: 'en', iconName: 'globe' },
  { value: 'vi', label: 'Tiếng Việt', sublabel: 'vi', iconName: 'globe' },
];

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', path: '/', exact: true },
  { label: 'About', path: '/about' },
  { label: 'Projects', path: '/projects' },
  { label: 'Blog', path: '/blog' },
];

const SCROLL_THRESHOLD = 8;

@Component({
  selector: 'landing-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HydrationSafeActiveDirective,
    LandingThemeToggleComponent,
    ContainerComponent,
    MegaMenuComponent,
    LandingSelectComponent,
  ],
  styleUrl: './landing-header.component.scss',
  host: {
    class: 'sticky top-0 z-50 block w-full',
    '[class.pointer-events-none]': 'scrolled()',
    '(window:scroll)': 'onWindowScroll()',
  },
  template: `
    <header class="block h-16 w-full bg-transparent" role="banner">
      @if (scrolled()) {
        <!-- Scrolled state: logo pinned left, single centered pill -->
        <div class="relative h-full">
          <a
            routerLink="/"
            class="pointer-events-auto absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 inline-flex items-center rounded-full px-4 py-2 font-display text-body-lg font-medium text-landing-text-300 backdrop-blur-md transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent header-pop"
          >
            tdp.
          </a>

          <div class="flex h-full items-center justify-center">
            <div
              class="header-pill pointer-events-auto flex items-center gap-4 rounded-full border border-landing-border bg-[var(--landing-header-bg)] px-5 py-2 backdrop-blur-md shadow-sm"
            >
              <nav class="hidden items-center gap-6 md:flex" aria-label="Primary">
                @for (item of navItems; track item.path) {
                  <a
                    [routerLink]="item.path"
                    [hydrationSafeActive]="item.path"
                    [hydrationSafeActiveExact]="!!item.exact"
                    class="nav-link font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                  >
                    {{ item.label }}
                  </a>
                }
                <landing-mega-menu triggerLabel="More" align="center" [items]="moreItems()" />
              </nav>

              <span class="hidden h-4 w-px bg-landing-border md:inline-block" aria-hidden="true"></span>

              <landing-select
                [options]="languages"
                [value]="lang()"
                (valueChange)="setLang($event)"
                triggerIconName="globe"
                triggerValue="code"
                [showChevron]="false"
                align="right"
                ariaLabel="Switch language"
              />

              <button
                type="button"
                class="hidden h-9 items-center gap-1 rounded-md border border-landing-border px-2 font-mono text-mono-sm text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300 hover:border-landing-text-500 lg:inline-flex"
                (click)="palette.show()"
                [attr.aria-label]="paletteAriaLabel()"
              >
                <kbd class="font-mono pointer-events-none">{{ kbdMod() }}</kbd>
                <kbd class="font-mono pointer-events-none">K</kbd>
              </button>

              <landing-theme-toggle />
            </div>
          </div>
        </div>
      } @else {
        <!-- Top state: 3-column grid so the centre nav stays page-centred regardless of side widths -->
        <landing-container size="wide">
          <div class="grid h-16 items-center header-fade-in grid-cols-[1fr_auto_1fr]">
            <a
              routerLink="/"
              class="font-display text-body-lg font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent justify-self-start"
            >
              tdp.
            </a>

            <nav class="hidden items-center gap-8 md:flex justify-self-center" aria-label="Primary">
              @for (item of navItems; track item.path) {
                <a
                  [routerLink]="item.path"
                  [hydrationSafeActive]="item.path"
                  [hydrationSafeActiveExact]="!!item.exact"
                  class="nav-link font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                >
                  {{ item.label }}
                </a>
              }
              <landing-mega-menu triggerLabel="More" align="center" [columns]="2" [items]="moreItems()" />
            </nav>

            <div class="flex items-center gap-4 justify-self-end">
              <landing-select
                [options]="languages"
                [value]="lang()"
                (valueChange)="setLang($event)"
                triggerIconName="globe"
                triggerValue="code"
                [showChevron]="false"
                align="right"
                ariaLabel="Switch language"
              />

              <button
                type="button"
                class="hidden h-9 items-center gap-1 rounded-md border border-landing-border px-2 font-mono text-mono-sm text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300 hover:border-landing-text-500 lg:inline-flex"
                (click)="palette.show()"
                [attr.aria-label]="paletteAriaLabel()"
              >
                <kbd class="font-mono pointer-events-none">{{ kbdMod() }}</kbd>
                <kbd class="font-mono pointer-events-none">K</kbd>
              </button>

              <landing-theme-toggle />
            </div>
          </div>
        </landing-container>
      }
    </header>
  `,
})
export class LandingHeaderComponent {
  readonly resumeUrl = input<string>('');
  readonly resumeName = input<string>('CV');

  readonly navItems = NAV_ITEMS;
  readonly languages = LANGUAGES;
  readonly scrolled = signal(false);

  private readonly localeService = inject(LandingLocaleService);
  /** Current locale — bound to {@link LandingLocaleService}. */
  readonly lang = this.localeService.locale;

  protected readonly palette = inject(CommandPaletteService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  setLang(lang: Locale): void {
    this.localeService.setLocale(lang);
  }

  protected readonly kbdMod = computed(() => (this.shortcuts.isMac() ? '⌘' : 'Ctrl'));
  protected readonly paletteAriaLabel = computed(() => `Open command palette (${this.kbdMod()}+K)`);

  readonly moreItems = computed<readonly MegaMenuItem[]>(() => {
    const items: MegaMenuItem[] = [];
    const resume = this.resumeUrl();
    if (resume) {
      items.push({
        label: 'Resume',
        description: `Download my CV — ${this.resumeName() || 'PDF'}.`,
        href: resume,
        kind: 'download',
        iconName: 'download',
        featured: true,
        cta: 'Download',
      });
    }
    items.push(
      {
        label: 'Uses',
        hint: 'tools',
        href: '/uses',
      },
      {
        label: 'Contact',
        hint: 'reach me',
        href: '/',
        fragment: 'get-in-touch',
      },
      {
        label: 'Colophon',
        hint: 'behind the build',
        href: '/colophon',
      },
      {
        label: 'DDL',
        hint: 'sandbox',
        href: '/ddl',
      }
    );
    return items;
  });

  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const next = window.scrollY > SCROLL_THRESHOLD;
    if (next !== this.scrolled()) {
      this.scrolled.set(next);
    }
  }
}
