import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconArrow } from '../icon/icon-arrow';
import type { LandingButtonVariant, LandingButtonSize, LandingButtonArrow } from './button.types';

@Component({
  selector: 'landing-button',
  standalone: true,
  imports: [IconArrow],
  template: `
    <button type="button" [class]="buttonClasses()" [disabled]="disabled()" (click)="handleClick($event)">
      <span class="landing-btn__text"><ng-content /></span>
      @if (arrow(); as dir) {
        <span class="landing-btn__arrow-stack" aria-hidden="true">
          <landing-icon-arrow [direction]="dir" [size]="14" class="landing-btn__arrow landing-btn__arrow--ghost" />
          <landing-icon-arrow [direction]="dir" [size]="14" class="landing-btn__arrow landing-btn__arrow--lead" />
        </span>
      }
    </button>
  `,
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly variant = input<LandingButtonVariant>('solid');
  readonly size = input<LandingButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly arrow = input<LandingButtonArrow>(null);

  readonly buttonClick = output<MouseEvent>();

  // ── Derived ────────────────────────────────────────────────────────
  protected readonly buttonClasses = computed(() => {
    const parts = ['landing-btn', `landing-btn--${this.variant()}`, `landing-btn--${this.size()}`];
    const dir = this.arrow();
    if (dir) parts.push(`landing-btn--arrow-${dir}`);
    return parts.join(' ');
  });

  // ── Methods ────────────────────────────────────────────────────────
  protected handleClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.buttonClick.emit(event);
    }
  }
}

export type { LandingButtonVariant, LandingButtonSize, LandingButtonArrow } from './button.types';
