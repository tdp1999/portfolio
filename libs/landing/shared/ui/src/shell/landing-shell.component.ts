import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LandingHeaderComponent } from './landing-header.component';
import { LandingFooterBannerComponent } from './landing-footer-banner.component';
import { LandingFooterSignatureComponent } from './landing-footer-signature.component';
import { LandingScrollToTopComponent } from './landing-scroll-to-top.component';
import { SpotlightDirective } from '../motion';
import { type SocialLink } from '@portfolio/shared/types';
import { LandingCommandPaletteComponent } from '../command-palette/command-palette.component';
import { KeyboardShortcutService } from '../keyboard/keyboard-shortcut.service';
import { KeyboardShortcutsDirective } from '../keyboard/keyboard-shortcuts.directive';
import { LandingThemeService } from '../theme/theme.service';

@Component({
  selector: 'landing-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingHeaderComponent,
    LandingFooterBannerComponent,
    LandingFooterSignatureComponent,
    LandingScrollToTopComponent,
    SpotlightDirective,
    LandingCommandPaletteComponent,
    KeyboardShortcutsDirective,
  ],
  template: `
    <div
      class="flex min-h-screen flex-col bg-ink-0 text-landing-text-300"
      fxSpotlight
      scope="viewport"
      fxKeyboardShortcuts
    >
      <landing-header [resumeUrl]="resumeUrl()" [resumeName]="resumeName()" />
      <main class="flex-1">
        <ng-content />
      </main>
      <landing-footer-banner
        id="shell-footer-banner"
        [fullName]="fullName()"
        [tagline]="footerTagline()"
        [email]="email()"
        [socialLinks]="socialLinks()"
      />
      <landing-footer-signature [fullName]="fullName()" [socialLinks]="socialLinks()" />
      <landing-scroll-to-top />
      <landing-command-palette />
    </div>
  `,
})
export class LandingShellComponent {
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
