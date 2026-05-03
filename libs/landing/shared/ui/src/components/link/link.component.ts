import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { LandingIconArrowComponent } from '../icon/landing-icon-arrow.component';
// HMR cache-buster: ensure full re-compile of template after structural refactor.

@Component({
  selector: 'landing-link',
  standalone: true,
  imports: [LandingIconArrowComponent],
  template: `
    <a
      [class]="linkClasses()"
      [attr.href]="href()"
      [attr.target]="external() ? '_blank' : null"
      [attr.rel]="external() ? 'noopener noreferrer' : null"
      [attr.aria-current]="active() ? 'page' : null"
      (click)="onClick($event)"
    >
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
  readonly external = input<boolean>(false);
  readonly arrow = input<boolean>(false);
  readonly active = input<boolean>(false);

  private readonly router = inject(Router);

  protected readonly isRouterLink = computed(() => {
    if (this.external()) return false;
    return this.href().startsWith('/');
  });

  protected readonly arrowDirection = computed(() => (this.external() ? 'up-right' : 'right'));

  protected readonly linkClasses = computed(() => {
    const parts = ['landing-link', `landing-link--arrow-${this.arrowDirection()}`];
    if (this.active()) parts.push('landing-link--active');
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
