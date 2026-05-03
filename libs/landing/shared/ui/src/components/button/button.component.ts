import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LandingIconArrowComponent } from '../icon/landing-icon-arrow.component';

export type LandingButtonVariant = 'solid' | 'ghost' | 'link';
export type LandingButtonSize = 'sm' | 'md';
export type LandingButtonArrow = 'right' | 'up-right' | null;

@Component({
  selector: 'landing-button',
  standalone: true,
  imports: [LandingIconArrowComponent],
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
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  readonly variant = input<LandingButtonVariant>('solid');
  readonly size = input<LandingButtonSize>('md');
  readonly disabled = input<boolean>(false);
  readonly arrow = input<LandingButtonArrow>(null);

  readonly buttonClick = output<MouseEvent>();

  protected readonly buttonClasses = computed(() => {
    const parts = ['landing-btn', `landing-btn--${this.variant()}`, `landing-btn--${this.size()}`];
    const dir = this.arrow();
    if (dir) parts.push(`landing-btn--arrow-${dir}`);
    return parts.join(' ');
  });

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.buttonClick.emit(event);
    }
  }
}
