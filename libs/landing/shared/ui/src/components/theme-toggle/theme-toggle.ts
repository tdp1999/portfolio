import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LandingThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'landing-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-landing-border text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:border-landing-border-strong hover:text-landing-text-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="isDark()"
      (click)="toggle()"
    >
      @if (isDark()) {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      } @else {
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggle {
  private readonly themeService = inject(LandingThemeService);

  readonly isDark = computed(() => this.themeService.theme() === 'dark');
  readonly ariaLabel = computed(() => (this.isDark() ? 'Switch to light theme' : 'Switch to dark theme'));

  toggle(): void {
    this.themeService.toggle();
  }
}
