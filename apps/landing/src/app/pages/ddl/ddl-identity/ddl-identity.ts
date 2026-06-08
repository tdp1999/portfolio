import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type BreadcrumbItem, Breadcrumb, Container, ThemeToggle } from '@portfolio/landing/shared/ui';
import { Loader, Monogram, Motif, Signature, TDP_BRAND, Wordmark } from '@portfolio/shared/features/brand';

/**
 * /ddl/identity — showcase of the Brand system (the `@portfolio/shared/features/brand`
 * lib). Renders the live config-driven components: Monogram (`tdp.`, primary) with its
 * variants + size gates, Wordmark (`Phuong Tran`), Signature lockup, and the draw-on
 * Loader. The accent control drives `[accent]` to prove per-product theming; the theme
 * toggle checks light/dark. DDL = source of truth → these are the real components, not
 * a mock-up. Spec: .context/plans/epic-portfolio-brand-identity.md
 */
@Component({
  selector: 'landing-ddl-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Breadcrumb, ThemeToggle, Monogram, Wordmark, Signature, Loader, Motif],
  templateUrl: './ddl-identity.html',
  styleUrl: './ddl-identity.scss',
})
export class DdlIdentity {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Identity' }];

  readonly brand = TDP_BRAND;

  /** Live recolour → drives `[accent]` on every mark (per-product theming demo). */
  readonly accent = signal(TDP_BRAND.theme.accent);

  /** Loader demo — drives `[done]` so the "still working" pulse can be stopped/restarted. */
  readonly loaderDone = signal(false);

  readonly presets: readonly { label: string; value: string }[] = [
    { label: 'indigo · brand', value: '#6E66D9' },
    { label: 'teal', value: '#2dd4bf' },
    { label: 'amber', value: '#f59e0b' },
    { label: 'rose', value: '#f43f5e' },
    { label: 'slate', value: '#94a3b8' },
  ];

  setAccent(value: string): void {
    this.accent.set(value);
  }

  onAccentInput(event: Event): void {
    this.accent.set((event.target as HTMLInputElement).value);
  }
}
