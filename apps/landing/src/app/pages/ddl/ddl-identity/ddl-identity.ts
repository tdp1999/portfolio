import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type BreadcrumbItem, Breadcrumb, Container, ThemeToggle } from '@portfolio/landing/shared/ui';

/**
 * /ddl/identity — Phase 1 of the Brand Identity epic.
 *
 * Renders all 9 candidate mark DIRECTIONS as real hand-authored SVG, each in three
 * forms (full · compact/favicon · wordmark) plus the two rubric GATES rendered live
 * (16px legibility + 1-colour knockout). One accent control recolours every mark
 * through the `--ddl-accent` custom property to prove the "config per product"
 * theme-map. Letterforms here are EXPLORATORY — the chosen direction gets a
 * custom-drawn letterform in Phase 2; this page exists to pick the direction, not
 * to ship the glyph.
 *
 * Spec: .context/plans/epic-portfolio-brand-identity.md
 */
@Component({
  selector: 'landing-ddl-identity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Breadcrumb, ThemeToggle],
  templateUrl: './ddl-identity.html',
  styleUrl: './ddl-identity.scss',
})
export class DdlIdentity {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Identity' }];

  /** Live recolour — drives `--ddl-accent` on the page root. */
  readonly accent = signal('#6e66d9');

  /** Preset accents = "what the same mark looks like on a different product". */
  readonly presets: readonly { label: string; value: string }[] = [
    { label: 'indigo · brand', value: '#6e66d9' },
    { label: 'teal', value: '#2dd4bf' },
    { label: 'amber', value: '#f59e0b' },
    { label: 'rose', value: '#f43f5e' },
    { label: 'slate · mono', value: '#94a3b8' },
  ];

  setAccent(value: string): void {
    this.accent.set(value);
  }

  onAccentInput(event: Event): void {
    this.accent.set((event.target as HTMLInputElement).value);
  }
}
