import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LandingThemeToggleComponent } from '../theme';

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

@Component({
  selector: 'landing-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LandingThemeToggleComponent],
  template: `
    <header class="sticky top-0 z-50 w-full bg-transparent" role="banner">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <!-- Wordmark -->
        <a
          routerLink="/"
          class="font-display text-body-lg font-medium text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent"
        >
          tdp.
        </a>

        <!-- Primary nav -->
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

        <!-- Right group -->
        <div class="flex items-center gap-4">
          <!-- Lang switcher (stub) -->
          <button
            type="button"
            class="font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300"
            aria-label="Switch language (coming soon)"
            disabled
          >
            EN
          </button>

          <!-- CTA text-link (stub) -->
          <a
            routerLink="/"
            fragment="contact"
            class="hidden font-sans text-body-sm text-landing-text-300 transition-colors duration-motion-base ease-landing-ease hover:text-landing-accent md:inline"
          >
            Get in touch
          </a>

          <!-- ⌘K hint (stub) -->
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
    </header>
  `,
})
export class LandingHeaderComponent {
  readonly navItems = NAV_ITEMS;
}
