import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { LandingIconArrowComponent } from '../icon/landing-icon-arrow.component';

/**
 * Semantic kind of a link — auto-detected from `href` unless explicitly set.
 *
 * - `internal` — same-app route (`/foo`). Right arrow when `arrow=true`.
 * - `external` — `http(s)://` URL. Up-right arrow + `target=_blank`.
 * - `mail` — `mailto:` URL. Envelope icon prepended.
 * - `tel` — `tel:` URL. Phone icon prepended.
 * - `download` — file URL. Download icon prepended + native `download` attr.
 *   Must be set explicitly (no href prefix to detect).
 * - `anchor` — same-page hash (`#section`). No auto icon.
 */
export type LandingLinkKind = 'internal' | 'external' | 'mail' | 'tel' | 'download' | 'anchor';

@Component({
  selector: 'landing-link',
  standalone: true,
  imports: [IconComponent, LandingIconArrowComponent],
  template: `
    <a
      [class]="linkClasses()"
      [attr.href]="href()"
      [attr.target]="isExternal() ? '_blank' : null"
      [attr.rel]="isExternal() ? 'noopener noreferrer' : null"
      [attr.aria-current]="active() ? 'page' : null"
      [attr.download]="resolvedKind() === 'download' ? '' : null"
      (click)="onClick($event)"
    >
      @if (actionIconName(); as iconName) {
        <landing-icon [name]="iconName" [size]="14" class="landing-link__action-icon" aria-hidden="true" />
      }
      <span class="landing-link__text"><ng-content /></span>
      @if (arrow()) {
        <span class="landing-link__arrow-stack" aria-hidden="true">
          <landing-icon-arrow
            [direction]="arrowDirection()"
            [size]="14"
            class="landing-link__arrow landing-link__arrow--ghost"
          />
          <landing-icon-arrow
            [direction]="arrowDirection()"
            [size]="14"
            class="landing-link__arrow landing-link__arrow--lead"
          />
        </span>
      }
    </a>
  `,
  styleUrl: './link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingLinkComponent {
  readonly href = input<string>('#');
  /** Force kind=external (target=_blank). Kept for backward compat — auto-detected from `http(s)://` prefix. */
  readonly external = input<boolean>(false);
  /** Trailing arrow stack (lift-off effect). Opt-in affordance for nav links. Ignored for mail/tel/download
   *  (the prepended action icon is the affordance). */
  readonly arrow = input<boolean>(false);
  readonly active = input<boolean>(false);
  /** Explicit kind override. When unset, kind is auto-detected from `href`. Required for `download`
   *  (no URL prefix to detect from). */
  readonly kind = input<LandingLinkKind | null>(null);
  /**
   * Inline-prose mode — the link inherits `font-size` and `line-height` from
   * its parent paragraph so it sits on the same baseline as the surrounding
   * text. Font-family stays mono so the "terminal/path" voice is preserved.
   * Use whenever a `<landing-link>` is embedded inside body prose.
   */
  readonly inline = input<boolean>(false);

  private readonly router = inject(Router);

  protected readonly resolvedKind = computed<LandingLinkKind>(() => {
    const explicit = this.kind();
    if (explicit) return explicit;
    if (this.external()) return 'external';
    const href = this.href();
    if (href.startsWith('mailto:')) return 'mail';
    if (href.startsWith('tel:')) return 'tel';
    if (href.startsWith('#')) return 'anchor';
    if (/^https?:\/\//.test(href)) return 'external';
    return 'internal';
  });

  protected readonly isExternal = computed(() => this.resolvedKind() === 'external');

  protected readonly isRouterLink = computed(() => {
    if (this.isExternal()) return false;
    return this.href().startsWith('/');
  });

  protected readonly arrowDirection = computed(() => (this.isExternal() ? 'up-right' : 'right'));

  protected readonly actionIconName = computed<string | null>(() => {
    switch (this.resolvedKind()) {
      case 'mail':
        return 'mail';
      case 'tel':
        return 'phone';
      case 'download':
        return 'download';
      default:
        return null;
    }
  });

  protected readonly linkClasses = computed(() => {
    const parts = [
      'landing-link',
      `landing-link--arrow-${this.arrowDirection()}`,
      `landing-link--${this.resolvedKind()}`,
    ];
    if (this.active()) parts.push('landing-link--active');
    if (this.inline()) parts.push('landing-link--inline');
    return parts.join(' ');
  });

  protected onClick(event: MouseEvent): void {
    if (!this.isRouterLink()) return;
    // Allow native browser behavior for middle-click and modifier-click (open in new tab, etc.)
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void this.router.navigateByUrl(this.href());
  }
}
