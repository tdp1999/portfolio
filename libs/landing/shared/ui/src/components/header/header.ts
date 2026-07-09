import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { filter, map } from 'rxjs';
import { ThemeToggle } from '../theme-toggle';
import { Container } from '../container';
import { MegaMenu, type MegaMenuItem } from '../mega-menu';
import { Select } from '../select';
import { Eyebrow } from '../eyebrow';
import { CommandPaletteService } from '../command-palette/command-palette.service';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
import { HydrationSafeActiveDirective } from '../../directives/hydration-safe-active/hydration-safe-active.directive';
import { UmamiEventDirective } from '../../directives/umami-event/umami-event.directive';
import { Monogram } from '@portfolio/shared/features/brand';
import type { Locale } from '@portfolio/shared/types';
import { LANGUAGES, NAV_ITEMS, SCROLL_THRESHOLD } from './header.data';

@Component({
  selector: 'landing-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HydrationSafeActiveDirective,
    UmamiEventDirective,
    ThemeToggle,
    Container,
    MegaMenu,
    Select,
    Eyebrow,
    A11yModule,
    Monogram,
  ],
  styleUrl: './header.scss',
  host: {
    class: 'sticky top-0 z-50 block w-full',
    '[class.pointer-events-none]': 'headerScrolled()',
    '(window:scroll)': 'onWindowScroll()',
    '(document:keydown.escape)': 'closeMenu()',
  },
  template: `
    <header
      class="block h-16 w-full bg-transparent transition-colors duration-motion-base ease-landing-ease"
      [class.header-solid]="docsBarSolid()"
      role="banner"
    >
      @if (headerScrolled()) {
        <!-- Scrolled state: logo pinned left, single centered pill -->
        <div class="relative h-full">
          <!-- The pinned-left logo overlaps the docs sidebar, so it is suppressed
               on /ddl (the centred pill still carries the nav). -->
          @if (!isDocs()) {
            <a
              routerLink="/"
              class="pointer-events-auto absolute left-4 tablet:left-6 laptop:left-8 top-1/2 -translate-y-1/2 inline-flex items-center rounded-full px-4 py-2 font-display text-body-lg font-medium text-landing-text-300 backdrop-blur-md transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent header-pop"
            >
              <brand-monogram class="header-logo" />
            </a>
          }

          <div class="flex h-full items-center justify-end pr-4 tablet:justify-center tablet:pr-0">
            <div
              class="header-pill pointer-events-auto flex items-center gap-4 rounded-full border border-landing-border bg-[var(--landing-header-bg)] px-5 py-2 backdrop-blur-md shadow-sm"
            >
              <nav class="hidden items-center gap-6 tablet:flex" aria-label="Primary">
                @for (item of navItems; track item.path) {
                  <a
                    [routerLink]="item.path"
                    [hydrationSafeActive]="item.path"
                    [hydrationSafeActiveExact]="!!item.exact"
                    class="nav-link font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                    umamiEvent="nav-primary"
                    [umamiData]="{ to: item.label }"
                  >
                    {{ item.label }}
                  </a>
                }
                <landing-mega-menu triggerLabel="More" align="center" [items]="moreItems()" />
              </nav>

              <span class="hidden h-4 w-px bg-landing-border tablet:inline-block" aria-hidden="true"></span>

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
                class="hidden h-9 items-center gap-1 rounded-md border border-landing-border px-2 font-mono text-mono-sm text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300 hover:border-landing-text-500 laptop:inline-flex"
                (click)="palette.show()"
                [attr.aria-label]="paletteAriaLabel()"
                umamiEvent="palette-open"
              >
                <kbd class="font-mono pointer-events-none">{{ kbdMod() }}</kbd>
                <kbd class="font-mono pointer-events-none">K</kbd>
              </button>

              <landing-theme-toggle />

              <button
                type="button"
                class="inline-flex tablet:hidden h-9 w-9 items-center justify-center rounded-md text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent"
                (click)="openMenu()"
                aria-label="Open menu"
                umamiEvent="menu-open"
                aria-haspopup="dialog"
                aria-controls="mobile-menu-sheet"
                [attr.aria-expanded]="menuOpen()"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      } @else {
        <!-- Top state: 3-column grid so the centre nav stays page-centred regardless of side widths -->
        <landing-container size="wide">
          <!-- On /ddl the docs-nav toggle sits fixed at the top-left below laptop
               (mobile AND tablet), so the brand logo is nudged right (pl-12) to clear
               it; reset only at laptop+ where the toggle is gone and the shell becomes
               the 3-col app-shell. -->
          <div
            class="flex h-16 items-center justify-between header-fade-in tablet:grid tablet:grid-cols-[1fr_auto_1fr] laptop:pl-0"
            [class.pl-12]="isDocs()"
          >
            <a
              routerLink="/"
              class="font-display text-body-lg font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent justify-self-start inline-flex items-center"
            >
              <brand-monogram class="header-logo" />
            </a>

            <nav class="hidden items-center gap-8 tablet:flex justify-self-center" aria-label="Primary">
              @for (item of navItems; track item.path) {
                <a
                  [routerLink]="item.path"
                  [hydrationSafeActive]="item.path"
                  [hydrationSafeActiveExact]="!!item.exact"
                  class="nav-link font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                  umamiEvent="nav-primary"
                  [umamiData]="{ to: item.label }"
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
                class="hidden h-9 items-center gap-1 rounded-md border border-landing-border px-2 font-mono text-mono-sm text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300 hover:border-landing-text-500 laptop:inline-flex"
                (click)="palette.show()"
                [attr.aria-label]="paletteAriaLabel()"
                umamiEvent="palette-open"
              >
                <kbd class="font-mono pointer-events-none">{{ kbdMod() }}</kbd>
                <kbd class="font-mono pointer-events-none">K</kbd>
              </button>

              <landing-theme-toggle />

              <button
                type="button"
                class="inline-flex tablet:hidden h-9 w-9 items-center justify-center rounded-md text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent"
                (click)="openMenu()"
                aria-label="Open menu"
                umamiEvent="menu-open"
                aria-haspopup="dialog"
                aria-controls="mobile-menu-sheet"
                [attr.aria-expanded]="menuOpen()"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </landing-container>
      }
    </header>

    <!-- F1 · Mobile nav — full-screen sheet (< tablet only). Hidden on tablet+ where the
         inline nav + mega-menu take over. pointer-events-auto so it works while the host
         is pointer-events-none in the scrolled state. -->
    @if (menuOpen()) {
      <div
        id="mobile-menu-sheet"
        class="fixed inset-0 z-[60] flex flex-col tablet:hidden pointer-events-auto bg-[var(--landing-ink-0)] header-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
      >
        <div class="flex h-16 shrink-0 items-center justify-between px-6">
          <a
            routerLink="/"
            (click)="closeMenu()"
            class="font-display text-body-lg font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent inline-flex items-center"
          >
            <brand-monogram class="header-logo" />
          </a>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-md text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent"
            (click)="closeMenu()"
            aria-label="Close menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <!-- Direction C · arrow-list, airy — primary links with a trailing arrow, generous rhythm.
             max-w cap keeps the label↔arrow pairing tight across the sheet's full <tablet range
             (the sheet can be up to ~767px wide; without the cap the arrow strands far right). -->
        <nav class="flex w-full max-w-[30rem] flex-col px-6 pt-8" aria-label="Primary">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              [hydrationSafeActive]="item.path"
              [hydrationSafeActiveExact]="!!item.exact"
              (click)="closeMenu()"
              class="mobile-sheet__row nav-link flex items-center justify-between py-3 font-display text-display-sm font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent"
            >
              <span>{{ item.label }}</span>
              <span class="mobile-sheet__arrow" aria-hidden="true">→</span>
            </a>
          }
        </nav>

        <div class="flex w-full max-w-[30rem] flex-col px-6 pt-10">
          <landing-eyebrow label="More" class="mb-3 block" />
          @for (m of moreItems(); track m.label) {
            <a
              [href]="m.href"
              (click)="closeMenu()"
              class="flex items-center justify-between py-2 font-sans text-body-md text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
            >
              <span>{{ m.label }}</span>
              @if (m.hint) {
                <span class="font-mono text-mono-sm uppercase tracking-wider text-landing-text-600">{{ m.hint }}</span>
              }
            </a>
          }
        </div>

        <div class="mt-auto flex items-center gap-4 border-t border-landing-border px-6 py-6">
          <landing-select
            [options]="languages"
            [value]="lang()"
            (valueChange)="setLang($event)"
            triggerIconName="globe"
            triggerValue="code"
            [showChevron]="false"
            align="left"
            placement="up"
            ariaLabel="Switch language"
          />
          <landing-theme-toggle />
        </div>
      </div>
    }
  `,
})
export class Header {
  readonly resumeUrl = input<string>('');
  readonly resumeName = input<string>('CV');

