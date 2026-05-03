import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LandingThemeToggleComponent } from '../theme';
import { ContainerComponent } from '../components/container';

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
  { label: 'Sandbox', path: '/sandbox' },
];

const SCROLL_THRESHOLD = 8;

@Component({
  selector: 'landing-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LandingThemeToggleComponent, ContainerComponent],
  styleUrl: './landing-header.component.scss',
  host: {
    class: 'sticky top-0 z-50 block w-full',
  },
  template: `
    <header class="block h-16 w-full bg-transparent" role="banner">
      @if (scrolled()) {
        <!-- Scrolled state: logo pinned left, single centered pill -->
        <div class="relative h-full">
          <a
            routerLink="/"
            class="absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 font-display text-body-lg font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent header-pop"
          >
            tdp.
          </a>

          <div class="flex h-full items-center justify-center">
            <div
              class="header-pill flex items-center gap-4 rounded-full border border-landing-border bg-[var(--landing-header-bg)] px-5 py-2 backdrop-blur-md shadow-sm"
            >
              <nav class="hidden items-center gap-6 md:flex" aria-label="Primary">
                @for (item of navItems; track item.path) {
                  <a
                    [routerLink]="item.path"
                    routerLinkActive="text-landing-accent"
                    [routerLinkActiveOptions]="{ exact: !!item.exact }"
                    class="font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
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
                class="hidden items-center gap-1 rounded border border-landing-border px-2 py-1 font-mono text-mono-sm text-landing-text-500 lg:inline-flex"
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
        <!-- Top state: original 3-cluster layout -->
        <landing-container size="wide">
          <div class="flex h-16 items-center justify-between header-fade-in">
            <a
              routerLink="/"
              class="font-display text-body-lg font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent"
            >
              tdp.
            </a>

            <nav class="hidden items-center gap-8 md:flex" aria-label="Primary">
              @for (item of navItems; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="text-landing-accent"
                  [routerLinkActiveOptions]="{ exact: !!item.exact }"
                  class="font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
                >
                  {{ item.label }}
                </a>
              }
            </nav>

            <div class="flex items-center gap-4">
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
                class="hidden items-center gap-1 rounded border border-landing-border px-2 py-1 font-mono text-mono-sm text-landing-text-500 lg:inline-flex"
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
    const y = typeof window === 'undefined' ? 0 : window.scrollY;
    const next = y > SCROLL_THRESHOLD;
    if (next !== this.scrolled()) {
      this.scrolled.set(next);
    }
  }
}
