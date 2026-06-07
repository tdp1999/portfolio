import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Landing card surface — translucent (glass) + backdrop-blur, sized for landing
 * sections that sit above decorative backgrounds (aurora, blueprint).
 *
 * Optional `tilt` modifier: 3D rotate-on-hover with a deeper shadow stack.
 * Honours `prefers-reduced-motion`.
 */
@Component({
  selector: 'landing-card',
  standalone: true,
  template: `
    <div [class]="cardClasses()">
      <ng-content />
    </div>
  `,
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {
  readonly tilt = input<boolean>(false);

  readonly cardClasses = computed(() => (this.tilt() ? 'card card--tilt' : 'card'));
}
