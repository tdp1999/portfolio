import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Header } from '../header/header';
import { FooterBanner } from '../footer-banner/footer-banner';
import { FooterSignature } from '../footer-signature/footer-signature';
import { ScrollToTop } from '../scroll-to-top/scroll-to-top';
import { SpotlightDirective } from '../../directives/spotlight/spotlight.directive';
import { type SocialLink } from '@portfolio/shared/types';
import { CommandPalette } from '../command-palette/command-palette';
import { KeyboardShortcutService } from '../../services/keyboard/keyboard-shortcut.service';
import { KeyboardShortcutsDirective } from '../../directives/keyboard-shortcuts/keyboard-shortcuts.directive';
import { LandingThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'landing-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Header,
    FooterBanner,
    FooterSignature,
    ScrollToTop,
    SpotlightDirective,
    CommandPalette,
    KeyboardShortcutsDirective,
  ],
  template: `
    <div
      class="flex min-h-screen flex-col bg-ink-0 text-landing-text-300"
      fxSpotlight
      fxSpotlightScope="viewport"
      fxKeyboardShortcuts
    >
      <landing-header [resumeUrl]="resumeUrl()" [resumeName]="resumeName()" />
      <main class="flex-1">
        <ng-content />
      </main>
      @if (!isDocs()) {
        <landing-footer-banner
          id="shell-footer-banner"
          [fullName]="fullName()"
          [tagline]="footerTagline()"
          [email]="email()"
          [socialLinks]="socialLinks()"
        />
        <landing-footer-signature [fullName]="fullName()" [socialLinks]="socialLinks()" />
      }
      <landing-scroll-to-top />
      <landing-command-palette />
    </div>
  `,
})
export class Shell {
  readonly fullName = input<string>('');
  readonly email = input<string>('');
  readonly footerTagline = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);
  readonly resumeUrl = input<string>('');
  readonly resumeName = input<string>('CV');

  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly theme = inject(LandingThemeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // The DDL docs route renders its own footer inside its content column, so the
  // shell's full-width marketing footer is suppressed there (it would otherwise
  // bleed below the docs sidebar). Header + command palette stay.
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );
  protected readonly isDocs = computed(() => this.url().startsWith('/ddl'));

  constructor() {
    // Register baseline app-wide shortcuts. The command palette surfaces these
    // automatically as Actions. Adding more = register here (or anywhere else).
    const disposers = [
      this.shortcuts.register({
        id: 'theme-toggle',
        description: 'Toggle theme',
        keys: ['mod+shift+l'],
        category: 'Appearance',
        iconName: 'sun',
        handler: () => this.theme.toggle(),
      }),
      this.shortcuts.register({
        id: 'go-home',
        description: 'Go to Home',
        keys: ['mod+shift+h'],
        category: 'Navigation',
        iconName: 'home',
        handler: () => void this.router.navigate(['/']),
      }),
      this.shortcuts.register({
        id: 'go-projects',
        description: 'Go to Projects',
        keys: ['mod+shift+p'],
        category: 'Navigation',
        iconName: 'folder-open',
        handler: () => void this.router.navigate(['/projects']),
      }),
      this.shortcuts.register({
        id: 'go-ddl',
        description: 'Go to DDL (design sandbox)',
        keys: ['mod+shift+d'],
        category: 'Navigation',
        iconName: 'layout-grid',
        handler: () => void this.router.navigate(['/ddl']),
      }),
    ];
    this.destroyRef.onDestroy(() => disposers.forEach((d) => d()));
  }
}
