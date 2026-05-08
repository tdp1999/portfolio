import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingThemeToggleComponent } from '../theme';
import { ContainerComponent } from '../components/container';
import { HydrationSafeActiveDirective } from './hydration-safe-active.directive';

interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', exact: true },
  { label: 'Projects', path: '/projects' },
  { label: 'Uses', path: '/uses' },
  { label: 'Colophon', path: '/colophon' },
  { label: 'DDL', path: '/ddl' },
];

const SCROLL_THRESHOLD = 8;

@Component({
  selector: 'landing-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HydrationSafeActiveDirective, LandingThemeToggleComponent, ContainerComponent],
  styleUrl: './landing-header.component.scss',
  host: {
    class: 'sticky top-0 z-50 block w-full',
    '[class.pointer-events-none]': 'scrolled()',
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
              </nav>

              <span class="hidden h-4 w-px bg-landing-border md:inline-block" aria-hidden="true"></span>

              <button
                type="button"
                class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                aria-label="Switch language (coming soon)"
                disabled
              >
                EN
              </button>

              <span
                class="hidden h-9 items-center gap-1 rounded-md border border-landing-border px-2 font-mono text-mono-sm text-landing-text-500 lg:inline-flex"
                aria-hidden="true"
              >
                <kbd class="font-mono">⌘</kbd>
                <kbd class="font-mono">K</kbd>
              </span>

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
            </nav>

            <div class="flex items-center gap-4 justify-self-end">
              <button
                type="button"
                class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                aria-label="Switch language (coming soon)"
                disabled
              >
                EN
              </button>

              <a
                routerLink="/"
                fragment="contact"
                class="hidden font-sans text-body-sm text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent md:inline"
              >
                Get in touch
              </a>

              <span
                class="hidden h-9 items-center gap-1 rounded-md border border-landing-border px-2 font-mono text-mono-sm text-landing-text-500 lg:inline-flex"
                aria-hidden="true"
              >
                <kbd class="font-mono">⌘</kbd>
                <kbd class="font-mono">K</kbd>
              </span>

              <landing-theme-toggle />
            </div>
          </div>
        </landing-container>
      }
    </header>
  `,
})
export class LandingHeaderComponent {
  readonly navItems = NAV_ITEMS;
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const next = window.scrollY > SCROLL_THRESHOLD;
    if (next !== this.scrolled()) {
      this.scrolled.set(next);
    }
  }
}