  readonly navItems = NAV_ITEMS;
  readonly languages = LANGUAGES;
  readonly scrolled = signal(false);
  /** Mobile full-screen nav sheet (< tablet). Closed on route change, Esc, or link tap;
   *  while open it traps focus and locks background scroll. */
  readonly menuOpen = signal(false);

  private readonly localeService = inject(LandingLocaleService);
  /** Current locale — bound to {@link LandingLocaleService}. */
  readonly lang = this.localeService.locale;

  protected readonly palette = inject(CommandPaletteService);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  // Route-aware docs flag — used to suppress the scrolled pinned-left logo on the
  // /ddl docs surface, where it would overlap the docs sidebar.
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );
  protected readonly isDocs = computed(() => this.url().startsWith('/ddl'));

  // On the /ddl docs surface the header is pinned to its full top-bar state: the
  // docs shell is an app-shell (the content pane scrolls internally, the window
  // does not), so the header sits above a fixed frame and must NOT flip to the
  // floating pill. Forcing it false guarantees the top-bar even if the window
  // twitches. Marketing routes keep the scroll-driven bar↔pill behaviour.
  protected readonly headerScrolled = computed(() => !this.isDocs() && this.scrolled());

  // On /ddl the header stays a full top-bar, but at mobile the docs surface scrolls
  // the DOCUMENT (the app-shell window-lock is laptop+ only), so content slides under
  // the transparent bar. Give the bar an opaque background once scrolled there — same
  // "solidify on scroll" affordance the marketing pill provides elsewhere.
  protected readonly docsBarSolid = computed(() => this.isDocs() && this.scrolled());

  protected readonly kbdMod = computed(() => (this.shortcuts.isMac() ? '⌘' : 'Ctrl'));
  protected readonly paletteAriaLabel = computed(() => `Open command palette (${this.kbdMod()}+K)`);

  readonly moreItems = computed<readonly MegaMenuItem[]>(() => {
    const items: MegaMenuItem[] = [];
    const resume = this.resumeUrl();
    if (resume) {
      items.push({
        label: 'Resume',
        // Keep the visible copy filename-free: the real CV filename is long and
        // unbreakable (underscores), so interpolating it overflowed the hero card.
        description: 'A PDF snapshot of my experience, roles, and stack.',
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
        label: 'Blog',
        hint: 'writing',
        href: '/blog',
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

  constructor() {
    // Close the sheet on any successful navigation — covers programmatic nav and
    // browser back/forward, not just the link taps wired in the template.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.closeMenu());

    // Lock background scroll while the full-screen sheet is open (effects run in
    // the browser only, so this never touches the SSR document).
    effect(() => {
      const open = this.menuOpen();
      if (this.document.defaultView) {
        this.document.body.style.overflow = open ? 'hidden' : '';
        // Signal a full-screen overlay so fixed siblings outside this stacking
        // context (e.g. the /ddl docs-nav toggle) can hide themselves — they'd
        // otherwise poke through, since the sheet is trapped under the header's
        // own z-50 sticky stacking context.
        this.document.body.classList.toggle('overlay-open', open);
      }
    });
  }

  setLang(lang: Locale): void {
    this.localeService.setLocale(lang);
  }

  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const next = window.scrollY > SCROLL_THRESHOLD;
    if (next !== this.scrolled()) {
      this.scrolled.set(next);
    }
  }

  openMenu(): void {
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    if (this.menuOpen()) this.menuOpen.set(false);
  }
}

export type { NavItem } from './header.types';
